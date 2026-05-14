import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState({});
  const appState = useRef(AppState.currentState);

  // Handle app state changes for session refresh
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Supabase v2 handles refresh automatically if configured
        // supabase.auth.startAutoRefresh(); 
      } else {
        // supabase.auth.stopAutoRefresh();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  // Safety timeout: never let loading stay true forever
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // PGRST116 = no rows returned — profile row is missing, create it as a fallback
      if (error && error.code === 'PGRST116') {
        console.warn('[AuthContext] No profile row found — creating fallback profile...');
        
        // Get auth user metadata to populate the new row
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const username =
          authUser?.user_metadata?.username ||
          authUser?.email?.split('@')[0] ||
          'user';
        const role = authUser?.user_metadata?.role || 'user';

        const { error: insertError } = await supabase
          .from('users')
          .insert({ id: userId, username, role });

        if (insertError) {
          console.error('[AuthContext] fallback profile insert failed:', insertError);
          throw insertError;
        }

        // Re-fetch the newly created row
        const { data: newProfile, error: refetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (refetchError) throw refetchError;
        setProfile(newProfile);
        setUser(newProfile);
        return;
      }

      if (error) throw error;
      setProfile(data);
      setUser(data);
    } catch (err) {
      console.error('[AuthContext] fetchProfile error:', err);
      // If profile fetch fails, we still want to stop loading
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Check if email is locked out from too many failed attempts
   */
  function isLockedOut(email) {
    const attempts = loginAttempts[email];
    if (!attempts) return false;
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const elapsed = Date.now() - attempts.lastAttempt;
      if (elapsed < LOCKOUT_DURATION_MS) {
        const remaining = Math.ceil((LOCKOUT_DURATION_MS - elapsed) / 60000);
        return { locked: true, minutesRemaining: remaining };
      } else {
        // Lockout expired, reset
        setLoginAttempts((prev) => {
          const next = { ...prev };
          delete next[email];
          return next;
        });
        return { locked: false };
      }
    }
    return { locked: false };
  }

  function recordFailedAttempt(email) {
    setLoginAttempts((prev) => {
      const current = prev[email] || { count: 0, lastAttempt: 0 };
      return {
        ...prev,
        [email]: {
          count: current.count + 1,
          lastAttempt: Date.now(),
        },
      };
    });
  }

  function clearLoginAttempts(email) {
    setLoginAttempts((prev) => {
      const next = { ...prev };
      delete next[email];
      return next;
    });
  }

  /**
   * Sign in with email/password
   * Returns { success, role, error }
   */
  async function signIn(email, password) {
    console.log('[AuthContext] signIn started for:', email);
    const lockout = isLockedOut(email);
    if (lockout?.locked) {
      return {
        success: false,
        error: `Too many failed attempts. Please try again in ${lockout.minutesRemaining} minute(s).`,
      };
    }

    try {
      console.log('[AuthContext] Calling supabase.auth.signInWithPassword...');
      
      // Add a 15-second timeout to the Supabase call
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timed out')), 20000)
      );

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]);
      
      if (error) {
        console.error('[AuthContext] signIn error:', error.message);
        recordFailedAttempt(email);
        return { success: false, error: 'Invalid email or password. Please try again.' };
      }

      console.log('[AuthContext] signIn successful, fetching profile...');
      clearLoginAttempts(email);
      
      // We manually fetch profile here to return the role immediately
      // Added a 10s timeout to this specific query
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      const profileTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timed out')), 10000)
      );

      const { data: profileData, error: profileError } = await Promise.race([profilePromise, profileTimeout]);

      if (profileError) {
        console.error('[AuthContext] profile fetch error:', profileError.message);
        
        // If profile is missing, we might be able to still log them in if we know their role
        // or we can try to create it as a last resort (though this usually requires RLS)
        if (profileError.code === 'PGRST116') {
           return { success: false, error: 'User profile not found. Please contact support.' };
        }
        
        return { success: false, error: `Profile error: ${profileError.message}` };
      }

      console.log('[AuthContext] profile loaded, role:', profileData.role);
      setProfile(profileData);
      setUser(profileData);
      return { success: true, role: profileData.role };
    } catch (err) {
      console.error('[AuthContext] unexpected signIn error:', err);
      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred. Please try again.' 
      };
    }
  }

  /**
   * Sign up a new user
   * Returns { success, error }
   */
  async function signUp(email, password, username) {
    console.log('[AuthContext] signUp started for:', email);
    try {
      // Add a 15-second timeout to the Supabase call
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, role: 'user' },
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign up timed out')), 15000)
      );

      const { data, error } = await Promise.race([signUpPromise, timeoutPromise]);

      if (error) {
        console.error('[AuthContext] signUp error:', error.message);
        if (error.message.includes('already registered')) {
          return { success: false, error: 'An account with this email already exists.' };
        }
        return { success: false, error: error.message || 'Failed to create account. Please try again.' };
      }

      console.log('[AuthContext] signUp successful');
      return { success: true };
    } catch (err) {
      console.error('[AuthContext] unexpected signUp error:', err);
      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred. Please try again.' 
      };
    }
  }

  /**
   * Sign out
   */
  async function signOut() {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('[AuthContext] signOut error:', err);
    }
  }

  /**
   * Refresh profile data
   */
  async function refreshProfile() {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }

  const value = {
    session,
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isUser: profile?.role === 'user',
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
