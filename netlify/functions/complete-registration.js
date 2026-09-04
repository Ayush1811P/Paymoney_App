const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // Ensure the emails match (security check)
    if (profileData.email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Email mismatch detected' }) };
    }

    // 2. Insert the profile using the Service Role Key (bypassing RLS)
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
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to create user profile' }) };
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
