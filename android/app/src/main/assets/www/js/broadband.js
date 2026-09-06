/**
 * Broadband Bill Payment functionality for the PayMoney application
 */

const BROADBAND_PLANS = {
  airtel: {
    monthly: [
      { amount: 499, validity: '30 days', data: '40 Mbps', description: 'Unlimited Internet, Free landline calls' },
      { amount: 799, validity: '30 days', data: '100 Mbps', description: 'Unlimited Internet, Airtel Thanks benefits' },
      { amount: 999, validity: '30 days', data: '200 Mbps', description: 'Entertainment Pack (Disney+ Hotstar & Prime)' }
    ],
    quarterly: [
      { amount: 1497, validity: '90 days', data: '40 Mbps', description: 'Standard Quarterly Pack' },
      { amount: 2397, validity: '90 days', data: '100 Mbps', description: 'High-speed Quarterly Pack' }
    ],
    halfyearly: [
      { amount: 2994, validity: '180 days', data: '40 Mbps', description: '6 Months Unlimited High Speed Pack' },
      { amount: 4794, validity: '180 days', data: '100 Mbps', description: '6 Months Premium Broadband Pack' }
    ],
    annual: [
      { amount: 5988, validity: '365 days', data: '40 Mbps', description: 'Save 10% on Yearly Subscription' },
      { amount: 9588, validity: '365 days', data: '100 Mbps', description: 'Save 10% on Premium Yearly Pack' }
    ]
  },
  jio: {
    monthly: [
      { amount: 399, validity: '30 days', data: '30 Mbps', description: 'Unlimited Data & Voice Calls' },
      { amount: 699, validity: '30 days', data: '100 Mbps', description: 'Unlimited Data & Voice' },
      { amount: 999, validity: '30 days', data: '150 Mbps', description: 'Unlimited Internet + 15+ OTT Apps subscription' }
    ],
    quarterly: [
      { amount: 1197, validity: '90 days', data: '30 Mbps', description: 'Quarterly saver Pack' },
      { amount: 2097, validity: '90 days', data: '100 Mbps', description: 'Quarterly High-speed Pack' }
    ],
    halfyearly: [
      { amount: 2394, validity: '180 days', data: '30 Mbps', description: '6 Months Plan' },
      { amount: 4194, validity: '180 days', data: '100 Mbps', description: '6 Months High Speed Plan' }
    ],
    annual: [
      { amount: 4788, validity: '365 days', data: '30 Mbps', description: '1 Year Plan (Save ₹500)' },
      { amount: 8388, validity: '365 days', data: '100 Mbps', description: '1 Year High-Speed Plan (Save ₹1000)' }
    ]
  },
  act: {
    monthly: [
      { amount: 549, validity: '30 days', data: '40 Mbps', description: 'ACT Basic - Unlimited Data FUP' },
      { amount: 685, validity: '30 days', data: '75 Mbps', description: 'ACT Swift - Best for Work from Home' },
      { amount: 825, validity: '30 days', data: '100 Mbps', description: 'ACT Rapid Plus - Streaming Optimized' }
    ],
    quarterly: [
      { amount: 1647, validity: '90 days', data: '40 Mbps', description: '3 Months Basic Pack' },
      { amount: 2055, validity: '90 days', data: '75 Mbps', description: '3 Months Swift Pack' }
    ],
    halfyearly: [
      { amount: 3294, validity: '180 days', data: '40 Mbps', description: '6 Months Basic Pack (Free Installation)' },
      { amount: 4110, validity: '180 days', data: '75 Mbps', description: '6 Months Swift Pack (Free Installation)' }
    ],
    annual: [
      { amount: 6588, validity: '365 days', data: '40 Mbps', description: '1 Year Basic (Save 1 Month charge)' },
      { amount: 8220, validity: '365 days', data: '75 Mbps', description: '1 Year Swift (Save 1 Month charge)' }
    ]
  },
  bsnl: {
    monthly: [
      { amount: 329, validity: '30 days', data: '20 Mbps', description: 'BSNL Fibre Basic Neo - 1000GB FUP' },
      { amount: 449, validity: '30 days', data: '30 Mbps', description: 'BSNL Fibre Basic - 3300GB FUP' },
      { amount: 599, validity: '30 days', data: '60 Mbps', description: 'BSNL Fibre Basic Plus' }
    ],
    quarterly: [
      { amount: 987, validity: '90 days', data: '20 Mbps', description: '3 Months Basic Neo Pack' }
    ],
    halfyearly: [
      { amount: 1974, validity: '180 days', data: '20 Mbps', description: '6 Months Basic Neo Pack' }
    ],
    annual: [
      { amount: 3948, validity: '365 days', data: '20 Mbps', description: '1 Year Basic Neo Pack (Save ₹350)' }
    ]
  },
  tataplay: {
    monthly: [
      { amount: 550, validity: '30 days', data: '50 Mbps', description: 'Unlimited Data, High Speed Fiber' },
      { amount: 750, validity: '30 days', data: '100 Mbps', description: 'Unlimited Data, Best for Multi-device streaming' }
    ],
    quarterly: [
      { amount: 1650, validity: '90 days', data: '50 Mbps', description: '3 Months Fiber subscription' }
    ],
    halfyearly: [
      { amount: 3300, validity: '180 days', data: '50 Mbps', description: '6 Months Fiber subscription' }
    ],
    annual: [
      { amount: 6600, validity: '365 days', data: '50 Mbps', description: '1 Year Fiber subscription (Save 10%)' }
    ]
  },
  hathway: {
    monthly: [
      { amount: 499, validity: '30 days', data: '50 Mbps', description: 'Unlimited Data, Free Wi-Fi Router' },
      { amount: 649, validity: '30 days', data: '100 Mbps', description: 'Unlimited Data, Premium Router' }
    ],
    quarterly: [
      { amount: 1497, validity: '90 days', data: '50 Mbps', description: '3 Months Unlimited Internet' }
    ],
    halfyearly: [
      { amount: 2994, validity: '180 days', data: '50 Mbps', description: '6 Months Unlimited Internet' }
    ],
    annual: [
      { amount: 5988, validity: '365 days', data: '50 Mbps', description: '1 Year Unlimited Internet (Save ₹500)' }
    ]
  }
};

