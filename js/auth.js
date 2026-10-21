/**
 * Authentication functionality for the PayMoney application (Direct Database Auth)
 */

// OTP State
let currentRegistrationData = null;
let currentLiteRegistrationData = null;
let currentLoginData = null;

let otpTimerInterval = null;

function redirectToAccountHome(accountType) {
  window.location.replace(accountType === 'lite' ? 'lite-dashboard.html' : 'dashboard.html');
}

function startOtpTimer(btnId, displayId) {
  const btn = document.getElementById(btnId);
  const display = document.getElementById(displayId);
  if (!btn || !display) return;
  
  clearInterval(otpTimerInterval);
  btn.disabled = true;
  btn.style.cursor = 'not-allowed';
  btn.style.opacity = '0.5';
  
  let timeLeft = 100;
  display.textContent = `Available in ${timeLeft}s`;
  
  otpTimerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(otpTimerInterval);
      btn.disabled = false;
      btn.style.cursor = 'pointer';
      btn.style.opacity = '1';
      display.textContent = '';
    } else {
      display.textContent = `Available in ${timeLeft}s`;
    }
  }, 1000);
}

// Call Supabase Auth to send OTP
async function sendEmailOtp(email, type) {
  const { error } = await supabaseClient.auth.signInWithOtp({
    email: email,
  });
  
  if (error) {
    throw new Error(error.message || 'Failed to send OTP');
  }
  return { message: 'OTP sent' };
}

