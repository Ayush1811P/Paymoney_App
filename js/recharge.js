/**
 * Mobile Recharge functionality for the PayMoney application (Supabase Integrated)
 */

const RECHARGE_PLANS = {
  jio: {
    popular: [
      { amount: 239, validity: '28 days', data: '1.5GB/day', description: 'Unlimited calls & 100 SMS/day' },
      { amount: 299, validity: '28 days', data: '2GB/day', description: 'Unlimited calls & 100 SMS/day' },
      { amount: 666, validity: '84 days', data: '1.5GB/day', description: 'Unlimited calls & 100 SMS/day' }
    ],
    data: [
      { amount: 15, validity: 'Active Plan', data: '1GB', description: '4G Data Add-on Pack' },
      { amount: 25, validity: 'Active Plan', data: '2GB', description: '4G Data Add-on Pack' },
      { amount: 61, validity: 'Active Plan', data: '6GB', description: '4G Data Add-on Pack' },
      { amount: 121, validity: 'Active Plan', data: '12GB', description: '4G Data Add-on Pack' },
      { amount: 222, validity: '30 days', data: '50GB', description: 'High-speed Data Pack (No voice)' },
      { amount: 444, validity: '60 days', data: '100GB', description: 'High-speed Data Pack (No voice)' }
    ],
    talktime: [
      { amount: 10, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹7.47' },
      { amount: 20, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹14.95' },
      { amount: 50, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹39.37' },
      { amount: 100, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹81.75' }
    ],
    unlimited: [
      { amount: 749, validity: '90 days', data: '2GB/day', description: 'Unlimited voice calls, 100 SMS/day' },
      { amount: 2999, validity: '365 days', data: '2.5GB/day', description: 'Yearly Plan, Unlimited calls & SMS' }
    ]
  },
  airtel: {
    popular: [
      { amount: 299, validity: '28 days', data: '1.5GB/day', description: 'Unlimited calls & 100 SMS/day' },
      { amount: 359, validity: '28 days', data: '2GB/day', description: 'Unlimited calls & 100 SMS/day' },
      { amount: 719, validity: '84 days', data: '1.5GB/day', description: 'Unlimited calls & 100 SMS/day' }
    ],
    data: [
      { amount: 19, validity: '1 day', data: '1GB', description: 'High-speed Data Booster' },
      { amount: 58, validity: 'Active Plan', data: '3GB', description: 'Data Add-on Pack' },
      { amount: 98, validity: 'Active Plan', data: '5GB', description: 'Data Add-on Pack' },
      { amount: 148, validity: 'Active Plan', data: '15GB', description: 'Data Pack with Wynk Music access' },
      { amount: 301, validity: 'Active Plan', data: '50GB', description: 'Bulk Data Pack (No voice)' }
    ],
    talktime: [
      { amount: 10, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹7.47' },
      { amount: 20, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹14.95' },
      { amount: 50, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹39.37' },
      { amount: 100, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹81.75' }
    ],
    unlimited: [
      { amount: 839, validity: '84 days', data: '2GB/day', description: 'Unlimited voice calls, 100 SMS/day' },
      { amount: 2999, validity: '365 days', data: '2GB/day', description: 'Yearly Plan, Unlimited calls & SMS' }
    ]
  },
  vi: {
    popular: [
      { amount: 249, validity: '28 days', data: '1.5GB/day', description: 'Unlimited calls & Binge All Night' },
      { amount: 299, validity: '28 days', data: '1.5GB/day', description: 'Weekend Data Rollover & Free Night Data' },
      { amount: 479, validity: '56 days', data: '1.5GB/day', description: 'Unlimited voice calls & Binge All Night' }
    ],
    data: [
      { amount: 19, validity: '1 day', data: '1GB', description: 'Data Add-on Booster' },
      { amount: 39, validity: '7 days', data: '3GB', description: 'Short-term Data Pack' },
      { amount: 82, validity: '14 days', data: '4GB', description: 'Data Add-on Pack' },
      { amount: 118, validity: '28 days', data: '12GB', description: 'Data Add-on Pack' },
      { amount: 298, validity: '28 days', data: '50GB', description: 'Bulk Data Pack (No voice)' }
    ],
    talktime: [
      { amount: 10, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹7.47' },
      { amount: 20, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹14.95' },
      { amount: 50, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹39.37' },
      { amount: 100, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹81.75' }
    ],
    unlimited: [
      { amount: 839, validity: '84 days', data: '2GB/day', description: 'Unlimited voice calls & Binge All Night' },
      { amount: 2899, validity: '365 days', data: '1.5GB/day', description: 'Yearly Plan, Unlimited calls' }
    ]
  },
  bsnl: {
    popular: [
      { amount: 187, validity: '28 days', data: '2GB/day', description: 'Unlimited voice calls & 100 SMS/day' },
      { amount: 397, validity: '150 days', data: '2GB/day for 30 days', description: 'Unlimited voice for first 30 days' }
    ],
    data: [
      { amount: 16, validity: '1 day', data: '2GB', description: 'BSNL Mini Data Booster' },
      { amount: 57, validity: '10 days', data: '10GB', description: 'BSNL Data Add-on Pack' },
      { amount: 98, validity: '22 days', data: '2GB/day', description: 'BSNL Data Tsunami Pack' },
      { amount: 151, validity: '28 days', data: '40GB', description: 'Work From Home Data Pack' },
      { amount: 251, validity: '28 days', data: '70GB', description: 'Bulk Work From Home Data Pack' }
    ],
    talktime: [
      { amount: 10, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹7.47' },
      { amount: 20, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹14.95' },
      { amount: 50, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹39.37' },
      { amount: 100, validity: 'Unlimited', data: 'N/A', description: 'Talktime balance: ₹81.75' }
    ],
    unlimited: [
      { amount: 666, validity: '105 days', data: '2GB/day', description: 'Unlimited voice calls, 100 SMS/day' }
    ]
  }
};

let currentRecharge = { mobileNumber: '', operator: '', circle: '', plan: null };

document.addEventListener('DOMContentLoaded', async function() {
  if (!(await requireAuth())) return;
  
  const viewPlansBtn = document.getElementById('viewPlansBtn');
  if (viewPlansBtn) viewPlansBtn.addEventListener('click', handleViewPlans);
  
  const confirmRechargeBtn = document.getElementById('confirmRechargeBtn');
  if (confirmRechargeBtn) confirmRechargeBtn.addEventListener('click', handleConfirmRecharge);
  
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
      if (currentRecharge.operator) {
        showPlans(currentRecharge.operator, tab.dataset.category);
      }
    });
  });
});

function handleViewPlans(e) {
  e.preventDefault();
  const mobileNumber = document.getElementById('mobileNumber').value.trim();
  const operator = document.getElementById('operator').value;
  
  if (!mobileNumber || mobileNumber.length !== 10) {
    showNotification('Please enter a valid 10-digit mobile number', 'error');
    return;
  }
  
  if (!operator) {
    showNotification('Please select an operator', 'error');
    return;
  }
  
  currentRecharge.mobileNumber = mobileNumber;
  currentRecharge.operator = operator;
  
  // Reset active tab to 'popular'
  const planTabs = document.querySelectorAll('.plan-tab');
  planTabs.forEach(t => t.classList.remove('active'));
  const popularTab = document.querySelector('.plan-tab[data-category="popular"]');
  if (popularTab) popularTab.classList.add('active');
  
  document.getElementById('plansContainer').classList.remove('hidden');
  showPlans(operator, 'popular');
}

function showPlans(operator, category) {
  const plansList = document.getElementById('plansList');
  if (!plansList) return;
  
  const plans = RECHARGE_PLANS[operator]?.[category] || [];
  let plansHTML = '';
  
  plans.forEach(plan => {
    plansHTML += `
      <div class="plan-card" data-amount="${plan.amount}" data-validity="${plan.validity}" data-data="${plan.data}">
        <div class="plan-amount">₹${plan.amount}</div>
        <div class="plan-validity">Validity: ${plan.validity}</div>
        <div class="plan-details">
          <div><span class="plan-tag">Data</span> ${plan.data}</div>
          <div>${plan.description}</div>
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
      
      currentRecharge.plan = {
        amount: card.dataset.amount,
        validity: card.dataset.validity,
        data: card.dataset.data
      };
      
      showRechargeConfirmation();
    });
  });
}

function showRechargeConfirmation() {
  const confirmMobile = document.getElementById('confirmMobile');
  const confirmAmount = document.getElementById('confirmAmount');
  
  if (confirmMobile) confirmMobile.textContent = currentRecharge.mobileNumber;
  if (confirmAmount) confirmAmount.textContent = `₹${currentRecharge.plan.amount}`;
  
  document.getElementById('plansContainer').classList.add('hidden');
  document.getElementById('rechargeConfirmation').classList.remove('hidden');
}

async function handleConfirmRecharge() {
  const currentBalance = await getWalletBalance();
  const rechargeAmount = parseFloat(currentRecharge.plan.amount);
  
  if (rechargeAmount > currentBalance) {
    showNotification('Insufficient balance.', 'error');
    return;
  }
  
  requireUpiVerification(rechargeAmount, async () => {
    const newBalance = currentBalance - rechargeAmount;
    await updateWalletBalance(newBalance);
    
    await addTransaction(
      rechargeAmount,
      'recharge',
      `Mobile Recharge - ${currentRecharge.mobileNumber} (${currentRecharge.operator})`
    );
    
    document.getElementById('rechargeConfirmation').classList.add('hidden');
    
    const successMobile = document.getElementById('successMobile');
    const successAmount = document.getElementById('successAmount');
    const transactionId = document.getElementById('transactionId');
    const transactionTime = document.getElementById('transactionTime');
    
    const genTxnId = 'TXN' + Math.floor(Math.random() * 1000000000);
    const genTime = new Date().toLocaleString();
    
    if (successMobile) successMobile.textContent = currentRecharge.mobileNumber;
    if (successAmount) successAmount.textContent = `₹${rechargeAmount}`;
    if (transactionId) transactionId.textContent = genTxnId;
    if (transactionTime) transactionTime.textContent = genTime;
    
    document.getElementById('rechargeSuccessModal').style.display = 'block';
  });
}

function resetRechargeForm() {
  document.getElementById('mobileNumber').value = '';
  document.getElementById('operator').value = '';
  document.getElementById('plansContainer').classList.add('hidden');
  document.getElementById('rechargeConfirmation').classList.add('hidden');
  currentRecharge = { mobileNumber: '', operator: '', circle: '', plan: null };
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
    link.download = `PayMoney_Recharge_Receipt_${Date.now()}.png`;
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