let currentBroadband = { accountId: '', operator: '', operatorName: '', plan: null };

document.addEventListener('DOMContentLoaded', async function() {
  if (!(await requireAuth())) return;
  
  const viewPlansBtn = document.getElementById('viewPlansBtn');
  if (viewPlansBtn) viewPlansBtn.addEventListener('click', handleViewPlans);
  
  const confirmRechargeBtn = document.getElementById('confirmRechargeBtn');
  if (confirmRechargeBtn) confirmRechargeBtn.addEventListener('click', handleConfirmRecharge);
  
  const cancelRechargeBtn = document.getElementById('cancelRechargeBtn');
  if (cancelRechargeBtn) {
    cancelRechargeBtn.addEventListener('click', () => {
      document.getElementById('rechargeConfirmation').classList.add('hidden');
      document.getElementById('plansContainer').classList.remove('hidden');
    });
  }

  const closeSuccessBtn = document.getElementById('closeSuccessBtn');
  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', () => {
      document.getElementById('rechargeSuccessModal').style.display = 'none';
      resetRechargeForm();
    });
  }

  const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
  if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', downloadReceipt);
  }

  // Initialize plans category tabs click listeners
  const planTabs = document.querySelectorAll('.plan-tab');
  planTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      planTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (currentBroadband.operator) {
        showPlans(currentBroadband.operator, tab.dataset.category);
      }
    });
  });
});

function handleViewPlans(e) {
  e.preventDefault();
  const accountId = document.getElementById('accountId').value.trim();
  const operatorSelect = document.getElementById('broadbandOperator');
  const operator = operatorSelect.value;
  const operatorName = operatorSelect.options[operatorSelect.selectedIndex].text;
  
  if (!accountId || accountId.length < 5 || accountId.length > 20) {
    showNotification('Please enter a valid Account ID/User ID (5-20 characters)', 'error');
    return;
  }
  
  if (!operator) {
    showNotification('Please select a broadband provider', 'error');
    return;
  }
  
  currentBroadband.accountId = accountId;
  currentBroadband.operator = operator;
  currentBroadband.operatorName = operatorName;
  
  // Reset active tab to 'monthly'
  const planTabs = document.querySelectorAll('.plan-tab');
  planTabs.forEach(t => t.classList.remove('active'));
  const monthlyTab = document.querySelector('.plan-tab[data-category="monthly"]');
  if (monthlyTab) monthlyTab.classList.add('active');
  
  document.getElementById('plansContainer').classList.remove('hidden');
  showPlans(operator, 'monthly');
}

