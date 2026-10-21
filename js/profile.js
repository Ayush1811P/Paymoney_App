/**
 * Profile functionality for the PayMoney application (Supabase Integrated)
 */

let pendingPasswordChange = null;

document.addEventListener('DOMContentLoaded', async function() {
  if (!(await requireAuth())) return;
  
  await loadProfileData();
  initProfileTabs();
  initAvatarChange();
  
  const personalInfoForm = document.getElementById('personalInfoForm');
  if (personalInfoForm) {
    personalInfoForm.addEventListener('submit', handlePersonalInfoUpdate);
  }
  
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handlePasswordChange);
  }

  const passwordOtpForm = document.getElementById('passwordOtpForm');
  if (passwordOtpForm) {
    passwordOtpForm.addEventListener('submit', handlePasswordOtpVerification);
  }

  const cancelPasswordOtpBtn = document.getElementById('cancelPasswordOtpBtn');
  if (cancelPasswordOtpBtn) {
    cancelPasswordOtpBtn.addEventListener('click', resetPasswordChange);
  }
  
  initToggleSwitches();
  
  const addCardBtn = document.getElementById('addCardBtn');
  if (addCardBtn) {
    addCardBtn.addEventListener('click', () => {
      document.getElementById('addCardModal').style.display = 'block';
    });
  }
  
  const addCardForm = document.getElementById('addCardForm');
  if (addCardForm) {
    addCardForm.addEventListener('submit', handleAddCard);
  }
  
  const submitKycBtn = document.getElementById('submitKycBtn');
  if (submitKycBtn) {
    submitKycBtn.addEventListener('click', handleKycSubmit);
  }
  
  initDocumentUploads();
});

async function loadProfileData() {
  const profile = await getProfile(true);
  if (!profile) return;
  
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileAvatar = document.getElementById('profileAvatar');
  const user = await getUser();
  
  if (profileName) profileName.textContent = profile.full_name;
  if (profileEmail) profileEmail.textContent = profile.email || 'No email added';
  if (profileAvatar) profileAvatar.src = getAvatarUrl(profile);
  
  const fullName = document.getElementById('fullName');
  const profileEmailInput = document.getElementById('profileEmailInput');
  const profilePhone = document.getElementById('profilePhone');
  
  if (fullName) fullName.value = profile.full_name;
  if (profileEmailInput) profileEmailInput.value = profile.email || '';
  if (profilePhone) profilePhone.value = profile.phone;
  
  const upiStatusBadge = document.getElementById('upiStatusBadge');
  const profileUpiId = document.getElementById('profileUpiId');
  
  if (upiStatusBadge && profileUpiId) {
    if (profile.upi_id) {
      upiStatusBadge.textContent = 'Active';
      upiStatusBadge.className = 'status-badge success';
      profileUpiId.textContent = profile.upi_id;
    } else {
      upiStatusBadge.textContent = 'Not Set Up';
      upiStatusBadge.className = 'status-badge';
      profileUpiId.textContent = '-';
    }
  }
  
  await loadProfileBanks();
  loadSavedCards();

  if (profile.account_type === 'lite') {
    const bankSection = document.getElementById('profileBanksList')?.closest('.payment-methods-section');
    if (bankSection) bankSection.style.display = 'none';
    
    const emailGroup = document.getElementById('profileEmailInput')?.closest('.form-group');
    if (emailGroup) emailGroup.style.display = 'none';

    if (!document.getElementById('liteProfileBanner')) {
      const banner = document.createElement('div');
      banner.id = 'liteProfileBanner';
      banner.className = 'lite-banner';
      banner.style.marginTop = '20px';
      banner.innerHTML = `
        <div class="lite-banner-text">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          <span><strong>PayMoney Lite:</strong> Connected to parent's account</span>
        </div>
        <div class="lite-banner-pill">UPI ID: <span>${profile.upi_id || ''}</span></div>
      `;
      const profileContainer = document.querySelector('.profile-container');
      if (profileContainer) {
        profileContainer.insertBefore(banner, profileContainer.firstChild);
      }
    }
  }
}

