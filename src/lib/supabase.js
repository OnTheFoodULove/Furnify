import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error(
    `[Supabase] CONFIG ERROR: URL=${supabaseUrl ? 'OK' : 'MISSING'} Key=${supabaseAnonKey ? 'OK' : 'MISSING'}\n` +
    'Restart the dev server after editing .env'
  );
}

console.log('[Supabase] Platform:', Platform.OS);
console.log('[Supabase] URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NONE');

// Storage Cleanup: Remove conflicting tokens from other Supabase projects (Web only)
if (typeof window !== 'undefined' && window.localStorage && supabaseUrl) {
  try {
    const currentProjectId = supabaseUrl.split('//')[1]?.split('.')[0];
    if (currentProjectId) {
      Object.keys(window.localStorage).forEach(key => {
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

/**
 * ROOT CAUSE FIX:
 * supabase-js v2 uses an internal lock mechanism during auth operations.
 * On Expo Web, passing AsyncStorage as the storage adapter causes a deadlock
 * because AsyncStorage's web polyfill wraps localStorage in async callbacks
 * that conflict with supabase-js GoTrueClient's locking — making signIn/signUp
 * hang indefinitely despite the network request completing successfully.
 *
 * Fix: On web, do NOT pass a custom storage adapter — let supabase-js use
 * window.localStorage directly (its default). On native, AsyncStorage is required.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      // ⚠️ Only use AsyncStorage on native — NEVER on web (causes deadlock in supabase-js v2)
      ...(Platform.OS !== 'web'
        ? {
            storage: AsyncStorage,
            storageKey: supabaseUrl
              ? `sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`
              : undefined,
          }
        : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // 🚀 FIXED WEB LOCK: Providing a no-op lock function to prevent deadlocks 
      // without causing TypeErrors. This ensures profile queries can complete.
      ...(Platform.OS === 'web' 
        ? { 
            lockType: 'custom', 
            lock: async (name, acquireTimeout, fn) => {
              if (typeof fn === 'function') {
                return await fn();
              }
              // Fallback just in case
              return;
            }
          } 
        : {}),
    },
  }
);




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
