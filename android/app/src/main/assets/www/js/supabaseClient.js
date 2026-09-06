/**
 * Supabase Configuration and Initialization
 */

const SUPABASE_URL = 'https://romdfgbohhmswjtzphzj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Wql4MZEPaTam449eUqvoFg_LDBTHiCB';

// Initialize the Supabase client
// This expects the global 'supabase' object from the CDN script
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