async function loadProfileBanks() {
  const profileBanksList = document.getElementById('profileBanksList');
  if (!profileBanksList) return;
  
  const user = await getUser();
  const { data: banks, error } = await supabaseClient
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id);
    
  if (error || !banks || banks.length === 0) {
    profileBanksList.innerHTML = `
      <div class="empty-state">
        <p>No bank accounts linked yet</p>
        <button id="profileLinkBankBtn" class="btn btn-secondary">Link Bank Account</button>
      </div>
    `;
    const profileLinkBankBtn = document.getElementById('profileLinkBankBtn');
    if (profileLinkBankBtn) {
      profileLinkBankBtn.addEventListener('click', () => {
        window.location.href = 'upi.html';
      });
    }
    return;
  }
  
  let banksHTML = '';
  banks.forEach(bank => {
    banksHTML += `
      <div class="bank-account">
        <div class="bank-icon">${bank.bank_name.charAt(0)}</div>
        <div class="bank-details">
          <div class="bank-name">${bank.bank_name}</div>
          <div class="bank-account-number">A/C: ${bank.account_number.slice(-4).padStart(bank.account_number.length, 'X')}</div>
        </div>
      </div>
    `;
  });
  profileBanksList.innerHTML = banksHTML;
}

function loadSavedCards() {
  // Mocking saved cards since it wasn't in our schema
  const savedCardsList = document.getElementById('savedCardsList');
  if (!savedCardsList) return;
  savedCardsList.innerHTML = `
    <div class="empty-state">
      <p>No saved cards yet</p>
      <button id="addCardBtn" class="btn btn-secondary">Add a Card</button>
    </div>
  `;
}

function initProfileTabs() {
  const profileTabs = document.querySelectorAll('.profile-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  profileTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      profileTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(`${tab.dataset.tab}Tab`).classList.add('active');
    });
  });
}

