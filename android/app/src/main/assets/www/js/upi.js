/**
 * UPI functionality for the PayMoney application (Supabase Integrated)
 */

let pendingPayment = null;

document.addEventListener('DOMContentLoaded', async function() {
  // 1. Initialize Event Listeners (Synchronous)
  const linkBankBtn = document.getElementById('linkBankBtn');
  if (linkBankBtn) {
    linkBankBtn.addEventListener('click', () => {
      document.getElementById('linkBankModal').style.display = 'block';
    });
  }
  
  const linkBankForm = document.getElementById('linkBankForm');
  if (linkBankForm) {
    linkBankForm.addEventListener('submit', handleLinkBank);
  }
  
  const setupUpiBtn = document.getElementById('setupUpiBtn');
  if (setupUpiBtn) {
    setupUpiBtn.addEventListener('click', async () => {
      const user = await getUser();
      const { data: banks } = await supabaseClient
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id);
        
      if (!banks || banks.length === 0) {
        showNotification('Please link a bank account first', 'error');
        document.getElementById('linkBankModal').style.display = 'block';
      } else {
        showSetupStep(2);
        document.getElementById('setupUpiModal').style.display = 'block';
      }
    });
  }
  
  const setupBankForm = document.getElementById('setupBankForm');
  if (setupBankForm) {
    setupBankForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const accountNumber = document.getElementById('setupAccountNumber').value.trim();
      const ifscCode = document.getElementById('setupIfscCode').value.trim().toUpperCase();
      
      const linked = await linkBankAccount(accountNumber, ifscCode, 'Bank');
      if (linked) {
        showSetupStep(2);
      }
    });
  }
  
  const createUpiForm = document.getElementById('createUpiForm');
  if (createUpiForm) {
    createUpiForm.addEventListener('submit', handleCreateUpi);
  }
  
  const completeSetupBtn = document.getElementById('completeSetupBtn');
  if (completeSetupBtn) {
    completeSetupBtn.addEventListener('click', () => {
      document.getElementById('setupUpiModal').style.display = 'none';
      loadUpiStatus();
    });
  }
  
  const sendUpiBtn = document.getElementById('sendUpiBtn');
  if (sendUpiBtn) {
    sendUpiBtn.addEventListener('click', () => {
      document.getElementById('sendUpiModal').style.display = 'block';
    });
  }
  
  const sendUpiForm = document.getElementById('sendUpiForm');
  if (sendUpiForm) {
    sendUpiForm.addEventListener('submit', handleSendUpi);
  }
  
  const confirmPinBtn = document.getElementById('confirmPinBtn');
  if (confirmPinBtn) {
    confirmPinBtn.addEventListener('click', handleConfirmPinPayment);
  }
  
  const closeUpiSuccessBtn = document.getElementById('closeUpiSuccessBtn');
  if (closeUpiSuccessBtn) {
    closeUpiSuccessBtn.addEventListener('click', () => {
      document.getElementById('upiSuccessModal').style.display = 'none';
    });
  }
  
  const downloadUpiReceiptBtn = document.getElementById('downloadUpiReceiptBtn');
  if (downloadUpiReceiptBtn) {
    downloadUpiReceiptBtn.addEventListener('click', downloadUpiReceipt);
  }
  
  // 2. Check for scanned QR query parameters (Synchronous)
  const urlParams = new URLSearchParams(window.location.search);
  const qrUpiId = urlParams.get('pa') || urlParams.get('PA');
  if (qrUpiId) {
    if (sendUpiBtn) {
      sendUpiBtn.click();
    }
    
    // Pre-fill the recipient input field
    const recipientUpiIdInput = document.getElementById('recipientUpiId');
    if (recipientUpiIdInput) {
      recipientUpiIdInput.value = decodeURIComponent(qrUpiId);
      recipientUpiIdInput.readOnly = true;
    }
  }
  
  // 3. Require authentication and load async data
  if (!(await requireAuth())) return;
  await Promise.all([
    loadUpiStatus(),
    loadLinkedBanks(),
    loadUpiTransactions()
  ]);
});

