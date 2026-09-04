/**
 * DTH Bill Payment and Recharge functionality for the PayMoney application
 */

const DTH_PLANS = {
  tataplay: {
    popular: [
      { amount: 250, validity: '30 days', data: 'Basic Hindi', description: '80+ Hindi Entertainment & News channels' },
      { amount: 350, validity: '30 days', data: 'Hindi Premium HD', description: '120+ Channels, including HD Sports & Movies' },
      { amount: 450, validity: '30 days', data: 'Hindi Mega HD', description: 'All major Hindi & English entertainment/sports/movies in HD' }
    ],
    monthly: [
      { amount: 150, validity: '30 days', data: 'Tamil Starter', description: '50+ Tamil regional entertainment & news' },
      { amount: 180, validity: '30 days', data: 'Sports Add-on Pack', description: 'Adds all major Star Sports & Sony Sports channels' },
      { amount: 220, validity: '30 days', data: 'Kids & Movies', description: 'Cartoon Network, Disney, HBO & Star Movies' }
    ],
    '3month': [
      { amount: 700, validity: '90 days', data: 'Hindi Value 3M', description: 'Standard Hindi Pack for 3 months (Save ₹50)' },
      { amount: 980, validity: '90 days', data: 'Premium HD 3M', description: 'Hindi Premium HD Pack for 3 months (Save ₹70)' }
    ],
    annual: [
      { amount: 2700, validity: '365 days', data: 'Hindi Value Annual', description: 'Standard Hindi Pack for 1 year (Save ₹300)' },
      { amount: 3800, validity: '365 days', data: 'Premium HD Annual', description: 'Premium HD Pack for 1 year (Save ₹400)' }
    ]
  },
  dishtv: {
    popular: [
      { amount: 220, validity: '30 days', data: 'Dish Bharat', description: '75+ Channels, Hindi & regional entertainment' },
      { amount: 320, validity: '30 days', data: 'Super Family HD', description: '110+ Channels, Sports & HD movies' }
    ],
    monthly: [
      { amount: 120, validity: '30 days', data: 'News & Regional', description: 'All major news & regional Hindi packs' },
      { amount: 200, validity: '30 days', data: 'Sports Lite', description: 'Select sports channels (Star Sports 1, Sony Ten 1)' }
    ],
    '3month': [
      { amount: 620, validity: '90 days', data: 'Dish Bharat 3M', description: '3 months regional Hindi pack saver' },
      { amount: 900, validity: '90 days', data: 'Super Family HD 3M', description: '3 months Super Family HD pack saver' }
    ],
    annual: [
      { amount: 2400, validity: '365 days', data: 'Dish Bharat 12M', description: '1 year regional Hindi pack (Save ₹240)' },
      { amount: 3500, validity: '365 days', data: 'Super Family HD 12M', description: '1 year Super Family HD (Save ₹340)' }
    ]
  },
  airtel: {
    popular: [
      { amount: 280, validity: '30 days', data: 'Airtel Value', description: '90+ Channels, standard Hindi entertainment' },
      { amount: 400, validity: '30 days', data: 'Airtel Premium HD', description: '130+ Channels, Full HD sports & kids channels' }
    ],
    monthly: [
      { amount: 140, validity: '30 days', data: 'South Max', description: '60+ South Indian regional channels' },
      { amount: 210, validity: '30 days', data: 'Movie Mania', description: 'All Hindi and English movie channels' }
    ],
    '3month': [
      { amount: 780, validity: '90 days', data: 'Airtel Value 3M', description: '3 months Airtel Value Pack saver' },
      { amount: 1100, validity: '90 days', data: 'Premium HD 3M', description: '3 months Premium HD Pack saver' }
    ],
    annual: [
      { amount: 3000, validity: '365 days', data: 'Airtel Value 12M', description: '1 year Airtel Value Pack (Save ₹360)' },
      { amount: 4300, validity: '365 days', data: 'Premium HD 12M', description: '1 year Premium HD Pack (Save ₹500)' }
    ]
  },
  sundirect: {
    popular: [
      { amount: 190, validity: '30 days', data: 'Sun Joy', description: '70+ Tamil, Telugu, and Kannada regional channels' },
      { amount: 290, validity: '30 days', data: 'Sun Gold HD', description: '100+ South regional & Hindi sports/movies HD' }
    ],
    monthly: [
      { amount: 130, validity: '30 days', data: 'Sun regional basic', description: 'Basic South regional channels' }
    ],
    '3month': [
      { amount: 530, validity: '90 days', data: 'Sun Joy 3M', description: '3 months Sun Joy regional saver' }
    ],
    annual: [
      { amount: 2000, validity: '365 days', data: 'Sun Joy 12M', description: '1 year Sun Joy Pack (Save ₹280)' }
    ]
  },
  videocon: {
    popular: [
      { amount: 240, validity: '30 days', data: 'd2h Value', description: '80+ Channels, standard entertainment & music' },
      { amount: 340, validity: '30 days', data: 'd2h Premium HD', description: '115+ Channels, high-speed HD packs' }
    ],
    monthly: [
      { amount: 150, validity: '30 days', data: 'd2h regional basic', description: 'Basic regional entertainment' }
    ],
    '3month': [
      { amount: 670, validity: '90 days', data: 'd2h Value 3M', description: '3 months d2h Value Pack' }
    ],
    annual: [
      { amount: 2600, validity: '365 days', data: 'd2h Value 12M', description: '1 year d2h Value Pack (Save ₹280)' }
    ]
  }
};

