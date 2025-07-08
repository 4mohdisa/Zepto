import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export function SupabaseAuthSync() {
  useEffect(() => {
    const supabase = createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return;

    // Get the token from cookies
    const cookieName = `sb-${supabaseUrl.split('//')[1]}-auth-token`;
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const cookieValue = getCookie(cookieName);
    if (cookieValue) {
      try {
        const parsed = JSON.parse(cookieValue);
        
        // Validate the parsed object structure
        if (
          parsed && 
          typeof parsed === 'object' && 
          typeof parsed.access_token === 'string' &&
          parsed.access_token.length > 0
        ) {
          const { access_token, refresh_token } = parsed;
          supabase.auth.setSession({
            access_token,
            refresh_token: typeof refresh_token === 'string' ? refresh_token : '',
          });
        } else {
          console.warn('Invalid auth cookie structure');
        }
      } catch (error) {
        console.error('Error parsing auth cookie:', error);
        // Clear invalid cookie
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    }
  }, []);

  return null;
}
