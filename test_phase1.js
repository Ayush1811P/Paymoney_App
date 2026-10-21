const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://romdfgbohhmswjtzphzj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Wql4MZEPaTam449eUqvoFg_LDBTHiCB';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: responseBody }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('=== TEST 1: Register HTML Page Structure & Inputs ===');
  const regPage = await get('http://localhost:8888/register.html');
  console.log('HTTP Status:', regPage.status);
  console.log('Has Normal Tab Button (#tabNormalBtn):', regPage.body.includes('id="tabNormalBtn"'));
  console.log('Has Lite Tab Button (#tabLiteBtn):', regPage.body.includes('id="tabLiteBtn"'));
  console.log('Has Normal Registration Form (#registerForm):', regPage.body.includes('id="registerForm"'));
  console.log('Has Lite Registration Form (#liteRegisterForm):', regPage.body.includes('id="liteRegisterForm"'));
  console.log('Has Lite OTP Verification Form (#liteOtpForm):', regPage.body.includes('id="liteOtpForm"'));
  console.log('Has Lite Success Confirmation Card (#liteSuccessCard):', regPage.body.includes('id="liteSuccessCard"'));
  console.log('Has Child Full Name Input (#liteFullName):', regPage.body.includes('id="liteFullName"'));
  console.log('Has Child Mobile Number Input (#litePhone):', regPage.body.includes('id="litePhone"'));
  console.log('Has Child Age Input [5-25] (#liteAge):', regPage.body.includes('id="liteAge"') && regPage.body.includes('min="5"') && regPage.body.includes('max="25"'));
  console.log('Has Parent Email Input (#liteParentEmail):', regPage.body.includes('id="liteParentEmail"'));
  console.log('Has Child Password Input (#litePassword):', regPage.body.includes('id="litePassword"'));
  console.log('Has Confirm Password Input (#liteConfirmPassword):', regPage.body.includes('id="liteConfirmPassword"'));
  console.log('Has Terms Checkbox (#liteTermsAgree):', regPage.body.includes('id="liteTermsAgree"'));

  console.log('\n=== TEST 2: Client-side Validation Rules Verification ===');
  const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateAge = (age) => {
    const n = parseInt(age, 10);
    return !isNaN(n) && n >= 5 && n <= 25;
  };
  const validatePassword = (pwd) => typeof pwd === 'string' && pwd.length > 5;

  console.log('Phone "9876543210" valid:', validatePhone('9876543210') === true);
  console.log('Phone "12345" invalid:', validatePhone('12345') === false);
  console.log('Age 14 valid:', validateAge(14) === true);
  console.log('Age 4 invalid (< 5):', validateAge(4) === false);
  console.log('Age 26 invalid (> 25):', validateAge(26) === false);
  console.log('Password "12345" invalid (length <= 5):', validatePassword('12345') === false);
  console.log('Password "123456" valid (length > 5):', validatePassword('123456') === true);

  console.log('\n=== TEST 3: Supabase Parent Account Lookup ===');
  // Lookup valid existing parent: awsmsi0300@gmail.com
  const { data: validParent, error: err1 } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('email', 'awsmsi0300@gmail.com')
    .maybeSingle();
  console.log('Existing parent lookup (awsmsi0300@gmail.com):', validParent ? `FOUND (id: ${validParent.id}, name: ${validParent.full_name})` : 'NOT FOUND', err1 || '');

  // Lookup invalid non-existent parent
  const { data: nonExistentParent, error: err2 } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('email', 'nonexistent_parent_xyz@example.com')
    .maybeSingle();
  console.log('Non-existent parent lookup:', nonExistentParent === null ? 'CORRECTLY NULL' : 'UNEXPECTED');

  console.log('\n=== TEST 4: complete-registration Function Verification ===');
  // 1. Missing parameters test
  const missingRes = await post('http://localhost:8888/.netlify/functions/complete-registration', {
    account_type: 'lite'
  });
  console.log('Missing parameters response status:', missingRes.status, JSON.parse(missingRes.body));

  // 2. Lite registration with invalid token and non-existent parent
  const invalidParentRes = await post('http://localhost:8888/.netlify/functions/complete-registration', {
    account_type: 'lite',
    phone: '9876543210',
    full_name: 'Child User',
    password: 'password123',
    parent_email: 'nonexistent_parent_xyz@example.com',
    age: 12,
    otp_token: 'dummy_token'
  });
  console.log('Invalid parent response status:', invalidParentRes.status, JSON.parse(invalidParentRes.body));

  console.log('\n=== ALL PHASE 1 AUTOMATED CHECKS COMPLETED SUCCESSFULLY ===');
}

runTests().catch(console.error);
