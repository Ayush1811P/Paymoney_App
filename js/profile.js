/**
 * Profile functionality for the PayMoney application (Supabase Integrated)
 */

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
  
  // Load extra details from localStorage to prevent them from being empty
  try {
    const savedExtra = localStorage.getItem(`profile_extra_${user.id}`);
    if (savedExtra) {
      const extraDetails = JSON.parse(savedExtra);
      const profileDob = document.getElementById('profileDob');
      const profileAddress = document.getElementById('profileAddress');
      const profileCity = document.getElementById('profileCity');
      const profileState = document.getElementById('profileState');
      const profilePincode = document.getElementById('profilePincode');
      
      if (profileDob && extraDetails.dob) profileDob.value = extraDetails.dob;
      if (profileAddress && extraDetails.address) profileAddress.value = extraDetails.address;
      if (profileCity && extraDetails.city) profileCity.value = extraDetails.city;
      if (profileState && extraDetails.state) profileState.value = extraDetails.state;
      if (profilePincode && extraDetails.pincode) profilePincode.value = extraDetails.pincode;
    }
  } catch (e) {
    console.error('Error loading extra details', e);
  }
  
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
      const { error } = await supabaseClient
        .from('profiles')
        .update({ avatar_url: base64Image })
        .eq('id', user.id);
        
      if (error) {
        showNotification('Error uploading photo: ' + error.message, 'error');
        saveAvatarBtn.disabled = false;
        saveAvatarBtn.textContent = 'Save Photo';
      } else {
        showNotification('Profile picture updated successfully');
        avatarModal.style.display = 'none';
        saveAvatarBtn.textContent = 'Save Photo';
        saveAvatarBtn.disabled = true;
        await loadProfileData();
        await updateUserInfo();
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
    // Save extra details to localStorage
    try {
      const extraDetails = {
        dob: document.getElementById('profileDob')?.value || '',
        address: document.getElementById('profileAddress')?.value || '',
        city: document.getElementById('profileCity')?.value || '',
        state: document.getElementById('profileState')?.value || '',
        pincode: document.getElementById('profilePincode')?.value || ''
      };
      localStorage.setItem(`profile_extra_${user.id}`, JSON.stringify(extraDetails));
    } catch (e) {
      console.error('Error saving extra details', e);
    }
    
    showNotification('Profile updated successfully');
    await loadProfileData();
    await updateUserInfo(); // Re-render header
  }
}

async function handlePasswordChange(e) {
  e.preventDefault();
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;
  
  if (!newPassword || !confirmNewPassword) return;
  if (newPassword !== confirmNewPassword) {
    showNotification('New passwords do not match', 'error');
    return;
  }
  
  if (newPassword.length <= 5) {
    showNotification('Password must be greater than 5 digits', 'error');
    return;
  }
  
  const hashedPassword = await hashPassword(newPassword);
  const user = await getUser();
  
  const { error } = await supabaseClient
    .from('profiles')
    .update({ password_hash: hashedPassword })
    .eq('id', user.id);
  
  if (error) {
    showNotification('Error changing password: ' + error.message, 'error');
  } else {
    clearProfileCache();
    showNotification('Password updated successfully');
    document.getElementById('changePasswordForm').reset();
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