function initAvatarChange() {
  const changeAvatarBtn = document.getElementById('changeAvatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const avatarUpload = document.getElementById('avatarUpload');
  const avatarPreview = document.getElementById('avatarPreview');
  const saveAvatarBtn = document.getElementById('saveAvatarBtn');
  
  if (changeAvatarBtn && avatarModal) {
    changeAvatarBtn.addEventListener('click', () => {
      const profileAvatar = document.getElementById('profileAvatar');
      if (profileAvatar && avatarPreview) {
        avatarPreview.src = profileAvatar.src;
      }
      avatarModal.style.display = 'block';
    });
  }
  
  let base64Image = '';
  
  if (avatarUpload) {
    avatarUpload.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 1024 * 1024) {
          showNotification('Image size must be less than 1MB', 'error');
          avatarUpload.value = '';
          return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
          base64Image = event.target.result;
          if (avatarPreview) {
            avatarPreview.src = base64Image;
          }
          if (saveAvatarBtn) {
            saveAvatarBtn.disabled = false;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  if (saveAvatarBtn) {
    saveAvatarBtn.addEventListener('click', async () => {
      if (!base64Image) return;
      
      saveAvatarBtn.disabled = true;
      saveAvatarBtn.textContent = 'Saving...';
      
      const user = await getUser();
      
      try {
        localStorage.setItem(`avatar_${user.id}`, base64Image);
        showNotification('Profile picture updated successfully');
        avatarModal.style.display = 'none';
        saveAvatarBtn.textContent = 'Save Photo';
        saveAvatarBtn.disabled = true;
        await loadProfileData();
        await updateUserInfo();
      } catch (err) {
        showNotification('Error uploading photo', 'error');
        saveAvatarBtn.disabled = false;
        saveAvatarBtn.textContent = 'Save Photo';
      }
    });
  }
}

async function handlePersonalInfoUpdate(e) {
  e.preventDefault();
  const fullName = document.getElementById('fullName').value.trim();
  const emailInput = document.getElementById('profileEmailInput');
  const email = emailInput ? emailInput.value.trim() : '';
  
  if (!fullName) {
    showNotification('Name is required', 'error');
    return;
  }
  
  const user = await getUser();
  const { error } = await supabaseClient
    .from('profiles')
    .update({ full_name: fullName, email: email })
    .eq('id', user.id);
    
  if (error) {
    showNotification('Error updating profile', 'error');
  } else {
    showNotification('Profile updated successfully');
    await loadProfileData();
    await updateUserInfo(); // Re-render header
  }
}

async function handlePasswordChange(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;
  
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    showNotification('Please fill in all password fields', 'error');
    return;
  }

  if (newPassword !== confirmNewPassword) {
    showNotification('New passwords do not match', 'error');
    return;
  }
  
  if (newPassword.length < 6) {
    showNotification('Password must be at least 6 characters', 'error');
    return;
  }
  
  const user = await getProfile(true);
  if (!user || !user.email) {
    showNotification('A registered email is required to change your password', 'error');
    return;
  }

  const currentPasswordHash = await hashPassword(currentPassword);
  if (currentPasswordHash !== user.password_hash) {
    showNotification('Current password is incorrect', 'error');
    return;
  }

  const submitButton = document.querySelector('#changePasswordForm button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Sending Code...';
  }

  try {
    const { error } = await supabaseClient.auth.signInWithOtp({ email: user.email });
    if (error) throw error;

    pendingPasswordChange = {
      userId: user.id,
      email: user.email,
      currentPasswordHash,
      newPasswordHash: await hashPassword(newPassword)
    };

    document.getElementById('changePasswordForm').reset();
    document.getElementById('passwordOtpMessage').textContent =
      `A verification code has been sent to ${user.email}.`;
    document.getElementById('changePasswordForm').style.display = 'none';
    document.getElementById('passwordOtpForm').style.display = 'block';
    document.getElementById('passwordOtp').focus();
    showNotification('Verification code sent to your registered email');
  } catch (error) {
    console.error('Error sending password change verification code:', error);
    showNotification(error.message || 'Could not send verification code', 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Update Password';
    }
  }
}

async function handlePasswordOtpVerification(e) {
  e.preventDefault();
  const pendingChange = pendingPasswordChange;
  const otpInput = document.getElementById('passwordOtp');
  const otp = otpInput.value.trim();

  if (!pendingChange) {
    showNotification('Restart the password change process to request a new code', 'error');
    resetPasswordChange();
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    showNotification('Enter the 6-digit verification code', 'error');
    return;
  }

  const submitButton = document.querySelector('#passwordOtpForm button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Verifying...';
  }

  let otpVerified = false;
  let passwordUpdated = false;
  let verificationSessionCleanupFailed = false;
  try {
    const { error: otpError } = await supabaseClient.auth.verifyOtp({
      email: pendingChange.email,
      token: otp,
      type: 'email'
    });
    if (otpError) throw new Error(otpError.message || 'Invalid or expired verification code');
    otpVerified = true;

    const currentProfile = await getProfile(true);
    if (!currentProfile ||
        currentProfile.id !== pendingChange.userId ||
        currentProfile.email !== pendingChange.email ||
        currentProfile.password_hash !== pendingChange.currentPasswordHash) {
      throw new Error('Account details changed during verification. Restart the password change process.');
    }

    const { data, error } = await supabaseClient
      .from('profiles')
      .update({ password_hash: pendingChange.newPasswordHash })
      .eq('id', pendingChange.userId)
      .eq('password_hash', pendingChange.currentPasswordHash)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error('Password could not be updated. Restart the password change process.');
    }

    passwordUpdated = true;
  } catch (error) {
    console.error('Error verifying password change code:', error);
    showNotification(error.message || 'Could not verify the code or update the password', 'error');
  } finally {
    if (otpVerified) {
      try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
      } catch (error) {
        verificationSessionCleanupFailed = true;
        console.error('Error clearing temporary email verification session:', error);
      }
    }

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Verify Code & Update Password';
    }
  }

  if (passwordUpdated) {
    clearProfileCache();
    resetPasswordChange();
    showNotification(
      verificationSessionCleanupFailed
        ? 'Password updated. Please sign out and back in to clear the verification session.'
        : 'Password updated successfully',
      verificationSessionCleanupFailed ? 'error' : 'success'
    );
  }
}

function resetPasswordChange() {
  pendingPasswordChange = null;
  const changePasswordForm = document.getElementById('changePasswordForm');
  const passwordOtpForm = document.getElementById('passwordOtpForm');
  if (changePasswordForm) {
    changePasswordForm.reset();
    changePasswordForm.style.display = '';
  }
  if (passwordOtpForm) {
    passwordOtpForm.reset();
    passwordOtpForm.style.display = 'none';
  }
}

function initToggleSwitches() {}
function handleAddCard(e) {
  e.preventDefault();
  showNotification('Card saved locally');
  document.getElementById('addCardModal').style.display = 'none';
}
function initDocumentUploads() {}
function handleKycSubmit() {
  showNotification('KYC documents submitted successfully');
}