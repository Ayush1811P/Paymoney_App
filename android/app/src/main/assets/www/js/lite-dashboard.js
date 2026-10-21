/**
 * PayMoney Lite Account Dashboard Functionality
 * Reuses existing PayMoney core payment, balance, and transaction infrastructure.
 */

let isBalanceVisible = false;
let currentWalletBalance = 0;

document.addEventListener('DOMContentLoaded', async function() {
  // 1. Require Lite authentication (redirects normal users to dashboard.html)
  if (!(await requireAuth('lite'))) return;

  const scanQrBtn = document.getElementById('scanQrBtn');
  if (scanQrBtn) {
    scanQrBtn.addEventListener('click', handleScanQr);
  }
  
  // 2. Load Lite account profile & parent details
  await loadLiteAccountDetails();
  
  // 3. Load wallet data and transactions in parallel
  await Promise.all([
    loadWalletData(),
    loadTransactions()
  ]);
  
  // 4. Initialize Send Money modal (P2P payment)
  initSendMoneyModal();
  
  // 5. Initialize eye toggle for wallet balance
  const toggleBalanceBtn = document.getElementById('toggleBalanceBtn');
  if (toggleBalanceBtn) {
    toggleBalanceBtn.addEventListener('click', () => {
      isBalanceVisible = !isBalanceVisible;
      updateBalanceUI();
    });
  }
});

// Load Lite account metadata and parent link
async function loadLiteAccountDetails() {
  const profile = await getProfile();
  if (!profile) return;
  
  const upiDisplay = document.getElementById('liteUpiDisplay');
  if (upiDisplay) {
    upiDisplay.textContent = profile.upi_id || `${profile.phone}@paymoneylite`;
  }
  
  // Removed fetching parent info to respect privacy rules
}

// Load wallet data
async function loadWalletData() {
  const walletBalanceElement = document.getElementById('walletBalance');
  const lastUpdatedElement = document.getElementById('lastUpdated');
  
  if (walletBalanceElement) {
    const profile = await getProfile();
    if (profile) {
      currentWalletBalance = profile.wallet_balance;
      updateBalanceUI();
      if (lastUpdatedElement) {
        lastUpdatedElement.textContent = 'Live Data';
      }
    }
  }
}

// Update the balance text and eye icon state
function updateBalanceUI() {
  const walletBalanceElement = document.getElementById('walletBalance');
  const toggleBtn = document.getElementById('toggleBalanceBtn');
  if (!walletBalanceElement) return;
  
  if (isBalanceVisible) {
    walletBalanceElement.textContent = formatCurrency(currentWalletBalance);
    if (toggleBtn) {
      const openEye = toggleBtn.querySelector('.eye-open');
      const closedEye = toggleBtn.querySelector('.eye-closed');
      if (openEye) openEye.style.display = 'block';
      if (closedEye) closedEye.style.display = 'none';
    }
  } else {
    walletBalanceElement.textContent = '***';
    if (toggleBtn) {
      const openEye = toggleBtn.querySelector('.eye-open');
      const closedEye = toggleBtn.querySelector('.eye-closed');
      if (openEye) openEye.style.display = 'none';
      if (closedEye) closedEye.style.display = 'block';
    }
  }
}

// Load recent transactions for the Lite user
async function loadTransactions() {
  const transactionsList = document.getElementById('transactionsList');
  if (!transactionsList) return;
  
  const transactions = await getTransactions();
  const user = await getUser();
  
  if (!transactions || transactions.length === 0) {
    transactionsList.innerHTML = `
      <div class="empty-transactions">
        <p>No transactions yet</p>
      </div>
    `;
    return;
  }
  
  let transactionsHTML = '';
  const recentTransactions = transactions.slice(0, 5);
  
  recentTransactions.forEach(transaction => {
    const isCredit = transaction.receiver_id === user.id;
    
    const typeClass = isCredit ? 'credit' : 'debit';
    
    const otherPerson = isCredit ? transaction.sender : transaction.receiver;
    
    const avatarUrl = getAvatarUrl(otherPerson);
    
    transactionsHTML += `
      <div class="transaction-item">
        <div class="transaction-icon" style="overflow: hidden; display: flex; align-items: center; justify-content: center; background: none;">
          <img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
        </div>
        <div class="transaction-details">
          <div class="transaction-title">${transaction.display_description || transaction.description}</div>
          <div class="transaction-date">${formatDateTime(transaction.created_at)}</div>
        </div>
        <div class="transaction-amount ${typeClass}">
          ₹${formatCurrency(transaction.amount)}
        </div>
      </div>
    `;
  });
  
  transactionsList.innerHTML = transactionsHTML;
}