function showPlans(operator, category) {
  const plansList = document.getElementById('plansList');
  if (!plansList) return;
  
  const plans = BROADBAND_PLANS[operator]?.[category] || [];
  let plansHTML = '';
  
  if (plans.length === 0) {
    plansList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: var(--spacing-lg);">No plans available in this category.</div>`;
    return;
  }
  
  plans.forEach(plan => {
    plansHTML += `
      <div class="plan-card" data-amount="${plan.amount}" data-validity="${plan.validity}" data-data="${plan.data}">
        <div class="plan-amount">₹${plan.amount}</div>
        <div class="plan-validity">Validity: ${plan.validity}</div>
        <div class="plan-details">
          <div><span class="plan-tag" style="background-color: var(--primary-light); color: var(--primary-color);">${plan.data}</span></div>
          <div style="margin-top: var(--spacing-xs);">${plan.description}</div>
        </div>
      </div>
    `;
  });
  
  plansList.innerHTML = plansHTML;
  
  const planCards = document.querySelectorAll('.plan-card');
  planCards.forEach(card => {
    card.addEventListener('click', () => {
      planCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      
      currentBroadband.plan = {
        amount: card.dataset.amount,
        validity: card.dataset.validity,
        data: card.dataset.data
      };
      
      showRechargeConfirmation();
    });
  });
}

function showRechargeConfirmation() {
  const confirmAccountId = document.getElementById('confirmAccountId');
  const confirmOperator = document.getElementById('confirmOperator');
  const confirmPlan = document.getElementById('confirmPlan');
  const confirmAmount = document.getElementById('confirmAmount');
  
  if (confirmAccountId) confirmAccountId.textContent = currentBroadband.accountId;
  if (confirmOperator) confirmOperator.textContent = currentBroadband.operatorName;
  if (confirmPlan) confirmPlan.textContent = `${currentBroadband.plan.data} Speed (${currentBroadband.plan.validity})`;
  if (confirmAmount) confirmAmount.textContent = `₹${currentBroadband.plan.amount}`;
  
  document.getElementById('plansContainer').classList.add('hidden');
  document.getElementById('rechargeConfirmation').classList.remove('hidden');
}

async function handleConfirmRecharge() {
  const confirmBtn = document.getElementById('confirmRechargeBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Processing...';

  try {
    const currentBalance = await getWalletBalance();
    const rechargeAmount = parseFloat(currentBroadband.plan.amount);
    
    if (rechargeAmount > currentBalance) {
      showNotification('Insufficient balance.', 'error');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm & Pay';
      return;
    }
    
    requireUpiVerification(rechargeAmount, async () => {
      const newBalance = currentBalance - rechargeAmount;
      await updateWalletBalance(newBalance);
      
      await addTransaction(
        rechargeAmount,
        'recharge',
        `Broadband Bill - Account: ${currentBroadband.accountId} (${currentBroadband.operatorName})`
      );
      
      document.getElementById('rechargeConfirmation').classList.add('hidden');
      
      const successAccountId = document.getElementById('successAccountId');
      const successOperator = document.getElementById('successOperator');
      const successAmount = document.getElementById('successAmount');
      const transactionId = document.getElementById('transactionId');
      const transactionTime = document.getElementById('transactionTime');
      
      const genTxnId = 'TXN' + Math.floor(Math.random() * 1000000000);
      const genTime = new Date().toLocaleString();
      
      if (successAccountId) successAccountId.textContent = currentBroadband.accountId;
      if (successOperator) successOperator.textContent = currentBroadband.operatorName;
      if (successAmount) successAmount.textContent = `₹${rechargeAmount}`;
      if (transactionId) transactionId.textContent = genTxnId;
      if (transactionTime) transactionTime.textContent = genTime;
      
      document.getElementById('rechargeSuccessModal').style.display = 'block';
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm & Pay';
    });
  } catch (error) {
    console.error('Error confirming broadband bill payment:', error);
    showNotification('An error occurred. Please try again.', 'error');
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm & Pay';
  }
}

function resetRechargeForm() {
  document.getElementById('accountId').value = '';
  document.getElementById('broadbandOperator').value = '';
  document.getElementById('plansContainer').classList.add('hidden');
  document.getElementById('rechargeConfirmation').classList.add('hidden');
  currentBroadband = { accountId: '', operator: '', operatorName: '', plan: null };
}

async function downloadReceipt() {
  const downloadBtn = document.getElementById('downloadReceiptBtn');
  if (!downloadBtn) return;
  
  const originalText = downloadBtn.textContent;
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Generating...';
  
  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    
    const successActions = document.querySelector('.success-actions');
    const modalContent = document.querySelector('.success-modal');
    
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
    link.download = `PayMoney_Broadband_Receipt_${Date.now()}.png`;
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
