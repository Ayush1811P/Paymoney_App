/**
 * Authentication functionality for the PayMoney application (Direct Database Auth)
 */

// OTP State
let currentRegistrationData = null;
let currentLoginData = null;

let otpTimerInterval = null;

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
    // We pass the session access token to prove to the backend we are verified
    const response = await fetch('/.netlify/functions/complete-registration', {
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
  
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    
    // Initialize password visibility toggles
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
  }
  
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
    const viewTermsLink = document.getElementById('viewTermsLink');
    const closeTermsBtn = document.getElementById('closeTermsBtn');
    const acceptTermsBtn = document.getElementById('acceptTermsBtn');
    const termsAgreeCheckbox = document.getElementById('termsAgree');
    
    if (viewTermsLink && termsModal) {
      viewTermsLink.addEventListener('click', function(e) {
        e.preventDefault();
        termsModal.style.display = 'block';
      });
    }
    
    if (closeTermsBtn && termsModal) {
      closeTermsBtn.addEventListener('click', function() {
        termsModal.style.display = 'none';
      });
    }
    
    if (acceptTermsBtn && termsModal) {
      acceptTermsBtn.addEventListener('click', function() {
        termsModal.style.display = 'none';
        if (termsAgreeCheckbox) {
          termsAgreeCheckbox.checked = true;
        }
      });
    }
    
    // Close modal if clicking outside content
    window.addEventListener('click', function(e) {
      if (e.target === termsModal) {
        termsModal.style.display = 'none';
      }
    });
    
    // OTP Form Logic - Register
    const otpForm = document.getElementById('otpForm');
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
            showNotification('Registration successful! Redirecting...');
            setTimeout(() => {
              window.location.href = 'dashboard.html';
            }, 1500);
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
  }

  // OTP Form Logic - Login
  const otpFormLogin = document.getElementById('otpFormLogin');
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
      showNotification('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
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
  
  if (!data.email) {
    // If user has no email registered (legacy user), just log them in
    localStorage.setItem('paymoney_user_id', data.id);
    showNotification('Login successful! Redirecting...');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
    return;
  }
  
  // Prepare for 2FA OTP
  currentLoginData = data;
  
  // Show loading/notification
  const btn = document.getElementById('loginBtn');
  const originalText = btn.textContent;
  btn.textContent = 'Sending OTP...';
  btn.disabled = true;
  
  try {
    await sendEmailOtp(data.email, 'Login');
  } catch (error) {
    showNotification(error.message, 'error');
    btn.textContent = originalText;
    btn.disabled = false;
    return;
  }
  
  btn.textContent = originalText;
  btn.disabled = false;
  
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('otpFormLogin').style.display = 'block';
  showNotification('An OTP has been sent to your registered email.', 'success');
  startOtpTimer('resendOtpBtnLogin', 'otpTimerDisplayLogin');
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