let currentDth = { subscriberId: '', operator: '', operatorName: '', plan: null };

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
      if (currentDth.operator) {
        showPlans(currentDth.operator, tab.dataset.category);
      }
    });
  });
});

function handleViewPlans(e) {
  e.preventDefault();
  const subscriberId = document.getElementById('subscriberId').value.trim();
  const operatorSelect = document.getElementById('dthOperator');
  const operator = operatorSelect.value;
  const operatorName = operatorSelect.options[operatorSelect.selectedIndex].text;
  
  if (!subscriberId || subscriberId.length < 8 || subscriberId.length > 12 || isNaN(subscriberId)) {
    showNotification('Please enter a valid 8-12 digit Subscriber ID', 'error');
    return;
  }
  
  if (!operator) {
    showNotification('Please select a DTH operator', 'error');
    return;
  }
  
  currentDth.subscriberId = subscriberId;
  currentDth.operator = operator;
  currentDth.operatorName = operatorName;
  
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
  
  const plans = DTH_PLANS[operator]?.[category] || [];
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
      
      currentDth.plan = {
        amount: card.dataset.amount,
        validity: card.dataset.validity,
        data: card.dataset.data
      };
      
      showRechargeConfirmation();
    });
  });
}

function showRechargeConfirmation() {
  const confirmSubscriberId = document.getElementById('confirmSubscriberId');
  const confirmOperator = document.getElementById('confirmOperator');
  const confirmPlan = document.getElementById('confirmPlan');
  const confirmAmount = document.getElementById('confirmAmount');
  
  if (confirmSubscriberId) confirmSubscriberId.textContent = currentDth.subscriberId;
  if (confirmOperator) confirmOperator.textContent = currentDth.operatorName;
  if (confirmPlan) confirmPlan.textContent = `${currentDth.plan.data} (${currentDth.plan.validity})`;
  if (confirmAmount) confirmAmount.textContent = `₹${currentDth.plan.amount}`;
  
  document.getElementById('plansContainer').classList.add('hidden');
  document.getElementById('rechargeConfirmation').classList.remove('hidden');
}

async function handleConfirmRecharge() {
  const confirmBtn = document.getElementById('confirmRechargeBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Processing...';

  try {
    const currentBalance = await getWalletBalance();
    const rechargeAmount = parseFloat(currentDth.plan.amount);
    
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
        `DTH Recharge - Subscriber ID: ${currentDth.subscriberId} (${currentDth.operatorName})`
      );
      
      document.getElementById('rechargeConfirmation').classList.add('hidden');
      
      const successSubscriberId = document.getElementById('successSubscriberId');
      const successOperator = document.getElementById('successOperator');
      const successAmount = document.getElementById('successAmount');
      const transactionId = document.getElementById('transactionId');
      const transactionTime = document.getElementById('transactionTime');
      
      const genTxnId = 'TXN' + Math.floor(Math.random() * 1000000000);
      const genTime = new Date().toLocaleString();
      
      if (successSubscriberId) successSubscriberId.textContent = currentDth.subscriberId;
      if (successOperator) successOperator.textContent = currentDth.operatorName;
      if (successAmount) successAmount.textContent = `₹${rechargeAmount}`;
      if (transactionId) transactionId.textContent = genTxnId;
      if (transactionTime) transactionTime.textContent = genTime;
      
      document.getElementById('rechargeSuccessModal').style.display = 'block';
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm & Pay';
    });
  } catch (error) {
    console.error('Error confirming DTH payment:', error);
    showNotification('An error occurred. Please try again.', 'error');
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm & Pay';
  }
}

function resetRechargeForm() {
  document.getElementById('subscriberId').value = '';
  document.getElementById('dthOperator').value = '';
  document.getElementById('plansContainer').classList.add('hidden');
  document.getElementById('rechargeConfirmation').classList.add('hidden');
  currentDth = { subscriberId: '', operator: '', operatorName: '', plan: null };
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
    link.download = `PayMoney_DTH_Receipt_${Date.now()}.png`;
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
