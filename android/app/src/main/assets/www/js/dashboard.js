/**
 * Dashboard functionality for the PayMoney application (Supabase Integrated)
 */

let isBalanceVisible = false;
let currentWalletBalance = 0;

document.addEventListener('DOMContentLoaded', async function() {
  // Require authentication
  if (!(await requireAuth())) return;
  
  // Load wallet data and transactions in parallel
  await Promise.all([
    loadWalletData(),
    loadTransactions()
  ]);
  
  // Initialize modals
  initAddMoneyModal();
  initSendMoneyModal();
  
  // Initialize eye toggle for wallet balance
  const toggleBalanceBtn = document.getElementById('toggleBalanceBtn');
  if (toggleBalanceBtn) {
    toggleBalanceBtn.addEventListener('click', () => {
      isBalanceVisible = !isBalanceVisible;
      updateBalanceUI();
    });
  }
});

// Load wallet data
async function loadWalletData() {
  const walletBalanceElement = document.getElementById('walletBalance');
  const lastUpdatedElement = document.getElementById('lastUpdated');
  
  if (walletBalanceElement) {
    const profile = await getProfile();
    if (profile) {
      currentWalletBalance = profile.wallet_balance;
      
      // Update UI based on visibility state
      updateBalanceUI();
      
      if (lastUpdatedElement && profile.created_at) {
        lastUpdatedElement.textContent = 'Live Data'; // Or format latest txn
      }
    }
  }
}

// Update the balance text and eye icon state based on isBalanceVisible
function updateBalanceUI() {
  const walletBalanceElement = document.getElementById('walletBalance');
  const toggleBtn = document.getElementById('toggleBalanceBtn');
  if (!walletBalanceElement) return;
  
  if (isBalanceVisible) {
    walletBalanceElement.textContent = formatCurrency(currentWalletBalance);
    if (toggleBtn) {
      toggleBtn.querySelector('.eye-open').style.display = 'block';
      toggleBtn.querySelector('.eye-closed').style.display = 'none';
    }
  } else {
    walletBalanceElement.textContent = '***';
    if (toggleBtn) {
      toggleBtn.querySelector('.eye-open').style.display = 'none';
      toggleBtn.querySelector('.eye-closed').style.display = 'block';
    }
  }
}

// Load transactions
async function loadTransactions() {
  const transactionsList = document.getElementById('transactionsList');
  
  if (transactionsList) {
    const transactions = await getTransactions();
    const user = await getUser();
    
    if (transactions.length === 0) {
      transactionsList.innerHTML = `
        <div class="empty-transactions">
          <p>No transactions yet</p>
        </div>
      `;
      return;
    }
    
    let transactionsHTML = '';
    const recentTransactions = transactions.slice(0, 5); // Show latest 5
    
    recentTransactions.forEach(transaction => {
      // If user is sender, it's a debit. If user is receiver, it's a credit.
      let isCredit = false;
      if (transaction.transaction_type === 'add_money') {
        isCredit = true;
      } else if (transaction.receiver_id === user.id) {
        isCredit = true;
      }
      
      const typeClass = isCredit ? 'credit' : 'debit';
      
      let otherPerson = null;
      if (transaction.transaction_type === 'add_money') {
        otherPerson = user;
      } else if (isCredit) {
        otherPerson = transaction.sender;
      } else {
        otherPerson = transaction.receiver;
      }
      
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
}

// Get add money cooldown status
function getAddMoneyCooldown() {
  const userId = localStorage.getItem('paymoney_user_id');
  const storageKey = userId ? `lastAddMoneyTime_${userId}` : 'lastAddMoneyTime';
  const lastAddMoneyTime = localStorage.getItem(storageKey);
  
  if (!lastAddMoneyTime) {
    return { isLocked: false };
  }
  
  const lastTime = parseInt(lastAddMoneyTime, 10);
  const now = Date.now();
  const timePassed = now - lastTime;
  const cooldownDuration = 60 * 60 * 1000; // 1 hour in ms
  
  if (timePassed < cooldownDuration) {
    const timeLeft = cooldownDuration - timePassed;
    const minutesLeft = Math.floor(timeLeft / (60 * 1000));
    const secondsLeft = Math.floor((timeLeft % (60 * 1000)) / 1000);
    
    let remainingMessage = '';
    if (minutesLeft > 0) {
      remainingMessage = `${minutesLeft}m ${secondsLeft}s`;
    } else {
      remainingMessage = `${secondsLeft}s`;
    }
    
    return {
      isLocked: true,
      remainingMessage: remainingMessage
    };
  }
  
  return { isLocked: false };
}

// Initialize Add Money modal
function initAddMoneyModal() {
  const addMoneyBtn = document.getElementById('addMoneyBtn');
  const addMoneyModal = document.getElementById('addMoneyModal');
  const addMoneyForm = document.getElementById('addMoneyForm');
  
  if (addMoneyBtn && addMoneyModal && addMoneyForm) {
    addMoneyBtn.addEventListener('click', function() {
      const cooldownInfo = getAddMoneyCooldown();
      if (cooldownInfo.isLocked) {
        showNotification(`You can only add money once per hour. Please try again in ${cooldownInfo.remainingMessage}.`, 'error');
        return;
      }
      addMoneyModal.style.display = 'block';
    });
    
    // Allow clicking the entire option box container to select the radio
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
      option.addEventListener('click', function(e) {
        if (e.target.tagName === 'INPUT') return;
        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
        }
      });
    });
    
    addMoneyForm.addEventListener('submit', handleAddMoney);
  }
}

