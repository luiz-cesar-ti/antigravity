import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing. Check your .env file or Vercel environment variables.');
}

// Custom fetch to inject admin session token into headers
const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    // Debug logging
    // console.log('CustomFetch called', { inputType: input instanceof Request ? 'Request' : 'string' });

    // 1. Safe access to admin token
    let adminToken = '';
    try {
        const session = localStorage.getItem('admin_session');
        if (session) {
            const admin = JSON.parse(session);
            adminToken = admin.session_token || '';
        }
    } catch (e) { }

    // 2. Prepare headers container
    const headers = new Headers();

    // 3. Copy headers from Input (if it's a Request)
    if (input instanceof Request) {
        input.headers.forEach((value, key) => {
            headers.set(key, value);
        });
    }

    // 4. Copy/Overwrite headers from Init
    if (init?.headers) {
        const initHeaders = new Headers(init.headers);
        initHeaders.forEach((value, key) => {
            headers.set(key, value);
        });
    }

    // 5. CRITICAL: Force the apikey
    if (supabaseKey) {
        const cleanKey = supabaseKey.trim();
        // Always force apikey
        headers.set('apikey', cleanKey);

        // Ensure Authorization
        if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${cleanKey}`);
        }
    }

    // 6. Inject Admin Token
    if (adminToken) {
        headers.set('x-admin-token', adminToken);
    }

    // Debug final headers
    // console.log('Final Headers:', Object.fromEntries(headers.entries()));

    // 7. Execute fetch
    // Note: When passing 'headers' in options, it overrides input's headers.
    // Since we copied everything into 'headers' manually, this is safe.
    return fetch(input, { ...init, headers });
};

export const supabase = createClient(
    supabaseUrl || '',
    supabaseKey || '',
    {
        global: { fetch: customFetch }
    }
);
