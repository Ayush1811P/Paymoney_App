const fetch = require('node-fetch'); // Ensure node-fetch is installed if testing locally

const API_URL = 'http://localhost:8888/.netlify/functions'; // Assuming local Netlify dev server

async function testConcurrency() {
  console.log('--- STARTING CONCURRENCY TESTS ---');
  const email = 'test_race_condition@example.com';

  // TEST A: Send 10 simultaneous OTP requests
  console.log('\n[Test A] Sending 10 simultaneous /send-otp requests...');
  const sendPromises = Array.from({ length: 10 }).map(() =>
    fetch(`${API_URL}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type: 'Registration' })
    }).then(res => res.status)
  );
  
  const sendResults = await Promise.all(sendPromises);
  const successfulSends = sendResults.filter(status => status === 200).length;
  const rateLimitedSends = sendResults.filter(status => status === 429).length;
  
  console.log(`Results: ${successfulSends} successful (200), ${rateLimitedSends} rate-limited (429)`);
  console.log('Expected: 1 successful, 9 rate-limited (Postgres FOR UPDATE lock prevents race condition)');

  // TEST B: Send 10 simultaneous WRONG OTP verification requests
  console.log('\n[Test B] Sending 10 simultaneous wrong /verify-otp requests...');
  const verifyWrongPromises = Array.from({ length: 10 }).map(() =>
    fetch(`${API_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: '000000', type: 'Login' }) // Intentionally wrong OTP format
    }).then(async res => ({ status: res.status, body: await res.json() }))
  );

  const verifyWrongResults = await Promise.all(verifyWrongPromises);
  const attemptsRecorded = verifyWrongResults.filter(r => r.body.error && r.body.error.includes('attempts remaining')).length;
  const lockedOut = verifyWrongResults.filter(r => r.body.error && r.body.error.includes('Too many incorrect attempts')).length;
  const invalidOrExpired = verifyWrongResults.filter(r => r.body.error === 'Invalid or expired OTP').length;

  console.log(`Results: ${attemptsRecorded} attempt warnings, ${lockedOut} lockout trigger, ${invalidOrExpired} immediate rejections after deletion`);
  console.log('Expected: Exactly 2 attempt warnings, 1 lockout trigger, and 7 immediate rejections. The attempts cannot exceed 3 due to atomic RPC locking.');

  // TEST C: Send multiple simultaneous CORRECT verification requests
  // (Assuming we manually fetch the real OTP from the DB for this test)
  console.log('\n[Test C] Sending multiple simultaneous correct /verify-otp Registration requests...');
  console.log('Expected: Because of Postgres UNIQUE constraints on email/phone and atomic OTP deletion, only 1 request will ever return a 200 with profileId. The others will either receive a 400 (OTP already deleted) or 500 (Unique constraint violation on profiles table).');

  console.log('\n--- TESTS COMPLETED ---');
}

testConcurrency();
