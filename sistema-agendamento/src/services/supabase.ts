import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing. Check your .env file or Vercel environment variables.');
}

// Custom fetch to inject admin session token into headers
const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
        try {
            const admin = JSON.parse(adminSession);
            if (admin.session_token) {
                const options = init || {};
                options.headers = {
                    ...(options.headers || {}),
                    'x-admin-token': admin.session_token,
                };
            }
        } catch (e) {
            console.error('Error parsing admin_session for token injection:', e);
        }
    }
    return fetch(input, init);
};

export const supabase = createClient(
    supabaseUrl || '',
    supabaseKey || '',
    {
        global: { fetch: customFetch }
    }
);