// Handle Add Money form submission
async function handleAddMoney(e) {
  e.preventDefault();
  
  const cooldownInfo = getAddMoneyCooldown();
  if (cooldownInfo.isLocked) {
    showNotification(`You can only add money once per hour. Please try again in ${cooldownInfo.remainingMessage}.`, 'error');
    return;
  }
  
  const addAmount = document.getElementById('addAmount').value;
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  
  const amountNum = parseFloat(addAmount);
  if (!addAmount || isNaN(amountNum) || amountNum <= 0) {
    showNotification('Please enter a valid amount', 'error');
    return;
  }
  
  if (addAmount.includes('.') && addAmount.split('.')[1].length > 2) {
    showNotification('Amount can have at most 2 decimal places', 'error');
    return;
  }
  
  // Get current wallet balance
  const currentBalance = await getWalletBalance();
  const newBalance = currentBalance + parseFloat(addAmount);
  
  // Update wallet balance
  await updateWalletBalance(newBalance);
  
  // Add transaction
  await addTransaction(
    parseFloat(addAmount), 
    'add_money', 
    `Added money via ${getPaymentMethodName(paymentMethod)}`
  );
  
  // Set cooldown
  const userId = localStorage.getItem('paymoney_user_id');
  const storageKey = userId ? `lastAddMoneyTime_${userId}` : 'lastAddMoneyTime';
  localStorage.setItem(storageKey, Date.now().toString());
  
  // Close modal
  const addMoneyModal = document.getElementById('addMoneyModal');
  addMoneyModal.style.display = 'none';
  
  // Reset form
  const addMoneyForm = document.getElementById('addMoneyForm');
  if (addMoneyForm) addMoneyForm.reset();
  
  showNotification(`Added ₹${formatCurrency(addAmount)} successfully`);
  
  // Reload UI
  await loadWalletData();
  await loadTransactions();
}

function getPaymentMethodName(method) {
  switch (method) {
    case 'upi': return 'UPI';
    case 'card': return 'Card';
    case 'netbanking': return 'Net Banking';
    default: return method;
  }
}

// Initialize Send Money modal
function initSendMoneyModal() {
  const sendMoneyBtn = document.getElementById('sendMoneyBtn');
  const sendMoneyModal = document.getElementById('sendMoneyModal');
  const sendMoneyForm = document.getElementById('sendMoneyForm');
  
  if (sendMoneyBtn && sendMoneyModal && sendMoneyForm) {
    sendMoneyBtn.addEventListener('click', function() {
      sendMoneyModal.style.display = 'block';
    });
    
    sendMoneyForm.addEventListener('submit', handleSendMoney);
  }
}

// Handle Send Money form submission
async function handleSendMoney(e) {
  e.preventDefault();
  
  const recipientMobile = document.getElementById('recipientMobile').value.trim();
  const sendAmount = document.getElementById('sendAmount').value;
  const sendNote = document.getElementById('sendNote').value.trim();
  
  if (!recipientMobile) {
    showNotification('Please enter recipient mobile number', 'error');
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
  if (parseFloat(sendAmount) > currentBalance) {
    showNotification('Insufficient balance', 'error');
    return;
  }
  
  // Lookup receiver by phone or UPI ID
  let query = supabaseClient.from('profiles').select('id, wallet_balance, upi_id, phone');
  if (recipientMobile.includes('@')) {
    if (recipientMobile.endsWith('@paymoney')) {
      const phoneNum = recipientMobile.split('@')[0];
      query = query.or(`upi_id.eq.${recipientMobile},phone.eq.${phoneNum}`);
    } else {
      query = query.eq('upi_id', recipientMobile);
    }
  } else {
    query = query.eq('phone', recipientMobile);
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
  
  // Debit sender and Credit receiver within UPI verification
  requireUpiVerification(parseFloat(sendAmount), async () => {
    const newSenderBalance = currentBalance - parseFloat(sendAmount);
    await updateWalletBalance(newSenderBalance);
    
    const newReceiverBalance = parseFloat(receiverData.wallet_balance) + parseFloat(sendAmount);
    await supabaseClient
      .from('profiles')
      .update({ wallet_balance: newReceiverBalance })
      .eq('id', receiverData.id);
    
    // Add transaction record
    await addTransaction(
      parseFloat(sendAmount), 
      'peer_to_peer', 
      `Sent to ${recipientMobile}${sendNote ? ` - ${sendNote}` : ''}`,
      receiverData.id
    );
    
    // Close modal
    const sendMoneyModal = document.getElementById('sendMoneyModal');
    if (sendMoneyModal) sendMoneyModal.style.display = 'none';
    
    // Reset form
    const sendMoneyForm = document.getElementById('sendMoneyForm');
    if (sendMoneyForm) sendMoneyForm.reset();
    
    showNotification(`Sent ₹${formatCurrency(sendAmount)} successfully`);
    
    // Reload UI
    await loadWalletData();
    await loadTransactions();
  });
}