function showSetupStep(stepNumber) {
  const steps = document.querySelectorAll('.setup-step');
  steps.forEach(step => {
    if (parseInt(step.dataset.step) === stepNumber) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });
}

async function loadUpiStatus() {
  const profile = await getProfile();
  
  const noUpiAccount = document.getElementById('noUpiAccount');
  const upiAccountSection = document.getElementById('upiAccountSection');
  const upiIdDisplay = document.getElementById('upiIdDisplay');
  
  if (profile && profile.upi_id) {
    if (noUpiAccount) noUpiAccount.classList.add('hidden');
    if (upiAccountSection) upiAccountSection.classList.remove('hidden');
    if (upiIdDisplay) upiIdDisplay.textContent = profile.upi_id;
  } else {
    if (noUpiAccount) noUpiAccount.classList.remove('hidden');
    if (upiAccountSection) upiAccountSection.classList.add('hidden');
  }
}

async function loadLinkedBanks() {
  const user = await getUser();
  const { data: banks } = await supabaseClient
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id);
    
  const noBankAccounts = document.getElementById('noBankAccounts');
  const bankAccountsList = document.getElementById('bankAccountsList');
  
  if (banks && banks.length > 0) {
    if (noBankAccounts) noBankAccounts.classList.add('hidden');
    if (bankAccountsList) {
      bankAccountsList.classList.remove('hidden');
      
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
      bankAccountsList.innerHTML = banksHTML;
    }
  } else {
    if (noBankAccounts) noBankAccounts.classList.remove('hidden');
    if (bankAccountsList) bankAccountsList.classList.add('hidden');
  }
}

async function loadUpiTransactions() {
  const transactions = await getTransactions();
  const upiTransactionsList = document.getElementById('upiTransactionsList');
  if (!upiTransactionsList) return;
  
  const upiTxns = transactions.filter(tx => tx.description.includes('UPI') || tx.transaction_type === 'peer_to_peer');
  
  if (upiTxns.length === 0) {
    upiTransactionsList.innerHTML = `<div class="empty-transactions"><p>No UPI transactions yet</p></div>`;
    return;
  }
  
  let transactionsHTML = '';
  const user = await getUser();
  
  const recentTxns = upiTxns.slice(0, 5);
  
  recentTxns.forEach(tx => {
    let isCredit = false;
    if (tx.receiver_id === user.id) isCredit = true;
    
    const typeClass = isCredit ? 'credit' : 'debit';
    
    let otherPerson = null;
    if (tx.transaction_type === 'add_money') {
      otherPerson = user;
    } else if (isCredit) {
      otherPerson = tx.sender;
    } else {
      otherPerson = tx.receiver;
    }
    
    const avatarUrl = getAvatarUrl(otherPerson);
    
    transactionsHTML += `
      <div class="transaction-item">
        <div class="transaction-icon" style="overflow: hidden; display: flex; align-items: center; justify-content: center; background: none;">
          <img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
        </div>
        <div class="transaction-details">
          <div class="transaction-title">${tx.display_description || tx.description}</div>
          <div class="transaction-date">${formatDateTime(tx.created_at)}</div>
        </div>
        <div class="transaction-amount ${typeClass}">₹${formatCurrency(tx.amount)}</div>
      </div>
    `;
  });
  
  upiTransactionsList.innerHTML = transactionsHTML;
}

async function linkBankAccount(accountNumber, ifscCode, bankName) {
  if (!accountNumber || !ifscCode) {
    showNotification('Please fill in all fields', 'error');
    return false;
  }
  
  const user = await getUser();
  const { error } = await supabaseClient
    .from('bank_accounts')
    .insert([{
      user_id: user.id,
      bank_name: bankName || 'Bank',
      account_number: accountNumber,
      ifsc_code: ifscCode
    }]);
    
  if (error) {
    showNotification('Failed to link bank, account number might already be in use.', 'error');
    return false;
  } else {
    showNotification('Bank account linked successfully');
    await loadLinkedBanks();
    return true;
  }
}

