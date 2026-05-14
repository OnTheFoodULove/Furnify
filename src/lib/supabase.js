import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  const msg = `[Supabase] CONFIG ERROR:\nURL: ${supabaseUrl ? 'Length ' + supabaseUrl.length : 'MISSING'}\nKey: ${supabaseAnonKey ? 'Length ' + supabaseAnonKey.length : 'MISSING'}\n` +
    'Please RESTART your dev server (npm run web) after editing .env.';
  console.error(msg);
  if (typeof window !== 'undefined' && window.alert && !window.__supabase_alerted) {
    window.alert(msg);
    window.__supabase_alerted = true;
  }
}

console.log('[Supabase] URL Start:', supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'NONE');
console.log('[Supabase] Key Start:', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'NONE');

// Storage Cleanup: Remove conflicting tokens from other Supabase projects (Web only)
if (typeof window !== 'undefined' && window.localStorage && supabaseUrl) {
  try {
    const currentProjectId = supabaseUrl.split('//')[1]?.split('.')[0];
    if (currentProjectId) {
      const keys = Object.keys(window.localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token') && !key.includes(currentProjectId)) {
          console.log(`[Supabase] Removing conflicting storage key: ${key}`);
          window.localStorage.removeItem(key);
        }
      });
    }
  } catch (e) {
    console.warn('[Supabase] Storage cleanup failed:', e);
  }
}

// Robust storage selection for Web vs Native
const customStorage = {
  getItem: async (key) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key, value) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      storage: customStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storageKey: supabaseUrl ? `sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token` : undefined,
    },
  }
);

// Connectivity check
(async () => {
  try {
    console.log('[Supabase] Testing connection...');
    
    const checkPromise = supabase.from('users').select('count', { count: 'exact', head: true });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection test timed out')), 5000)
    );

    const { data, error } = await Promise.race([checkPromise, timeoutPromise]);
    
    if (error) {
      console.warn('[Supabase] Connection test warning:', error.message);
    } else {
      console.log('[Supabase] Connection test: SUCCESS');
    }
  } catch (err) {
    console.warn('[Supabase] Connection test non-critical failure:', err.message);
  }
})();

/**
 * Upload an image to Supabase Storage
 */
export async function uploadImage(bucket, fileName, uri, contentType = 'image/jpeg') {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { url: urlData.publicUrl, error: null };
  } catch (err) {
    console.error('[uploadImage]', err);
    return { url: null, error: 'Failed to upload image. Please try again.' };
  }
}

/**
 * Log an admin activity via Edge Function (or fallback to direct insert)
 */
export async function logActivity(action, furnitureName) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Try Edge Function first
    const edgeFnUrl = `${supabaseUrl}/functions/v1/log-activity`;
    const response = await fetch(edgeFnUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ action, furniture_name: furnitureName }),
    });

    if (!response.ok) {
      // Fallback: direct insert (less secure but functional without deployed Edge Fn)
      await supabase.from('activity_logs').insert({
        admin_id: session.user.id,
        action,
        furniture_name: furnitureName,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('[logActivity]', err);
    // Non-critical: don't throw
  }
}