// Call Supabase Auth to verify OTP
async function verifyEmailOtp(email, otp, type = 'Login', profileData = null) {
  // 1. Verify the OTP with Supabase Auth
  const { data, error } = await supabaseClient.auth.verifyOtp({
    email: email,
    token: otp,
    type: 'email'
  });
  
  if (error) {
    throw new Error(error.message || 'Invalid OTP');
  }
  
  // 2. If it's a Registration, securely insert the custom profile data via backend
  if (type === 'Registration' && profileData) {
    const apiOrigin = (window.location.protocol === 'file:' || !window.location.origin || window.location.origin === 'null')
      ? 'https://paymoney18.netlify.app'
      : '';
    // We pass the session access token to prove to the backend we are verified
    const response = await fetch(`${apiOrigin}/.netlify/functions/complete-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: data.session.access_token, 
        profileData 
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create user profile');
    }
    
    const result = await response.json();
    return { profileId: result.profileId };
  }
  
  // If Login, just return success
  return { success: true };
}

document.addEventListener('DOMContentLoaded', async function() {
  // Redirect if already logged in
  if (await redirectIfLoggedIn()) return;
  
  // Login forms & tab logic
  const loginForm = document.getElementById('loginForm');
  const liteLoginForm = document.getElementById('liteLoginForm');
  const tabNormalLoginBtn = document.getElementById('tabNormalLoginBtn');
  const tabLiteLoginBtn = document.getElementById('tabLiteLoginBtn');
  const otpFormLogin = document.getElementById('otpFormLogin');

  if (tabNormalLoginBtn && tabLiteLoginBtn) {
    function activateNormalLogin() {
      tabNormalLoginBtn.classList.add('active');
      tabLiteLoginBtn.classList.remove('active');
      if (loginForm) loginForm.style.display = 'block';
      if (liteLoginForm) liteLoginForm.style.display = 'none';
      if (otpFormLogin) otpFormLogin.style.display = 'none';
      const footerLink = document.querySelector('.auth-footer a');
      if (footerLink) footerLink.href = 'register.html';
    }

    function activateLiteLogin() {
      tabLiteLoginBtn.classList.add('active');
      tabNormalLoginBtn.classList.remove('active');
      if (loginForm) loginForm.style.display = 'none';
      if (liteLoginForm) liteLoginForm.style.display = 'block';
      if (otpFormLogin) otpFormLogin.style.display = 'none';
      const footerLink = document.querySelector('.auth-footer a');
      if (footerLink) footerLink.href = 'register.html?tab=lite';
    }

    tabNormalLoginBtn.addEventListener('click', activateNormalLogin);
    tabLiteLoginBtn.addEventListener('click', activateLiteLogin);

    // Auto-switch to Lite tab if navigated with ?tab=lite
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'lite') {
      activateLiteLogin();
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (liteLoginForm) {
    liteLoginForm.addEventListener('submit', handleLiteLogin);
  }

  // Initialize password visibility toggles across forms
  const toggleButtons = document.querySelectorAll('.toggle-password-btn');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const container = this.closest('.password-input-container');
      if (!container) return;
      
      const input = container.querySelector('input');
      const eyeOpen = this.querySelector('.eye-open');
      const eyeClosed = this.querySelector('.eye-closed');
      
      if (input && eyeOpen && eyeClosed) {
        if (input.type === 'password') {
          input.type = 'text';
          eyeOpen.style.display = 'none';
          eyeClosed.style.display = 'block';
        } else {
          input.type = 'password';
          eyeOpen.style.display = 'block';
          eyeClosed.style.display = 'none';
        }
      }
    });
  });
  
  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
    
    // Initialize password toggles inside registerForm
    const toggleButtonsReg = registerForm.querySelectorAll('.toggle-password-btn');
    toggleButtonsReg.forEach(btn => {
      btn.addEventListener('click', function() {
        const container = this.closest('.password-input-container');
        if (!container) return;
        
        const input = container.querySelector('input');
        const eyeOpen = this.querySelector('.eye-open');
        const eyeClosed = this.querySelector('.eye-closed');
        
        if (input && eyeOpen && eyeClosed) {
          if (input.type === 'password') {
            input.type = 'text';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
          } else {
            input.type = 'password';
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
          }
        }
      });
    });

    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (password && confirmPassword) {
      confirmPassword.addEventListener('input', function() {
        if (password.value !== confirmPassword.value) {
          confirmPassword.setCustomValidity('Passwords do not match');
        } else {
          confirmPassword.setCustomValidity('');
        }
      });
    }
    
    // Terms modal logic
    const termsModal = document.getElementById('termsModal');
    const closeTermsBtn = document.getElementById('closeTermsBtn');
    const acceptTermsBtn = document.getElementById('acceptTermsBtn');
    
    document.querySelectorAll('.viewTermsLink, #viewTermsLink').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        if (termsModal) termsModal.style.display = 'block';
      });
    });
    
    if (closeTermsBtn && termsModal) {
      closeTermsBtn.addEventListener('click', function() {
        termsModal.style.display = 'none';
      });
    }
    
    if (acceptTermsBtn && termsModal) {
      acceptTermsBtn.addEventListener('click', function() {
        termsModal.style.display = 'none';
        const termsAgreeCheckbox = document.getElementById('termsAgree');
        const liteTermsAgreeCheckbox = document.getElementById('liteTermsAgree');
        if (termsAgreeCheckbox) termsAgreeCheckbox.checked = true;
        if (liteTermsAgreeCheckbox) liteTermsAgreeCheckbox.checked = true;
      });
    }
    
    // Close modal if clicking outside content
    window.addEventListener('click', function(e) {
      if (e.target === termsModal) {
        termsModal.style.display = 'none';
      }
    });

    // Account Type Tabs logic (Normal vs Lite)
    const tabNormalBtn = document.getElementById('tabNormalBtn');
    const tabLiteBtn = document.getElementById('tabLiteBtn');
    const liteRegisterForm = document.getElementById('liteRegisterForm');
    const liteOtpForm = document.getElementById('liteOtpForm');
    const liteSuccessCard = document.getElementById('liteSuccessCard');
    const otpForm = document.getElementById('otpForm');

    if (tabNormalBtn && tabLiteBtn) {
      function activateNormalRegister() {
        tabNormalBtn.classList.add('active');
        tabLiteBtn.classList.remove('active');
        if (registerForm) registerForm.style.display = 'block';
        if (liteRegisterForm) liteRegisterForm.style.display = 'none';
        if (otpForm) otpForm.style.display = 'none';
        if (liteOtpForm) liteOtpForm.style.display = 'none';
        if (liteSuccessCard) liteSuccessCard.style.display = 'none';
        const footerLink = document.querySelector('.auth-footer a');
        if (footerLink) footerLink.href = 'login.html';
      }

      function activateLiteRegister() {
        tabLiteBtn.classList.add('active');
        tabNormalBtn.classList.remove('active');
        if (registerForm) registerForm.style.display = 'none';
        if (liteRegisterForm) liteRegisterForm.style.display = 'block';
        if (otpForm) otpForm.style.display = 'none';
        if (liteOtpForm) liteOtpForm.style.display = 'none';
        if (liteSuccessCard) liteSuccessCard.style.display = 'none';
        const footerLink = document.querySelector('.auth-footer a');
        if (footerLink) footerLink.href = 'login.html?tab=lite';
      }

      tabNormalBtn.addEventListener('click', activateNormalRegister);
      tabLiteBtn.addEventListener('click', activateLiteRegister);

      // Auto-switch to Lite tab if navigated with ?tab=lite
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tab') === 'lite') {
        activateLiteRegister();
      }
    }

    // Lite Registration form logic
    if (liteRegisterForm) {
      liteRegisterForm.addEventListener('submit', handleLiteRegister);

      const toggleButtonsLite = liteRegisterForm.querySelectorAll('.toggle-password-btn');
      toggleButtonsLite.forEach(btn => {
        btn.addEventListener('click', function() {
          const container = this.closest('.password-input-container');
          if (!container) return;
          
          const input = container.querySelector('input');
          const eyeOpen = this.querySelector('.eye-open');
          const eyeClosed = this.querySelector('.eye-closed');
          
          if (input && eyeOpen && eyeClosed) {
            if (input.type === 'password') {
              input.type = 'text';
              eyeOpen.style.display = 'none';
              eyeClosed.style.display = 'block';
            } else {
              input.type = 'password';
              eyeOpen.style.display = 'block';
              eyeClosed.style.display = 'none';
            }
          }
        });
      });

      const litePassword = document.getElementById('litePassword');
      const liteConfirmPassword = document.getElementById('liteConfirmPassword');
      
      if (litePassword && liteConfirmPassword) {
        liteConfirmPassword.addEventListener('input', function() {
          if (litePassword.value !== liteConfirmPassword.value) {
            liteConfirmPassword.setCustomValidity('Passwords do not match');
          } else {
            liteConfirmPassword.setCustomValidity('');
          }
        });
      }
    }
    
    // OTP Form Logic - Normal Register
    const backToRegisterBtn = document.getElementById('backToRegisterBtn');
    
    if (otpForm && backToRegisterBtn) {
      backToRegisterBtn.addEventListener('click', () => {
        otpForm.style.display = 'none';
        registerForm.style.display = 'block';
      });
      
      otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const enteredOtp = document.getElementById('otpInput').value.trim();
        
        try {
          const result = await verifyEmailOtp(currentRegistrationData.email, enteredOtp, 'Registration', currentRegistrationData);
          
          if (result.profileId) {
            localStorage.setItem('paymoney_user_id', result.profileId);
            localStorage.setItem('paymoney_account_type', 'normal');
            redirectToAccountHome('normal');
          } else {
            throw new Error('Failed to retrieve profile ID');
          }
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
      
      const resendBtnRegister = document.getElementById('resendOtpBtn');
      if (resendBtnRegister) {
        resendBtnRegister.addEventListener('click', async () => {
          if (!currentRegistrationData) return;
          resendBtnRegister.disabled = true;
          resendBtnRegister.textContent = 'Sending...';
          try {
            await sendEmailOtp(currentRegistrationData.email, 'Registration');
            showNotification('OTP resent successfully', 'success');
            startOtpTimer('resendOtpBtn', 'otpTimerDisplay');
          } catch (error) {
            showNotification(error.message, 'error');
          }
          resendBtnRegister.textContent = 'Resend OTP';
        });
      }
    }

    // OTP Form Logic - Lite Register (Parent Email OTP)
    const backToLiteRegisterBtn = document.getElementById('backToLiteRegisterBtn');
    if (liteOtpForm && backToLiteRegisterBtn) {
      backToLiteRegisterBtn.addEventListener('click', () => {
        liteOtpForm.style.display = 'none';
        if (liteRegisterForm) liteRegisterForm.style.display = 'block';
      });

      liteOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const enteredOtp = document.getElementById('liteOtpInput').value.trim();
        const verifyBtn = document.getElementById('verifyLiteRegisterBtn');
        const originalText = verifyBtn ? verifyBtn.textContent : '';
        if (verifyBtn) {
          verifyBtn.disabled = true;
          verifyBtn.textContent = 'Verifying...';
        }

        try {
          const result = await verifyEmailOtp(currentLiteRegistrationData.parent_email, enteredOtp, 'Registration', currentLiteRegistrationData);
          
          // CRITICAL SECURITY: Immediately destroy parent's Supabase auth session from the child's browser
          try {
            await supabaseClient.auth.signOut();
          } catch (e) {
            console.warn('Parent sign-out cleanup:', e);
          }
          localStorage.removeItem('paymoney_user_id');
          localStorage.removeItem('paymoney_account_type');

          if (result.profileId) {
            liteOtpForm.style.display = 'none';
            if (liteSuccessCard) {
              liteSuccessCard.style.display = 'block';
              const successEmailEl = document.getElementById('successParentEmail');
              if (successEmailEl) successEmailEl.textContent = currentLiteRegistrationData.parent_email;
            }
            showNotification('Lite Account created successfully!', 'success');
          } else {
            throw new Error('Failed to retrieve profile ID');
          }
        } catch (error) {
          showNotification(error.message, 'error');
        } finally {
          if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.textContent = originalText;
          }
        }
      });

      const resendLiteOtpBtn = document.getElementById('resendLiteOtpBtn');
      if (resendLiteOtpBtn) {
        resendLiteOtpBtn.addEventListener('click', async () => {
          if (!currentLiteRegistrationData) return;
          resendLiteOtpBtn.disabled = true;
          resendLiteOtpBtn.textContent = 'Sending...';
          try {
            await sendEmailOtp(currentLiteRegistrationData.parent_email, 'Lite Registration');
            showNotification('OTP resent to parent successfully', 'success');
            startOtpTimer('resendLiteOtpBtn', 'liteOtpTimerDisplay');
          } catch (error) {
            showNotification(error.message, 'error');
          }
          resendLiteOtpBtn.textContent = 'Resend OTP';
        });
      }
    }
  }

  // OTP Form Logic - Login
  const backToLoginBtn = document.getElementById('backToLoginBtn');
  const loginFormRef = document.getElementById('loginForm');
  
  if (otpFormLogin && backToLoginBtn) {
    backToLoginBtn.addEventListener('click', () => {
      otpFormLogin.style.display = 'none';
      loginFormRef.style.display = 'block';
    });
    
    otpFormLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const enteredOtp = document.getElementById('otpInputLogin').value.trim();
      
      try {
        await verifyEmailOtp(currentLoginData.email, enteredOtp);
      } catch (error) {
        showNotification(error.message, 'error');
        return;
      }
      
      // OTP matched, complete login
      localStorage.setItem('paymoney_user_id', currentLoginData.id);
      localStorage.setItem('paymoney_account_type', 'normal');
      redirectToAccountHome('normal');
    });
    
    const resendBtnLogin = document.getElementById('resendOtpBtnLogin');
    if (resendBtnLogin) {
      resendBtnLogin.addEventListener('click', async () => {
        if (!currentLoginData) return;
        resendBtnLogin.disabled = true;
        resendBtnLogin.textContent = 'Sending...';
        try {
          await sendEmailOtp(currentLoginData.email, 'Login');
          showNotification('OTP resent successfully', 'success');
          startOtpTimer('resendOtpBtnLogin', 'otpTimerDisplayLogin');
        } catch (error) {
          showNotification(error.message, 'error');
        }
        resendBtnLogin.textContent = 'Resend OTP';
      });
    }
  }
});

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();
  
  const loginId = document.getElementById('loginId').value.trim(); // Phone number
  const password = document.getElementById('loginPassword').value;
  
  if (!loginId || !password) {
    showNotification('Please enter all fields', 'error');
    return;
  }
  
  if (!validatePhone(loginId)) {
    showNotification('Please enter a valid 10-digit phone number', 'error');
    return;
  }
  
  // Hash the entered password to compare with the DB
  const hashedPassword = await hashPassword(password);
  
  // Authenticate using database lookup
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('phone', loginId)
    .single();
    
  if (error || !data) {
    showNotification('Invalid phone number or password', 'error');
    return;
  }
  
  if (data.password_hash !== hashedPassword) {
    showNotification('Invalid phone number or password', 'error');
    return;
  }

  // Guard: Lite users must log in via Lite Login tab
  if (data.account_type === 'lite') {
    showNotification('This is a Lite account. Please switch to the Lite Login tab.', 'error');
    return;
  }
  
  if (!data.email) {
    // If user has no email registered (legacy user), just log them in
    localStorage.setItem('paymoney_user_id', data.id);
    localStorage.setItem('paymoney_account_type', 'normal');
    redirectToAccountHome('normal');
    return;
  }
  
  // Complete Login
  localStorage.setItem('paymoney_user_id', data.id);
  localStorage.setItem('paymoney_account_type', 'normal');
  redirectToAccountHome('normal');
}

// Handle Lite login form submission
async function handleLiteLogin(e) {
  e.preventDefault();
  
  const phone = document.getElementById('liteLoginPhone').value.trim();
  const password = document.getElementById('liteLoginPassword').value;
  
  if (!phone || !password) {
    showNotification('Please enter all fields', 'error');
    return;
  }
  
  if (!validatePhone(phone)) {
    showNotification('Please enter a valid 10-digit phone number', 'error');
    return;
  }
  
  const hashedPassword = await hashPassword(password);
  
  const btn = document.getElementById('liteLoginBtn');
  const originalText = btn ? btn.textContent : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Logging in...';
  }

  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('phone', phone)
      .single();
      
    if (error || !data) {
      showNotification('Invalid phone number or password', 'error');
      return;
    }
    
    if (data.password_hash !== hashedPassword) {
      showNotification('Invalid phone number or password', 'error');
      return;
    }
    
    // Guard: Normal accounts should use the Normal Login tab
    if (data.account_type === 'normal') {
      showNotification('This is a Normal PayMoney account. Please use the Normal Login tab.', 'error');
      return;
    }
    
    // Set authenticated Lite session
    localStorage.setItem('paymoney_user_id', data.id);
    localStorage.setItem('paymoney_account_type', 'lite');
    
    redirectToAccountHome('lite');
  } catch (err) {
    console.error('Error during Lite login:', err);
    showNotification('An unexpected error occurred. Please try again.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

// Handle register form submission
async function handleRegister(e) {
  e.preventDefault();
  
  try {
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsAgree = document.getElementById('termsAgree').checked;
    
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    
    if (!validatePhone(phone)) {
      showNotification('Please enter a valid 10-digit phone number', 'error');
      return;
    }
    
    if (password.length <= 5) {
      showNotification('Password must be greater than 5 digits', 'error');
      return;
    }
    
    if (!termsAgree) {
      showNotification('Please agree to the terms and conditions', 'error');
      return;
    }
    
    // Check if phone or email is already registered
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('profiles')
      .select('id, phone, email')
      .or(`phone.eq.${phone},email.eq.${email}`)
      .maybeSingle();
      
    if (existingUser) {
      if (existingUser.phone === phone) {
        showNotification('This phone number is already registered', 'error');
      } else {
        showNotification('This email address is already registered', 'error');
      }
      return;
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Prepare registration data
    currentRegistrationData = { 
      full_name: fullName, 
      email: email,
      phone: phone,
      upi_id: phone + '@paymoney',
      password_hash: hashedPassword,
      wallet_balance: 20000.00 // Default starter balance
    };
    
    const btn = document.getElementById('registerBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Sending OTP...';
    btn.disabled = true;
    
    try {
      await sendEmailOtp(email, 'Registration');
    } catch (error) {
      showNotification(error.message, 'error');
      btn.textContent = originalText;
      btn.disabled = false;
      return;
    }
    
    btn.textContent = originalText;
    btn.disabled = false;
    
    // Switch forms
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('otpForm').style.display = 'block';
    showNotification('An OTP has been sent to your email.', 'success');
    startOtpTimer('resendOtpBtn', 'otpTimerDisplay');
  } catch (error) {
    alert("Caught Error: " + error.name + " - " + error.message);
    console.error(error);
  }
}

// Handle Lite register form submission
async function handleLiteRegister(e) {
  e.preventDefault();
  
  try {
    const fullName = document.getElementById('liteFullName').value.trim();
    const phone = document.getElementById('litePhone').value.trim();
    const age = document.getElementById('liteAge').value.trim();
    const parentEmail = document.getElementById('liteParentEmail').value.trim().toLowerCase();
    const password = document.getElementById('litePassword').value;
    const confirmPassword = document.getElementById('liteConfirmPassword').value;
    const termsAgree = document.getElementById('liteTermsAgree').checked;
    
    if (!fullName) {
      showNotification('Please enter child full name', 'error');
      return;
    }

    if (!phone) {
      showNotification('Please enter mobile number', 'error');
      return;
    }
    
    if (!validatePhone(phone)) {
      showNotification('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 5 || ageNum > 25) {
      showNotification('Please enter a valid age between 5 and 25', 'error');
      return;
    }

    if (!parentEmail || !validateEmail(parentEmail)) {
      showNotification('Please enter a valid parent email address', 'error');
      return;
    }

    if (!password) {
      showNotification('Please create a password', 'error');
      return;
    }
    
    if (password.length <= 5) {
      showNotification('Password must be greater than 5 digits', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    
    if (!termsAgree) {
      showNotification('Please agree to the terms and conditions', 'error');
      return;
    }
    
    // 1. Check if child phone number is already registered
    const { data: existingPhone } = await supabaseClient
      .from('profiles')
      .select('id, phone')
      .eq('phone', phone)
      .maybeSingle();
      
    if (existingPhone) {
      showNotification('This phone number is already registered', 'error');
      return;
    }
    
    // 2. Parent Account Existence Check: Must exist in PayMoney profiles
    const { data: parentProfile, error: parentError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, email')
      .ilike('email', parentEmail)
      .maybeSingle();
      
    if (parentError || !parentProfile) {
      showNotification('No PayMoney account was found with this email. Please enter the email address registered with the parent\'s PayMoney account.', 'error');
      return;
    }
    
    try {
      const { data: parentDetails } = await supabaseClient
        .from('profiles')
        .select('account_type')
        .eq('id', parentProfile.id)
        .maybeSingle();
        
      if (parentDetails && parentDetails.account_type === 'lite') {
        showNotification('A Lite account cannot be linked as a parent account.', 'error');
        return;
      }
    } catch (_) {
      // Default to normal if column does not yet exist
    }
    
    // 3. Hash child's password
    const hashedPassword = await hashPassword(password);
    
    // 4. Prepare Lite registration state
    currentLiteRegistrationData = {
      full_name: fullName,
      phone: phone,
      age: ageNum,
      account_type: 'lite',
      parent_id: parentProfile.id,
      parent_email: parentEmail,
      upi_id: phone + '@paymoneylite',
      password_hash: hashedPassword,
      wallet_balance: 20000.00
    };
    
    // 5. Send OTP to Parent's registered email
    const btn = document.getElementById('liteRegisterBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Sending OTP to Parent...';
    btn.disabled = true;
    
    try {
      await sendEmailOtp(parentEmail, 'Lite Registration');
    } catch (error) {
      showNotification(error.message, 'error');
      btn.textContent = originalText;
      btn.disabled = false;
      return;
    }
    
    btn.textContent = originalText;
    btn.disabled = false;
    
    // Switch to Lite OTP form
    document.getElementById('liteRegisterForm').style.display = 'none';
    document.getElementById('liteOtpForm').style.display = 'block';
    const parentDisplay = document.getElementById('parentEmailDisplay');
    if (parentDisplay) parentDisplay.textContent = parentEmail;
    
    showNotification('An OTP has been sent to the parent\'s registered email.', 'success');
    startOtpTimer('resendLiteOtpBtn', 'liteOtpTimerDisplay');
  } catch (error) {
    console.error('Error in handleLiteRegister:', error);
    showNotification('An unexpected error occurred. Please try again.', 'error');
  }
}