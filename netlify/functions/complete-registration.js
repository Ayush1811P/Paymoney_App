const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://romdfgbohhmswjtzphzj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_Wql4MZEPaTam449eUqvoFg_LDBTHiCB';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const allowedOrigins = ['https://paymoney18.netlify.app', 'http://localhost:8888', 'http://localhost:3000'];

function getCorsHeaders(origin) {
  if (allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
  }
  return {};
}

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin;
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const { token, profileData } = JSON.parse(event.body);

    if (!token || !profileData) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing token or profile data' }) };
    }

    // 1. Verify the access token with Supabase
    // This proves the user successfully verified their OTP and is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized: Invalid session' }) };
    }

    // 2. Validate registration payload based on account_type
    if (profileData.account_type === 'lite') {
      if (!profileData.parent_id) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing parent account ID' }) };
      }

      // Verify that user.email (from Supabase verified token) matches the registered parent email
      const { data: parentProfile, error: parentError } = await supabase
        .from('profiles')
        .select('id, email, account_type')
        .eq('id', profileData.parent_id)
        .single();

      if (parentError || !parentProfile || !parentProfile.email) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Parent account not found' }) };
      }

      if (parentProfile.email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
        return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Parent email verification mismatch' }) };
      }

      if (parentProfile.account_type === 'lite') {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'A Lite account cannot be linked as a parent' }) };
      }

      // Lite account does not have its own email to avoid unique constraint collision with parent email
      delete profileData.parent_email;
      profileData.email = null;
      profileData.account_type = 'lite';
    } else {
      // Normal registration: User email in token must match profile email
      profileData.account_type = 'normal';
      profileData.parent_id = null;
      if (!profileData.email || profileData.email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
        return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Email mismatch detected' }) };
      }
    }

    // 3. Insert the profile using the Service Role Key (bypassing RLS)
    const { data: profileInsertData, error: profileError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Handle unique constraint violations gracefully
      if (profileError.code === '23505') {
          return { statusCode: 409, headers: corsHeaders, body: JSON.stringify({ error: 'Profile already exists for this email or phone' }) };
      }
      if (profileError.code === '42703') {
          return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Database schema migration required: please run supabase_lite_migration.sql in the Supabase SQL Editor.' }) };
      }
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: profileError.message || 'Failed to create user profile' }) };
    }
    
    let profileId = null;
    if (profileInsertData && profileInsertData[0]) {
      profileId = profileInsertData[0].id;
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, message: 'Registration complete', profileId }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Server error completing registration' }),
    };
  }
};