// Initialize Send Money modal (Lite P2P)
function initSendMoneyModal() {
  const sendMoneyBtn = document.getElementById('sendMoneyBtn');
  const sendMoneyModal = document.getElementById('sendMoneyModal');
  const sendMoneyForm = document.getElementById('sendMoneyForm');
  const closeModalBtn = sendMoneyModal ? sendMoneyModal.querySelector('.close-modal') : null;
  
  if (sendMoneyBtn && sendMoneyModal && sendMoneyForm) {
    sendMoneyBtn.addEventListener('click', function() {
      sendMoneyModal.style.display = 'block';
    });
    
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', function() {
        sendMoneyModal.style.display = 'none';
      });
    }

    window.addEventListener('click', function(e) {
      if (e.target === sendMoneyModal) {
        sendMoneyModal.style.display = 'none';
      }
    });
    
    sendMoneyForm.addEventListener('submit', handleLiteSendMoney);
  }
}

// Handle Send Money form submission for Lite Account
async function handleLiteSendMoney(e) {
  e.preventDefault();
  
  const recipientInput = document.getElementById('recipientMobile').value.trim();
  const sendAmount = document.getElementById('sendAmount').value;
  const sendNote = document.getElementById('sendNote').value.trim();
  
  if (!recipientInput) {
    showNotification('Please enter recipient mobile number or UPI ID', 'error');
    return;
  }
  
  const amountNum = parseFloat(sendAmount);
  if (!sendAmount || isNaN(amountNum) || amountNum <= 0) {
    showNotification('Please enter a valid amount', 'error');
    return;
  }
  
  if (sendAmount.includes('.') && sendAmount.split('.')[1].length > 2) {
    showNotification('Amount can have at most 2 decimal places', 'error');
    return;
  }
  
  const currentBalance = await getWalletBalance();
  if (amountNum > currentBalance) {
    showNotification('Insufficient balance in Lite wallet', 'error');
    return;
  }
  
  // Resolve recipient: supports mobile number, @paymoney, and @paymoneylite
  let query = supabaseClient.from('profiles').select('id, wallet_balance, upi_id, phone, full_name');
  if (recipientInput.includes('@')) {
    if (recipientInput.endsWith('@paymoney') || recipientInput.endsWith('@paymoneylite')) {
      const phoneNum = recipientInput.split('@')[0];
      query = query.or(`upi_id.eq.${recipientInput},phone.eq.${phoneNum}`);
    } else {
      query = query.eq('upi_id', recipientInput);
    }
  } else {
    query = query.eq('phone', recipientInput);
  }
  
  const { data: receiverData, error: receiverError } = await query.maybeSingle();
    
  if (receiverError || !receiverData) {
    showNotification('Recipient user/account not found', 'error', 'top-center');
    return;
  }
  
  const user = await getUser();
  if (receiverData.id === user.id) {
    showNotification('Cannot send money to yourself', 'error');
    return;
  }
  
  // Debit Lite sender and Credit receiver within UPI verification
  requireUpiVerification(amountNum, async () => {
    const newSenderBalance = currentBalance - amountNum;
    await updateWalletBalance(newSenderBalance);
    
    const newReceiverBalance = parseFloat(receiverData.wallet_balance) + amountNum;
    await supabaseClient
      .from('profiles')
      .update({ wallet_balance: newReceiverBalance })
      .eq('id', receiverData.id);
    
    // Add transaction record
    await addTransaction(
      amountNum, 
      'peer_to_peer', 
      `Sent to ${recipientInput}${sendNote ? ` - ${sendNote}` : ''}`,
      receiverData.id
    );
    
    // Close modal & reset
    const sendMoneyModal = document.getElementById('sendMoneyModal');
    if (sendMoneyModal) sendMoneyModal.style.display = 'none';
    
    const sendMoneyForm = document.getElementById('sendMoneyForm');
    if (sendMoneyForm) sendMoneyForm.reset();
    
    showNotification(`Sent ₹${formatCurrency(amountNum)} successfully`);
    
    // Reload UI
    await loadWalletData();
    await loadTransactions();
  });
}
