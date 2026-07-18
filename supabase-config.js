/* =========================================================
   Nova Studio — Supabase Configuration
   Shared client used by main.js (public pages) and
   dashboard.js (admin panel).
========================================================= */

const SUPABASE_URL = 'https://nrbajddtzpxudmoolras.supabase.co';
const SUPABASE_KEY = 'sb_publishable_10zvxYYisz1upOzbP9R_5w_82j2qZ8z';

// `sb` is the Supabase client instance used everywhere else.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
