/**
 * Utility functions for the PayMoney application (Supabase Integrated)
 */

let cachedProfile = null;

// Show notification
function showNotification(message, type = 'success', position = '') {
  const notification = document.getElementById('notification');
  if(!notification) return;
  notification.textContent = message;
  notification.className = `notification ${type}`;
  if (position) {
    notification.classList.add(position);
  }
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Format currency
function formatCurrency(amount) {
  return parseFloat(amount).toLocaleString('en-IN');
}

// Format date
function formatDate(date) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-IN', options);
}

// Format time
function formatTime(date) {
  const options = { hour: '2-digit', minute: '2-digit' };
  return new Date(date).toLocaleTimeString('en-IN', options);
}

// Format date and time
function formatDateTime(date) {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

// Generate transaction ID (Local mock, optionally we can use DB uuid)
function generateTransactionId() {
  return 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
}

// Get user from local session and database
async function getUser(forceRefresh = false) {
  if (forceRefresh) {
    cachedProfile = null;
  }
  
  if (cachedProfile) {
    return cachedProfile;
  }
  
  const userId = localStorage.getItem('paymoney_user_id');
  if (!userId) return null;
  
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error || !data) {
    localStorage.removeItem('paymoney_user_id');
    cachedProfile = null;
    return null;
  }
  
  cachedProfile = data;
  return data;
}

// Check if user is logged in
async function isLoggedIn() {
  const user = await getUser();
  return !!user;
}

// Redirect if not logged in
async function requireAuth() {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Redirect if already logged in
async function redirectIfLoggedIn() {
  const loggedIn = await isLoggedIn();
  if (loggedIn) {
    window.location.href = 'dashboard.html';
    return true;
  }
  return false;
}

// Get user profile from Supabase
async function getProfile(forceRefresh = false) {
  return await getUser(forceRefresh);
}

// Clear cached profile
function clearProfileCache() {
  cachedProfile = null;
}

// Get wallet balance
async function getWalletBalance() {
  const profile = await getProfile();
  return profile ? parseFloat(profile.wallet_balance) : 0;
}

// Update wallet balance
async function updateWalletBalance(newBalance) {
  const user = await getUser();
  if (!user) return;
  
  const { error } = await supabaseClient
    .from('profiles')
    .update({ wallet_balance: newBalance })
    .eq('id', user.id);
    
  if (error) {
    console.error('Error updating wallet:', error);
  } else {
    // Update local cache
    if (cachedProfile) {
      cachedProfile.wallet_balance = newBalance;
    }
  }
}

// Add transaction
async function addTransaction(amount, type, description, receiverId = null) {
  const user = await getUser();
  if (!user) return;

  const { error } = await supabaseClient
    .from('transactions')
    .insert([{
      sender_id: user.id,
      receiver_id: receiverId,
      amount: amount,
      transaction_type: type,
      description: description
    }]);

  if (error) {
    console.error('Error adding transaction:', error);
  }
}

// Get transactions
async function getTransactions() {
  const user = await getUser();
  if (!user) return [];

  const { data: txns, error } = await supabaseClient
    .from('transactions')
    .select('*')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  if (!txns || txns.length === 0) return [];

  // Fetch profiles for senders and receivers
  const profileIds = new Set();
  txns.forEach(tx => {
    if (tx.sender_id) profileIds.add(tx.sender_id);
    if (tx.receiver_id) profileIds.add(tx.receiver_id);
  });

  const { data: profiles } = await supabaseClient
    .from('profiles')
    .select('id, full_name, upi_id, phone')
    .in('id', Array.from(profileIds));

  const profileMap = {};
  if (profiles) {
    profiles.forEach(p => profileMap[p.id] = p);
  }

  // Attach sender/receiver to each transaction and formulate title
  txns.forEach(tx => {
    tx.sender = profileMap[tx.sender_id];
    tx.receiver = profileMap[tx.receiver_id];
    
    // Fix description for receiver
    if (tx.receiver_id === user.id && tx.transaction_type === 'peer_to_peer') {
      const senderIdentifier = tx.sender ? (tx.sender.upi_id || tx.sender.phone || tx.sender.full_name) : 'Unknown';
      
      // Extract the note if present
      let note = '';
      if (tx.description && tx.description.includes(' - ')) {
        note = ' - ' + tx.description.split(' - ').slice(1).join(' - ');
      }
      
      tx.display_description = `Received from ${senderIdentifier}${note}`;
    } else {
      tx.display_description = tx.description;
    }
  });

  return txns;
}

// Handle mobile menu toggle
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger-menu');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
      
      const bars = hamburger.querySelectorAll('.bar');
      bars[0].style.transform = mobileMenu.classList.contains('active') ? 'rotate(45deg) translate(5px, 5px)' : '';
      bars[1].style.opacity = mobileMenu.classList.contains('active') ? '0' : '1';
      bars[2].style.transform = mobileMenu.classList.contains('active') ? 'rotate(-45deg) translate(5px, -5px)' : '';
    });
  }
}

