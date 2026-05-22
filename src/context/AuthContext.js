import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const AUTH_TIMEOUT_MS = 30000; // 30 seconds (accommodates Supabase free-tier cold starts)

/**
 * Wraps a promise with a timeout. Rejects with a clear message if it takes too long.
 */
function withTimeout(promise, ms = AUTH_TIMEOUT_MS, label = 'Request') {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out. Please check your connection and try again.`)), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * Fire-and-forget ping to wake up the Supabase DB (free tier cold starts).
 * This runs in parallel with the auth call so it doesn't block the UI.
 */
function wakeDatabase() {
  supabase.from('users').select('count', { count: 'exact', head: true }).then(() => {
    console.log('[AuthContext] DB wake-up ping sent');
  }).catch(() => {
    // Non-critical, ignore errors
  });
}

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
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error) throw error;
        
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('[AuthContext] Initial session check failed:', err);
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('[AuthContext] Auth state change:', event);
        
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

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId) {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('[AuthContext] fetchProfile for:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // PGRST116 = no rows returned — profile row is missing, create it as a fallback
      if (error && error.code === 'PGRST116') {
        console.warn('[AuthContext] No profile row found — creating fallback profile...');
        
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
          setLoading(false);
          return;
        }

        const { data: newProfile, error: refetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (refetchError) throw refetchError;

        // Enrich with auth email
        const { data: { user: authUserFresh } } = await supabase.auth.getUser();
        const enriched = { ...newProfile, email: newProfile.email || authUserFresh?.email };
        setProfile(enriched);
        setUser(enriched);
        setLoading(false);
        return;
      }

      if (error) throw error;

      // Enrich profile with auth email
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const metaRole = authUser?.user_metadata?.role;
      let profileData = data;

      // Auto-sync role if auth metadata has 'admin' but database profile has 'user'
      if (data && metaRole === 'admin' && data.role !== 'admin') {
        console.log('[AuthContext] Syncing database profile role to admin...');
        const { data: updatedProfile, error: syncError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', userId)
          .select()
          .single();
        if (!syncError && updatedProfile) {
          profileData = updatedProfile;
        } else {
          console.error('[AuthContext] Failed to sync database profile role:', syncError);
        }
      }

      const enriched = { ...profileData, email: profileData.email || authUser?.email };
      setProfile(enriched);
      setUser(enriched);
      setLoading(false); // SUCCESS
    } catch (err) {
      console.error('[AuthContext] fetchProfile error:', err);
      setProfile(null);
      setLoading(false); // STOP SPINNER EVEN ON ERROR
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
      
      wakeDatabase();

      let data, error;
      let lastErr;

      // Retry up to 2 times (handles cold-start timeouts on free tier)
      for (let attempt = 1; attempt <= 2; attempt++) {
        console.log(`[AuthContext] signIn attempt ${attempt}...`);
        try {
          ({ data, error } = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            AUTH_TIMEOUT_MS,
            `Sign in (attempt ${attempt})`
          ));
          break;
        } catch (timeoutErr) {
          lastErr = timeoutErr;
          console.warn(`[AuthContext] signIn attempt ${attempt} timed out:`, timeoutErr.message);
          if (attempt < 2) {
            console.log('[AuthContext] Retrying after 1s...');
            await new Promise((res) => setTimeout(res, 1000));
          }
        }
      }

      if (!data && lastErr) throw lastErr;
      
      if (error) {
        console.error('[AuthContext] signIn error:', error.message);
        recordFailedAttempt(email);
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          return { success: false, error: 'Please verify your email before signing in. Check your inbox for a confirmation link.' };
        }
        return { success: false, error: 'Invalid email or password. Please try again.' };
      }

      console.log('[AuthContext] signIn successful');
      clearLoginAttempts(email);

      let role = data.user.user_metadata?.role || 'user';
      try {
        const { data: profileData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        if (profileData?.role) {
          role = profileData.role;
        }

        // Auto-sync database profile role during sign in
        if (data.user.user_metadata?.role === 'admin' && role !== 'admin') {
          console.log('[AuthContext] Syncing database profile role to admin during signIn...');
          await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', data.user.id);
          role = 'admin';
        }
      } catch (err) {
        console.warn('[AuthContext] Could not fetch fresh role during signIn, using metadata fallback.');
      }

      console.log('[AuthContext] role from DB/metadata:', role);
      return { success: true, role };
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
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, role: 'user' },
          },
        }),
        AUTH_TIMEOUT_MS,
        'Sign up'
      );

      if (error) {
        console.error('[AuthContext] signUp error:', error.message);
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
        }
        return { success: false, error: error.message || 'Failed to create account. Please try again.' };
      }

      if (data?.user?.identities?.length === 0) {
        console.warn('[AuthContext] signUp: email already registered (unconfirmed)');
        return { success: false, error: 'An account with this email already exists. Please sign in or check your inbox for a confirmation email.' };
      }

      console.log('[AuthContext] signUp successful, confirmation email sent:', !data?.session);
      return { success: true, needsConfirmation: !data?.session };
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

  /**
   * Mark the current user's onboarding as seen in the database.
   * Called once from WelcomeScreen on new accounts.
   */
  async function markOnboardingSeen() {
    if (!profile?.id) return;
    try {
      await supabase
        .from('users')
        .update({ has_seen_onboarding: true })
        .eq('id', profile.id);
      setProfile((prev) => ({ ...prev, has_seen_onboarding: true }));
      setUser((prev) => ({ ...prev, has_seen_onboarding: true }));
    } catch (err) {
      console.error('[AuthContext] markOnboardingSeen error:', err);
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
    markOnboardingSeen,
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