async function handleLinkBank(e) {
  e.preventDefault();
  const accountNumber = document.getElementById('accountNumber').value.trim();
  const ifscCode = document.getElementById('ifscCode').value.trim().toUpperCase();
  
  const linked = await linkBankAccount(accountNumber, ifscCode, 'Bank');
  if (linked) {
    document.getElementById('linkBankModal').style.display = 'none';
    const linkBankForm = document.getElementById('linkBankForm');
    if (linkBankForm) linkBankForm.reset();
    
    const profile = await getProfile();
    if (!profile || !profile.upi_id) {
      showSetupStep(2);
      document.getElementById('setupUpiModal').style.display = 'block';
    }
  }
}

async function handleCreateUpi(e) {
  e.preventDefault();
  const upiPrefix = document.getElementById('upiPrefix').value.trim().toLowerCase();
  const setupUpiPin = document.getElementById('setupUpiPin').value;
  const confirmUpiPin = document.getElementById('confirmUpiPin').value;
  
  if (!upiPrefix || !setupUpiPin || !confirmUpiPin) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  if (setupUpiPin !== confirmUpiPin) {
    showNotification('UPI PINs do not match', 'error');
    return;
  }
  
  if (!/^[0-9]{4}$/.test(setupUpiPin)) {
    showNotification('UPI PIN must be exactly 4 digits', 'error');
    return;
  }
  
  const upiId = `${upiPrefix}@paymoney`;
  const user = await getUser();
  
  // Check if UPI ID already exists
  const { data: existingProfile } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('upi_id', upiId)
    .maybeSingle();
    
  if (existingProfile && existingProfile.id !== user.id) {
    showNotification('UPI ID already taken', 'error');
    return;
  }
  
  const hashedPin = await hashPassword(setupUpiPin);
  
  const { error } = await supabaseClient
    .from('profiles')
    .update({ 
      upi_id: upiId,
      upi_pin: hashedPin
    })
    .eq('id', user.id);
    
  if (error) {
    showNotification('Error creating UPI ID: ' + error.message, 'error');
  } else {
    clearProfileCache();
    showNotification('UPI ID created successfully');
    
    const newUpiId = document.getElementById('newUpiId');
    if (newUpiId) newUpiId.textContent = upiId;
    
    showSetupStep(3);
  }
}