// Handle logout
function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  const mobileLogout = document.getElementById('mobileLogout');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  if (mobileLogout) {
    mobileLogout.addEventListener('click', handleLogout);
  }
}

async function handleLogout(e) {
  e.preventDefault();
  localStorage.removeItem('paymoney_user_id');
  showNotification('Logged out successfully');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1000);
}

// Update user info in header
function getAvatarUrl(profile) {
  if (profile && profile.avatar_url) {
    return profile.avatar_url;
  }
  const seed = profile ? (profile.full_name || profile.phone || 'user') : 'user';
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
}

async function updateUserInfo() {
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  
  if (userName || userAvatar) {
    const profile = await getProfile();
    if(profile) {
      if (userName) {
        userName.textContent = profile.full_name;
      }
      if (userAvatar) {
        userAvatar.src = getAvatarUrl(profile);
      }
    }
  }
}

// Initialize modals
function initModals() {
  const modals = document.querySelectorAll('.modal');
  const closeButtons = document.querySelectorAll('.close-modal');
  
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      modal.style.display = 'none';
    });
  });
  
  window.addEventListener('click', (event) => {
    modals.forEach(modal => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

// Load a script dynamically
function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Inject QR Modal HTML dynamically
function injectQrModal() {
  if (document.getElementById('qrModal')) return;
  
  const modalHtml = `
    <div id="qrModal" class="modal" style="display: none;">
      <div class="modal-content" style="max-width: 400px; text-align: center;">
        <span class="close-modal" id="closeQrModal" style="float: right; cursor: pointer; font-size: 24px; font-weight: bold;">&times;</span>
        <h2 style="margin-bottom: var(--spacing-sm); font-size: 1.5rem; font-weight: 700; color: var(--secondary-color);">Your PayMoney QR</h2>
        <p style="color: var(--text-medium); margin-bottom: var(--spacing-md); font-size: 0.9rem;">Scan to pay instantly</p>
        
        <div style="background: white; padding: var(--spacing-md); border-radius: var(--border-radius-lg); display: inline-block; box-shadow: var(--shadow-sm); margin-bottom: var(--spacing-md); border: 1px solid var(--border-color);">
          <canvas id="qrCanvas" style="display: block; width: 220px; height: 220px;"></canvas>
        </div>
        
        <div id="qrDetails" style="margin-bottom: var(--spacing-lg);">
          <h3 id="qrUserName" style="margin: 0; font-size: 1.1rem; color: var(--text-dark); font-weight: 500;">Loading...</h3>
          <p id="qrUserUpi" style="margin: 4px 0 0 0; font-size: 0.9rem; color: var(--text-medium); font-family: monospace; letter-spacing: 0.5px;">Loading...</p>
        </div>
        
        <button id="downloadQrBtn" class="btn btn-primary" style="width: 100%;">Download QR Code</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Wire up close button specifically for this modal since it's dynamically added
  const closeBtn = document.getElementById('closeQrModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('qrModal').style.display = 'none';
    });
  }
}

// Initialize Show QR and Scan QR menu links
function initQrMenuOptions() {
  // Add options to nav-tabs (Desktop)
  const navTabs = document.querySelector('.nav-tabs');
  if (navTabs) {
    if (!document.getElementById('showQrBtn')) {
      const qrLi = document.createElement('li');
      qrLi.innerHTML = '<a href="#" id="showQrBtn">Show QR</a>';
      navTabs.appendChild(qrLi);
      document.getElementById('showQrBtn').addEventListener('click', handleShowQr);
    }
    

  }
  
  // Add options to mobile-menu
  const mobileMenuUl = document.querySelector('.mobile-menu ul');
  if (mobileMenuUl) {
    if (!document.getElementById('mobileShowQrBtn')) {
      const qrMobileLi = document.createElement('li');
      qrMobileLi.innerHTML = '<a href="#" id="mobileShowQrBtn">Show QR</a>';
      
      const logoutLi = document.getElementById('mobileLogout')?.parentElement;
      if (logoutLi) {
        mobileMenuUl.insertBefore(qrMobileLi, logoutLi);
      } else {
        mobileMenuUl.appendChild(qrMobileLi);
      }
      document.getElementById('mobileShowQrBtn').addEventListener('click', handleShowQr);
    }
    

  }
}

// Open Scan QR Modal and start camera
async function handleScanQr(e) {
  e.preventDefault();
  
  // Close mobile menu if active
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenu && mobileMenu.classList.contains('active')) {
    mobileMenu.classList.remove('active');
    const hamburger = document.querySelector('.hamburger-menu');
    if (hamburger) {
      const bars = hamburger.querySelectorAll('.bar');
      if (bars.length === 3) {
        bars[0].style.transform = '';
        bars[1].style.opacity = '1';
        bars[2].style.transform = '';
      }
    }
  }
  
  injectScanQrModals();
  const scanQrModal = document.getElementById('scanQrModal');
  if (!scanQrModal) return;
  
  const scannerInterface = document.getElementById('scannerInterface');
  const scanQrResultCard = document.getElementById('scanQrResultCard');
  const loadingBarContainer = document.getElementById('scanLoadingBarContainer');
  const scannerUploadControls = document.getElementById('scannerUploadControls');
  const uploadedPreview = document.getElementById('uploadedQrPreview');
  const scannerOverlay = document.getElementById('scannerOverlay');
  const fileInput = document.getElementById('qrFileInput');
  
  if (scannerInterface) scannerInterface.style.display = 'block';
  if (scanQrResultCard) scanQrResultCard.style.display = 'none';
  if (loadingBarContainer) loadingBarContainer.style.display = 'none';
  if (scannerUploadControls) scannerUploadControls.style.display = 'block';
  if (uploadedPreview) {
    uploadedPreview.style.display = 'none';
    uploadedPreview.src = '';
  }
  if (scannerOverlay) scannerOverlay.style.display = 'flex';
  if (fileInput) fileInput.value = '';
  
  scanQrModal.style.display = 'block';
  
  try {
    // Load html5-qrcode library
    await loadScript('https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js');
    
    // Wire up file upload handler
    setupFileInputListener();
    
    // Start camera feed
    await startCameraScanner();
  } catch (error) {
    console.error('Error starting scanner:', error);
  }
}

function setupFileInputListener() {
  const fileInput = document.getElementById('qrFileInput');
  
  if (fileInput && !fileInput.dataset.listenerAttached) {
    fileInput.dataset.listenerAttached = 'true';
    
    fileInput.addEventListener('change', async (e) => {
      if (e.target.files.length === 0) return;
      const imageFile = e.target.files[0];
      
      // Stop active camera
      await stopCameraScanner();
      
      const scannerOverlay = document.getElementById('scannerOverlay');
      const uploadedPreview = document.getElementById('uploadedQrPreview');
      const scannerUploadControls = document.getElementById('scannerUploadControls');
      const loadingBarContainer = document.getElementById('scanLoadingBarContainer');
      const progressBar = document.getElementById('scanLoadingProgress');
      
      // Hide uploader controls immediately
      if (scannerUploadControls) scannerUploadControls.style.display = 'none';
      
      // Read the file for preview and scan
      const reader = new FileReader();
      reader.onload = function(event) {
        // Show uploaded image inside viewfinder box and remove scanner overlay
        if (uploadedPreview) {
          uploadedPreview.src = event.target.result;
          uploadedPreview.style.display = 'block';
        }
        if (scannerOverlay) {
          scannerOverlay.style.display = 'none';
        }
        
        // Show loading spinner progress bar
        if (loadingBarContainer) loadingBarContainer.style.display = 'block';
        if (progressBar) progressBar.style.width = '0%';
        
        // Animate progress bar over 1000ms
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progressBar) progressBar.style.width = `${progress}%`;
          
          if (progress >= 100) {
            clearInterval(interval);
            
            // Perform decode
            const img = new Image();
            img.onload = async function() {
              const maxDimension = 800;
              let width = img.width;
              let height = img.height;
              
              if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                  height = Math.round((height * maxDimension) / width);
                  width = maxDimension;
                } else {
                  width = Math.round((width * maxDimension) / height);
                  height = maxDimension;
                }
              }
              
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              try {
                // Try Engine 1: Html5Qrcode scanFile (highly optimized for screenshots/noise)
                try {
                  const html5Qr = new Html5Qrcode("qrReader");
                  const decodedText = await html5Qr.scanFile(imageFile, false);
                  if (loadingBarContainer) loadingBarContainer.style.display = 'none';
                  await onQrScanSuccess(decodedText);
                  return;
                } catch (html5Err) {
                  console.warn("Engine 1 (Html5Qrcode) scan file failed, trying Engine 2 (jsQR)...", html5Err);
                }

                // Try Engine 2: jsQR pixel array decoder (fallback)
                await loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js');
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code) {
                  if (loadingBarContainer) loadingBarContainer.style.display = 'none';
                  await onQrScanSuccess(code.data);
                } else {
                  showNotification("Could not find a valid QR code in the image. Please select a clear QR code.", "error");
                  resetScannerView();
                }
              } catch (err) {
                console.error("Dual-engine QR scan failed:", err);
                showNotification("Failed to scan QR image.", "error");
                resetScannerView();
              }
            };
            img.onerror = function() {
              showNotification("Failed to load image preview.", "error");
              resetScannerView();
            };
            img.src = event.target.result;
          }
        }, 100);
      };
      
      reader.onerror = function() {
        showNotification("Failed to read image file.", "error");
        resetScannerView();
      };
      
      reader.readAsDataURL(imageFile);
    });
  }
}

function resetScannerView() {
  const scannerInterface = document.getElementById('scannerInterface');
  const scannerOverlay = document.getElementById('scannerOverlay');
  const uploadedPreview = document.getElementById('uploadedQrPreview');
  const scannerUploadControls = document.getElementById('scannerUploadControls');
  const loadingBarContainer = document.getElementById('scanLoadingBarContainer');
  const fileInput = document.getElementById('qrFileInput');
  
  if (loadingBarContainer) loadingBarContainer.style.display = 'none';
  if (uploadedPreview) {
    uploadedPreview.style.display = 'none';
    uploadedPreview.src = '';
  }
  if (scannerOverlay) scannerOverlay.style.display = 'flex';
  if (scannerUploadControls) scannerUploadControls.style.display = 'block';
  if (scannerInterface) scannerInterface.style.display = 'block';
  if (fileInput) fileInput.value = '';
  
  // Restart camera stream
  startCameraScanner();
}

async function requestCameraAccess() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      // Force prompt for camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      // Stop the stream immediately to free the resource
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error("Camera access permission denied:", err);
      return false;
    }
  }
  return false;
}

async function startCameraScanner() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // file:// context blocker notice
      showNotification("Browser blocks camera access on local files (file://). Please upload your QR image instead.", "warning");
      return;
    }
    
    showNotification("Requesting camera access...");
    const hasPermission = await requestCameraAccess();
    if (!hasPermission) {
      showNotification("Camera access denied. Please grant permission in browser settings or upload the QR image.", "error");
      return;
    }
    
    if (!html5Qrcode) {
      html5Qrcode = new Html5Qrcode("qrReader");
    }
    
    const config = { fps: 10, qrbox: { width: 220, height: 220 } };
    
    await html5Qrcode.start(
      { facingMode: "environment" },
      config,
      async (decodedText) => {
        await onQrScanSuccess(decodedText);
      },
      (errorMessage) => {
        // Silent
      }
    );
  } catch (err) {
    console.error("Camera access failed", err);
    showNotification("Failed to start camera. Please upload the QR code image below.", "error");
  }
}

async function stopCameraScanner() {
  if (html5Qrcode) {
    try {
      if (html5Qrcode.isScanning) {
        await html5Qrcode.stop();
      }
    } catch (err) {
      console.error("Error stopping camera", err);
    }
    html5Qrcode = null;
  }
}

let scannedReceiver = null;

async function onQrScanSuccess(decodedText) {
  // Stop scanner
  await stopCameraScanner();
  
  // Parse QR contents (Case-insensitive check)
  let upiId = '';
  const cleanText = decodedText.trim();
  
  // Try matching pa=... parameter in a case-insensitive way
  const paMatch = cleanText.match(/pa=([^&]+)/i);
  if (paMatch) {
    upiId = paMatch[1];
  } else if (cleanText.includes('@')) {
    // Treat the whole text as raw UPI ID fallback if it contains @
    upiId = cleanText;
  } else {
    upiId = cleanText;
  }
  
  if (!upiId) {
    showNotification('Invalid QR code format', 'error');
    return;
  }
  upiId = decodeURIComponent(upiId).trim();
  
  // Lookup recipient details
  showNotification('Fetching recipient details...');
  let query = supabaseClient.from('profiles').select('id, full_name, upi_id, phone, wallet_balance');
  if (upiId.includes('@')) {
    if (upiId.endsWith('@paymoney')) {
      const phoneNum = upiId.split('@')[0];
      query = query.or(`upi_id.eq.${upiId},phone.eq.${phoneNum}`);
    } else {
      query = query.eq('upi_id', upiId);
    }
  } else {
    query = query.eq('phone', upiId);
  }
  
  const { data: receiverData, error: receiverError } = await query.maybeSingle();
  
  if (receiverError || !receiverData) {
    showNotification('PayMoney user/account not found for this QR', 'error');
    return;
  }
  
  const user = await getUser();
  if (receiverData.id === user.id) {
    showNotification('Cannot send money to yourself', 'error');
    return;
  }
  
  // Save recipient details
  window.scannedReceiver = receiverData;
  
  // Populate confirmation card
  const upiAddress = receiverData.upi_id || `${receiverData.phone}@paymoney`;
  document.getElementById('resolvedReceiverName').textContent = receiverData.full_name;
  document.getElementById('resolvedReceiverUpi').textContent = upiAddress;
  document.getElementById('resolvedReceiverAvatar').textContent = (receiverData.full_name || 'U').charAt(0).toUpperCase();
  
  // Update button text to "Pay to [User Name]"
  document.getElementById('proceedToPayBtn').textContent = `Pay to ${receiverData.full_name}`;
  
  // Switch modal view
  document.getElementById('scannerInterface').style.display = 'none';
  document.getElementById('scanQrResultCard').style.display = 'block';
}

// Inject Scan QR Modals HTML dynamically
function injectScanQrModals() {
  if (document.getElementById('scanQrModal')) return;
  
  const scanModalHtml = `
    <div id="scanQrModal" class="modal" style="display: none;">
      <style>
        @keyframes scanLaser {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loader-spinner {
          width: 40px; 
          height: 40px; 
          border: 4px solid var(--border-color); 
          border-top-color: var(--primary-color); 
          border-radius: 50%; 
          animation: spin 1s linear infinite;
          margin: 0 auto 12px auto;
        }
        .scanner-viewfinder {
          position: relative; 
          margin-bottom: var(--spacing-md); 
          background: linear-gradient(135deg, var(--secondary-dark), #003a80); 
          border-radius: var(--border-radius-lg); 
          overflow: hidden; 
          min-height: 250px; 
          border: 2px solid var(--primary-color); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          box-shadow: var(--shadow-md);
        }
        .scanner-overlay {
          position: absolute; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 100%; 
          pointer-events: none; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          z-index: 2;
        }
        .scanner-target-box {
          width: 170px; 
          height: 170px; 
          border: 2px dashed rgba(0, 186, 242, 0.6); 
          border-radius: var(--border-radius-md); 
          position: relative;
          background-color: rgba(0, 41, 112, 0.2);
        }
        .scanner-laser-line {
          position: absolute; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 3px; 
          background-color: var(--primary-color); 
          box-shadow: 0 0 10px var(--primary-color); 
          animation: scanLaser 2s linear infinite;
        }
      </style>
      
      <div class="modal-content" style="max-width: 450px; text-align: center;">
        <span class="close-modal" id="closeScanQrModal" style="float: right; cursor: pointer; font-size: 24px; font-weight: bold;">&times;</span>
        
        <!-- Scanner interface -->
        <div id="scannerInterface">
          <h2 style="color: var(--secondary-color); margin-bottom: var(--spacing-sm); font-size: 1.5rem; font-weight: 700;">Scan QR Code</h2>
          <p style="color: var(--text-medium); margin-bottom: var(--spacing-md); font-size: 0.9rem;">Scan a PayMoney QR to send money instantly</p>
          
          <!-- Styled Viewfinder -->
          <div class="scanner-viewfinder">
            <div id="qrReader" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;"></div>
            <!-- Uploaded Image Preview -->
            <img id="uploadedQrPreview" style="display: none; width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0; z-index: 2;" alt="Uploaded QR Preview">
            
            <div class="scanner-overlay" id="scannerOverlay">
              <div class="scanner-target-box">
                <div class="scanner-laser-line"></div>
              </div>
              <p style="color: white; font-size: 0.85rem; margin-top: var(--spacing-md); font-weight: 500; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">Align QR code within the frame</p>
            </div>
          </div>
          
          <div style="margin: var(--spacing-md) 0; display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--text-light); font-size: 0.9rem;">
            <span style="height: 1px; background: var(--border-color); flex: 1;"></span>
            <span>OR</span>
            <span style="height: 1px; background: var(--border-color); flex: 1;"></span>
          </div>
          
          <!-- Styled Gallery Upload -->
          <div class="form-group" style="text-align: left; margin-bottom: 0;" id="scannerUploadControls">
            <label style="display: block; font-weight: 500; margin-bottom: 8px; font-size: 0.95rem; color: var(--text-dark);">Upload from Gallery</label>
            <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
              <label for="qrFileInput" class="btn btn-outline" style="cursor: pointer; border: 1px dashed var(--primary-color); background-color: var(--primary-light); color: var(--primary-dark); padding: 10px 16px; border-radius: var(--border-radius-md); font-weight: 500; display: inline-flex; align-items: center; gap: 8px; margin: 0; justify-content: center; width: 100%; transition: all var(--transition-fast);">
                <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: currentColor;"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                Choose QR Image
              </label>
              <input type="file" id="qrFileInput" accept="image/*" style="display: none;">
            </div>
          </div>
        </div>
        
        <!-- Loading spinner and bar -->
        <div id="scanLoadingBarContainer" style="display: none; padding: var(--spacing-lg) 0; text-align: center;">
          <div class="loader-spinner"></div>
          <p style="color: var(--secondary-color); font-weight: 600; margin-bottom: 12px; font-size: 1.05rem;" id="scanLoadingText">Please wait...</p>
          <div style="width: 100%; height: 8px; background-color: var(--bg-grey); border-radius: 4px; overflow: hidden; position: relative; border: 1px solid var(--border-color);">
            <div id="scanLoadingProgress" style="width: 0%; height: 100%; background-color: var(--primary-color); transition: width 0.1s linear; border-radius: 4px;"></div>
          </div>
        </div>
        
        <!-- Result card -->
        <div id="scanQrResultCard" style="display: none; padding: var(--spacing-md);">
          <h2 style="color: var(--secondary-color); margin-bottom: var(--spacing-md); font-size: 1.5rem; font-weight: 700;">Pay Recipient</h2>
          <div style="background: var(--bg-grey); padding: var(--spacing-lg); border-radius: var(--border-radius-lg); margin-bottom: var(--spacing-lg); border: 1px solid var(--border-color); display: flex; flex-direction: column; align-items: center;">
            <div style="width: 60px; height: 60px; background-color: var(--secondary-light); color: var(--secondary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.5rem; margin-bottom: var(--spacing-sm);" id="resolvedReceiverAvatar">R</div>
            <h3 id="resolvedReceiverName" style="margin: 0; font-size: 1.15rem; font-weight: 600; color: var(--text-dark);">Receiver Name</h3>
            <p id="resolvedReceiverUpi" style="margin: 4px 0 0 0; font-size: 0.9rem; color: var(--text-medium); font-family: monospace; letter-spacing: 0.5px;">receiver@paymoney</p>
          </div>
          <button id="proceedToPayBtn" class="btn btn-primary" style="width: 100%;">Pay to User</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', scanModalHtml);
  
  // Wire up close button specifically for Scan Modal
  const closeScanBtn = document.getElementById('closeScanQrModal');
  if (closeScanBtn) {
    closeScanBtn.addEventListener('click', async () => {
      document.getElementById('scanQrModal').style.display = 'none';
      await stopCameraScanner();
    });
  }
  
  // Close scanner if user clicks outside of scan modal
  window.addEventListener('click', async (event) => {
    const scanQrModal = document.getElementById('scanQrModal');
    if (event.target === scanQrModal) {
      scanQrModal.style.display = 'none';
      await stopCameraScanner();
    }
  });
  
  // Wire up proceed to pay button
  const proceedToPayBtn = document.getElementById('proceedToPayBtn');
  if (proceedToPayBtn) {
    proceedToPayBtn.addEventListener('click', () => {
      const receiver = window.scannedReceiver;
      if (!receiver) return;
      
      document.getElementById('scanQrModal').style.display = 'none';
      
      const upiAddress = receiver.upi_id || `${receiver.phone}@paymoney`;
      const fullName = receiver.full_name || 'User';
      
      if (window.location.pathname.endsWith('upi.html')) {
        const sendUpiBtn = document.getElementById('sendUpiBtn');
        if (sendUpiBtn) sendUpiBtn.click();
        
        const recipientUpiIdInput = document.getElementById('recipientUpiId');
        if (recipientUpiIdInput) {
          recipientUpiIdInput.value = upiAddress;
          recipientUpiIdInput.readOnly = true;
        }
      } else {
        const currentPath = window.location.href.split('?')[0];
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
        window.location.href = basePath + `upi.html?pa=${encodeURIComponent(upiAddress)}&pn=${encodeURIComponent(fullName)}`;
      }
    });
  }
}

// Handle QR Display and Render
async function handleShowQr(e) {
  e.preventDefault();
  
  // Close mobile menu if active
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenu && mobileMenu.classList.contains('active')) {
    mobileMenu.classList.remove('active');
    // Also reset hamburger lines opacity/transform if present
    const hamburger = document.querySelector('.hamburger-menu');
    if (hamburger) {
      const bars = hamburger.querySelectorAll('.bar');
      if (bars.length === 3) {
        bars[0].style.transform = '';
        bars[1].style.opacity = '1';
        bars[2].style.transform = '';
      }
    }
  }
  
  const qrModal = document.getElementById('qrModal');
  if (!qrModal) return;
  
  // Display modal
  qrModal.style.display = 'block';
  
  try {
    // Load Qrious script
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js');
    
    const profile = await getProfile();
    if (!profile) {
      showNotification('Please log in first', 'error');
      qrModal.style.display = 'none';
      return;
    }
    
    const upiAddress = profile.upi_id || `${profile.phone}@paymoney`;
    const displayUpi = profile.upi_id || '';
    const fullName = profile.full_name || 'User';
    
    // Update texts
    document.getElementById('qrUserName').textContent = fullName;
    document.getElementById('qrUserUpi').textContent = displayUpi;
    
    // Generate QR
    const qrValue = `upi://pay?pa=${upiAddress}&pn=${encodeURIComponent(fullName)}&cu=INR`;
    const canvas = document.getElementById('qrCanvas');
    
    const qr = new QRious({
      element: canvas,
      value: qrValue,
      size: 220,
      background: '#ffffff',
      foreground: '#000000', // Set to pure black for high contrast scanning
      level: 'M' // Set to Medium (less dense blocks, faster scanning)
    });
    
    // Wire up download handler (remove old listener to prevent duplicates)
    const downloadBtn = document.getElementById('downloadQrBtn');
    const newDownloadBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);
    
    newDownloadBtn.addEventListener('click', () => {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${fullName.replace(/\s+/g, '_')}_paymoney_qr.png`;
      link.href = dataUrl;
      link.click();
      showNotification('QR Code downloaded successfully');
    });
    
  } catch (error) {
    console.error('Error generating QR:', error);
    showNotification('Failed to generate QR code', 'error');
    qrModal.style.display = 'none';
  }
}

// Initialize common elements
async function initCommon() {
  initMobileMenu();
  initLogout();
  injectQrModal();
  injectScanQrModals();
  initQrMenuOptions();
  await updateUserInfo();
  initModals();
}

// Utility formatting
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  const re = /^[0-9]{10}$/;
  return re.test(phone);
}

// Hash a password using SHA-256
async function hashPassword(password) {
  if (!window.crypto || !window.crypto.subtle) {
    // Fallback for file:// protocol where Web Crypto is disabled
    return 'fallback_' + btoa(password);
  }
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// === GLOBAL UPI VERIFICATION SYSTEM ===

const INDIAN_IFSC_CODES = [
  'SBIN0001234', 'HDFC0005678', 'ICIC0009101', 'UTIB0001121', 'PUNB0003141',
  'BKID0005161', 'CNRB0007181', 'BOFA0009201', 'KKBK0001221', 'IDIB0003241'
];

let globalUpiCallback = null;
let currentUpiPin = '';
const PIN_LENGTH = 4;

function injectUpiModals() {
  if (document.getElementById('upiGlobalOverlay')) return;

  const html = `
    <div id="upiGlobalOverlay" class="upi-global-overlay">
      <!-- Add Bank Account Modal -->
      <div id="addBankModal" class="upi-global-modal" style="display: none;">
        <div class="upi-global-header">
          <h3>Link Bank Account</h3>
          <button class="upi-global-close" onclick="closeUpiModals()">&times;</button>
        </div>
        <div class="upi-global-body">
          <p style="font-size: 0.9rem; margin-bottom: 15px; color: var(--text-light);">Please link a bank account for UPI payments.</p>
          <div class="form-group">
            <label>Account Holder Name</label>
            <input type="text" id="globalAccName">
          </div>
          <div class="form-group">
            <label>Account Number</label>
            <input type="text" id="globalAccNum">
          </div>
          <div class="form-group">
            <label>Mobile Number</label>
            <input type="text" id="globalAccPhone">
          </div>
          <div class="form-group">
            <label>IFSC Code</label>
            <input type="text" id="globalAccIfsc">
          </div>
        </div>
        <div class="upi-global-footer">
          <button class="btn btn-primary" onclick="confirmAddBankAccount()">Done</button>
        </div>
      </div>

      <!-- Set UPI PIN Modal -->
      <div id="setUpiModal" class="upi-global-modal" style="display: none;">
        <div class="upi-global-header">
          <h3>Set UPI ID & PIN</h3>
          <button class="upi-global-close" onclick="closeUpiModals()">&times;</button>
        </div>
        <div class="upi-global-body">
          <div class="form-group">
            <label>Choose UPI ID</label>
            <input type="text" id="globalSetupUpiId" placeholder="e.g. name@paymoney">
          </div>
          <div class="form-group">
            <label>Set 4-Digit UPI PIN</label>
            <input type="password" id="globalSetupUpiPin" placeholder="****" maxlength="4" style="text-align: center; letter-spacing: 5px; font-size: 1.2rem;">
          </div>
        </div>
        <div class="upi-global-footer">
          <button class="btn btn-primary" onclick="confirmSetUpi()">Set PIN</button>
        </div>
      </div>

      <!-- Enter UPI PIN Modal -->
      <div id="enterUpiModal" class="upi-global-modal" style="display: none;">
        <div class="upi-global-header">
          <h3>Enter UPI PIN</h3>
          <button class="upi-global-close" onclick="closeUpiModals()">&times;</button>
        </div>
        <div class="upi-global-body">
          <p style="text-align: center; color: var(--text-light); margin-bottom: 20px;">Paying <strong id="globalUpiPayAmount"></strong></p>
          
          <div class="form-group" style="text-align: center; margin-bottom: 20px;">
            <input type="password" id="globalPhysicalUpiPin" placeholder="****" maxlength="4" style="text-align: center; letter-spacing: 10px; font-size: 1.5rem; padding: 10px; width: 50%; border-radius: var(--border-radius-md); border: 1px solid var(--border-color); margin: 0 auto;">
          </div>
          
          <div style="text-align: center;">
            <button class="btn btn-primary" onclick="submitUpiPin()" style="width: 100%;">Confirm Payment</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

function closeUpiModals() {
  const overlay = document.getElementById('upiGlobalOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    document.getElementById('addBankModal').style.display = 'none';
    document.getElementById('setUpiModal').style.display = 'none';
    document.getElementById('enterUpiModal').style.display = 'none';
  }
}

async function requireUpiVerification(amount, onSuccess) {
  globalUpiCallback = onSuccess;
  const user = await getUser();
  if (!user) {
    showNotification('Please login to continue', 'error');
    return;
  }

  // Check if bank account exists
  const { data: bankAccounts } = await supabaseClient
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id);

  const overlay = document.getElementById('upiGlobalOverlay');
  overlay.classList.add('show');

  if (!bankAccounts || bankAccounts.length === 0) {
    // Show Add Bank Account
    document.getElementById('addBankModal').style.display = 'block';
    
    // Auto-fill random data
    document.getElementById('globalAccName').value = user.full_name;
    document.getElementById('globalAccPhone').value = user.phone;
    
    // Generate unique 10 digit account number
    const randomAccNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    document.getElementById('globalAccNum').value = randomAccNum;
    
    const randomIfsc = INDIAN_IFSC_CODES[Math.floor(Math.random() * INDIAN_IFSC_CODES.length)];
    document.getElementById('globalAccIfsc').value = randomIfsc;
  } else if (!user.upi_id || !user.upi_pin) {
    // Show Setup UPI PIN
    document.getElementById('setUpiModal').style.display = 'block';
  } else {
    // Both exist, ask for PIN
    document.getElementById('enterUpiModal').style.display = 'block';
    document.getElementById('globalUpiPayAmount').textContent = '₹' + amount;
    clearUpiPin();
  }
}

async function confirmAddBankAccount() {
  const user = await getUser();
  const accNum = document.getElementById('globalAccNum').value;
  const ifsc = document.getElementById('globalAccIfsc').value;

  const { error } = await supabaseClient
    .from('bank_accounts')
    .insert([{
      user_id: user.id,
      bank_name: 'AutoLinked Bank',
      account_number: accNum,
      ifsc_code: ifsc
    }]);

  if (error) {
    showNotification('Failed to add bank account', 'error');
    return;
  }

  showNotification('Bank account linked!', 'success');
  
  // Transition to Set UPI PIN modal
  document.getElementById('addBankModal').style.display = 'none';
  document.getElementById('setUpiModal').style.display = 'block';
}

async function confirmSetUpi() {
  const user = await getUser();
  const upiId = document.getElementById('globalSetupUpiId').value;
  const upiPin = document.getElementById('globalSetupUpiPin').value;

  if (!upiId || upiPin.length !== 4) {
    showNotification('Enter a valid UPI ID and 4-digit PIN', 'error');
    return;
  }

  const hashedPin = await hashPassword(upiPin);

  const { error } = await supabaseClient
    .from('profiles')
    .update({ upi_id: upiId, upi_pin: hashedPin })
    .eq('id', user.id);

  if (error) {
    showNotification('Error setting UPI PIN', 'error');
    return;
  }

  // Update cache
  if (cachedProfile) {
    cachedProfile.upi_id = upiId;
    cachedProfile.upi_pin = hashedPin;
  }

  showNotification('UPI PIN set successfully!', 'success');
  
  // Transition to Enter PIN modal
  document.getElementById('setUpiModal').style.display = 'none';
  document.getElementById('enterUpiModal').style.display = 'block';
  clearUpiPin();
}

function pressUpiKey(num) {
  if (currentUpiPin.length < PIN_LENGTH) {
    currentUpiPin += num.toString();
    updatePinDots();
  }
}

function clearUpiPin() {
  currentUpiPin = '';
  updatePinDots();
  const pinInput = document.getElementById('globalPhysicalUpiPin');
  if (pinInput) pinInput.value = '';
}

function updatePinDots() {
  const dots = document.querySelectorAll('#globalUpiPinDots .pin-dot');
  dots.forEach((dot, index) => {
    if (index < currentUpiPin.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  });
}

async function submitUpiPin() {
  try {
    const pinInput = document.getElementById('globalPhysicalUpiPin');
    const pinValue = pinInput ? pinInput.value : currentUpiPin;

    if (pinValue.length !== PIN_LENGTH) {
      showNotification('Please enter 4-digit PIN', 'error');
      return;
    }

    const user = await getUser();
    const hashedInputPin = await hashPassword(pinValue);

    if (user.upi_pin !== hashedInputPin) {
      showNotification('Incorrect UPI PIN', 'error');
      clearUpiPin();
      return;
    }

    // Correct PIN
    clearUpiPin();
    closeUpiModals();
    if (globalUpiCallback) {
      await globalUpiCallback();
    }
  } catch (error) {
    console.error('Transaction error:', error);
    showNotification('Error: ' + (error.message || 'Transaction failed'), 'error');
    closeUpiModals();
  }
}

// Intercept window load to inject modals
document.addEventListener('DOMContentLoaded', async () => {
  injectUpiModals();
  if (typeof initCommon === 'function') {
    await initCommon();
  }
});