async function handleSendUpi(e) {
  e.preventDefault();
  
  const recipientUpiId = document.getElementById('recipientUpiId').value.trim();
  const upiSendAmount = document.getElementById('upiSendAmount').value;
  const note = document.getElementById('upiSendNote').value.trim();
  
  if (!recipientUpiId) {
    showNotification('Please enter recipient info', 'error');
    return;
  }
  
  const amountNum = parseFloat(upiSendAmount);
  if (!upiSendAmount || isNaN(amountNum) || amountNum <= 0) {
    showNotification('Please enter a valid amount', 'error');
    return;
  }
  
  if (upiSendAmount.includes('.') && upiSendAmount.split('.')[1].length > 2) {
    showNotification('Amount can have at most 2 decimal places', 'error');
    return;
  }
  
  const currentBalance = await getWalletBalance();
  if (parseFloat(upiSendAmount) > currentBalance) {
    showNotification('Insufficient balance', 'error');
    return;
  }
  
  // Lookup receiver by UPI ID or Mobile Number
  let query = supabaseClient.from('profiles').select('id, wallet_balance, upi_id, phone');
  if (recipientUpiId.includes('@')) {
    if (recipientUpiId.endsWith('@paymoney')) {
      const phoneNum = recipientUpiId.split('@')[0];
      query = query.or(`upi_id.eq.${recipientUpiId},phone.eq.${phoneNum}`);
    } else {
      query = query.eq('upi_id', recipientUpiId);
    }
  } else {
    query = query.eq('phone', recipientUpiId);
  }
  
  const { data: receiverData, error: receiverError } = await query.maybeSingle();
    
  if (receiverError || !receiverData) {
    showNotification('user/account not found', 'error', 'top-center');
    return;
  }
  
  const user = await getUser();
  if (receiverData.id === user.id) {
    showNotification('Cannot send money to yourself', 'error');
    return;
  }
  
  requireUpiVerification(parseFloat(upiSendAmount), async () => {
    // Deduct sender balance
    const newSenderBalance = currentBalance - parseFloat(upiSendAmount);
    await updateWalletBalance(newSenderBalance);
    
    // Fetch receiver balance again to prevent race conditions
    const { data: receiverProfile } = await supabaseClient
      .from('profiles')
      .select('wallet_balance')
      .eq('id', receiverData.id)
      .single();
      
    // Credit receiver
    const newReceiverBalance = parseFloat(receiverProfile.wallet_balance) + parseFloat(upiSendAmount);
    await supabaseClient
      .from('profiles')
      .update({ wallet_balance: newReceiverBalance })
      .eq('id', receiverData.id);
    
    // Add transaction record
    const finalReceiverUpiId = receiverData.upi_id || recipientUpiId;
    await addTransaction(
      parseFloat(upiSendAmount), 
      'peer_to_peer', 
      `UPI Payment to ${finalReceiverUpiId}${note ? ` - ${note}` : ''}`,
      receiverData.id
    );
    
    // Reset and hide Send modal
    document.getElementById('sendUpiModal').style.display = 'none';
    const sendUpiForm = document.getElementById('sendUpiForm');
    if (sendUpiForm) sendUpiForm.reset();
    
    // Populate success receipt details
    const successUpiRecipient = document.getElementById('successUpiRecipient');
    const successUpiAmount = document.getElementById('successUpiAmount');
    const upiTxnId = document.getElementById('upiTransactionId');
    const upiTxnTime = document.getElementById('upiTransactionTime');
    
    const genTxnId = 'TXN' + Math.floor(Math.random() * 1000000000);
    const genTime = new Date().toLocaleString();
    
    if (successUpiRecipient) successUpiRecipient.textContent = finalReceiverUpiId;
    if (successUpiAmount) successUpiAmount.textContent = `₹${formatCurrency(upiSendAmount)}`;
    if (upiTxnId) upiTxnId.textContent = genTxnId;
    if (upiTxnTime) upiTxnTime.textContent = genTime;
    
    // Display success modal
    const upiSuccessModal = document.getElementById('upiSuccessModal');
    if (upiSuccessModal) upiSuccessModal.style.display = 'block';
    
    showNotification(`Payment of ₹${formatCurrency(upiSendAmount)} successful`);
    
    await loadUpiTransactions();
  });
}

// Deprecated: old custom PIN flow
async function handleConfirmPinPayment() {
  console.warn("handleConfirmPinPayment is deprecated. Use requireUpiVerification instead.");
}

async function downloadUpiReceipt() {
  const downloadBtn = document.getElementById('downloadUpiReceiptBtn');
  if (!downloadBtn) return;
  
  const originalText = downloadBtn.textContent;
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Generating...';
  
  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    
    const successActions = document.querySelector('#upiSuccessModalContent .success-actions');
    const modalContent = document.getElementById('upiSuccessModalContent');
    
    // Hide buttons temporarily so they don't appear in the image
    if (successActions) successActions.style.display = 'none';
    
    const originalBg = modalContent.style.background;
    const originalPadding = modalContent.style.padding;
    modalContent.style.background = '#ffffff';
    modalContent.style.padding = '30px';
    
    const canvas = await html2canvas(modalContent, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    if (successActions) successActions.style.display = 'flex';
    modalContent.style.background = originalBg;
    modalContent.style.padding = originalPadding;
    
    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `PayMoney_UPI_Receipt_${Date.now()}.png`;
    link.href = imgData;
    link.click();
    
    showNotification('Receipt downloaded successfully!');
  } catch (error) {
    console.error('Error generating receipt image:', error);
    showNotification('Failed to generate receipt image.', 'error');
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = originalText;
  }
}