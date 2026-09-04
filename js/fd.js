/**
 * FD Account functionality for PayMoney (Prototype)
 */

const FD_PLANS = [
  { id: 'p1', name: 'Starter', duration: 3, rate: 5.0, min: 500 },
  { id: 'p2', name: 'Growth', duration: 6, rate: 5.5, min: 500 },
  { id: 'p3', name: 'Smart', duration: 12, rate: 6.0, min: 500 },
  { id: 'p4', name: 'Wealth', duration: 24, rate: 6.5, min: 500 }
];

let currentUser = null;
let activePlanSelection = null;
let calculatedDetails = null;
let currentViewedFd = null;

document.addEventListener('DOMContentLoaded', async function() {
  if (!(await requireAuth())) return;
  currentUser = await getUser();
  
  initFdNavigation();
  initModals();
  loadFdDashboard();
});

function initFdNavigation() {
  const exploreBtn = document.getElementById('explorePlansBtn');
  const backBtn = document.getElementById('backToOverviewBtn');
  
  if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
      document.getElementById('fdOverviewSection').style.display = 'none';
      document.getElementById('fdExploreSection').style.display = 'block';
      renderPlansGrid();
    });
  }
  
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      document.getElementById('fdExploreSection').style.display = 'none';
      document.getElementById('fdOverviewSection').style.display = 'block';
    });
  }
}

function initModals() {
  // Close buttons
  ['closeCalcModal', 'closeConfirmModal', 'closeDetailsModal'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
      });
    }
  });

  // Calculate input change
  const calcAmount = document.getElementById('calcAmount');
  if (calcAmount) {
    calcAmount.addEventListener('input', calculateReturns);
  }

  // Proceed to review
  const proceedBtn = document.getElementById('proceedToReviewBtn');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', showReviewModal);
  }

  // Go back to calc
  const backToCalc = document.getElementById('backToCalcBtn');
  if (backToCalc) {
    backToCalc.addEventListener('click', () => {
      document.getElementById('confirmationModal').style.display = 'none';
      document.getElementById('planSelectionModal').style.display = 'block';
    });
  }

  // Confirm plan
  const confirmBtn = document.getElementById('confirmPlanBtn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', confirmFdPlan);
  }
  
  // Start new plan from details
  const startNew = document.getElementById('startNewPlanBtn');
  if (startNew) {
    startNew.addEventListener('click', () => {
      document.getElementById('fdDetailsModal').style.display = 'none';
      document.getElementById('fdOverviewSection').style.display = 'none';
      document.getElementById('fdExploreSection').style.display = 'block';
      renderPlansGrid();
    });
  }
  
  const closeCancel = document.getElementById('closeCancelModal');
  if (closeCancel) closeCancel.addEventListener('click', () => document.getElementById('cancelFdModal').style.display = 'none');
  
  const abortCancel = document.getElementById('abortCancelBtn');
  if (abortCancel) abortCancel.addEventListener('click', () => document.getElementById('cancelFdModal').style.display = 'none');
  
  const initiateCancel = document.getElementById('initiateCancelBtn');
  if (initiateCancel) {
    initiateCancel.addEventListener('click', () => {
      if (!currentViewedFd) return;
      document.getElementById('cancelPrincipalAmount').textContent = formatCurrency(currentViewedFd.principal).replace('₹', '');
      document.getElementById('cancelFdModal').style.display = 'block';
    });
  }
  
  const confirmCancel = document.getElementById('confirmCancelBtn');
  if (confirmCancel) confirmCancel.addEventListener('click', processCancelFd);
}

function loadFdDashboard() {
  const savedFds = getSavedFds();
  const noPlansState = document.getElementById('noPlansState');
  const activePlansContainer = document.getElementById('activePlansContainer');
  
  if (savedFds.length === 0) {
    noPlansState.style.display = 'block';
    activePlansContainer.innerHTML = '';
  } else {
    noPlansState.style.display = 'none';
    renderActiveFds(savedFds, activePlansContainer);
  }
}

function getSavedFds() {
  if (!currentUser) return [];
  try {
    const data = localStorage.getItem(`fd_accounts_${currentUser.id}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveFd(fdData) {
  if (!currentUser) return;
  const existing = getSavedFds();
  existing.push(fdData);
  localStorage.setItem(`fd_accounts_${currentUser.id}`, JSON.stringify(existing));
}

function renderPlansGrid() {
  const grid = document.getElementById('fdPlansGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  FD_PLANS.forEach(plan => {
    const card = document.createElement('div');
    card.className = 'plan-card';
    card.innerHTML = `
      <div class="plan-header">
        <span class="plan-label">${plan.name}</span>
      </div>
      <div class="plan-duration">${plan.duration} Months</div>
      <div class="plan-rate">${plan.rate.toFixed(1)}% p.a.</div>
      <div class="plan-details-text">Min deposit: ₹${plan.min}</div>
      <button class="btn btn-outline" style="width: 100%; margin-top: auto;">Select Plan</button>
    `;
    
    card.addEventListener('click', () => openPlanCalculator(plan));
    grid.appendChild(card);
  });
}

function openPlanCalculator(plan) {
  activePlanSelection = plan;
  
  document.getElementById('calcPlanName').textContent = plan.name;
  document.getElementById('calcPlanDuration').textContent = `${plan.duration} Months`;
  document.getElementById('calcPlanRate').textContent = `${plan.rate.toFixed(1)}% p.a.`;
  document.getElementById('calcPlanMin').textContent = `₹${plan.min}`;
  
  document.getElementById('calcAmount').value = '';
  document.getElementById('calcError').style.display = 'none';
  
  document.getElementById('displayPrincipal').textContent = '₹0';
  document.getElementById('displayInterest').textContent = '₹0';
  document.getElementById('displayMaturity').textContent = '₹0';
  document.getElementById('displayMaturityDate').textContent = '-';
  
  document.getElementById('planSelectionModal').style.display = 'block';
}

function calculateReturns() {
  if (!activePlanSelection) return;
  
  const amountInput = document.getElementById('calcAmount');
  const errorMsg = document.getElementById('calcError');
  const amount = parseFloat(amountInput.value);
  
  if (isNaN(amount) || amount < activePlanSelection.min) {
    errorMsg.textContent = `Minimum deposit is ₹${activePlanSelection.min}`;
    errorMsg.style.display = 'block';
    calculatedDetails = null;
    
    document.getElementById('displayPrincipal').textContent = '₹0';
    document.getElementById('displayInterest').textContent = '₹0';
    document.getElementById('displayMaturity').textContent = '₹0';
    document.getElementById('displayMaturityDate').textContent = '-';
    return;
  }
  
  errorMsg.style.display = 'none';
  
  // Formula: Simple Interest = P * R * T(in years)
  const principal = amount;
  const rate = activePlanSelection.rate / 100;
  const timeInYears = activePlanSelection.duration / 12;
  
  const interest = principal * rate * timeInYears;
  const maturityValue = principal + interest;
  
  const startDate = new Date();
  const maturityDate = new Date();
  maturityDate.setMonth(maturityDate.getMonth() + activePlanSelection.duration);
  
  calculatedDetails = {
    principal,
    interest,
    maturityValue,
    startDate,
    maturityDate
  };
  
  document.getElementById('displayPrincipal').textContent = formatCurrency(principal);
  document.getElementById('displayInterest').textContent = formatCurrency(interest);
  document.getElementById('displayMaturity').textContent = formatCurrency(maturityValue);
  document.getElementById('displayMaturityDate').textContent = formatDate(maturityDate);
}

function showReviewModal() {
  const amountInput = document.getElementById('calcAmount');
  const amount = parseFloat(amountInput.value);
  
  if (!activePlanSelection || !calculatedDetails || isNaN(amount) || amount < activePlanSelection.min) {
    const errorMsg = document.getElementById('calcError');
    errorMsg.textContent = `Please enter a valid amount (Min: ₹${activePlanSelection ? activePlanSelection.min : 500})`;
    errorMsg.style.display = 'block';
    return;
  }
  
  document.getElementById('planSelectionModal').style.display = 'none';
  
  document.getElementById('reviewPlanName').textContent = activePlanSelection.name;
  document.getElementById('reviewDuration').textContent = `${activePlanSelection.duration} Months`;
  document.getElementById('reviewDeposit').textContent = formatCurrency(calculatedDetails.principal);
  document.getElementById('reviewRate').textContent = `${activePlanSelection.rate.toFixed(1)}% p.a.`;
  document.getElementById('reviewInterest').textContent = formatCurrency(calculatedDetails.interest);
  document.getElementById('reviewMaturity').textContent = formatCurrency(calculatedDetails.maturityValue);
  document.getElementById('reviewMaturityDate').textContent = formatDate(calculatedDetails.maturityDate);
  
  document.getElementById('confirmationModal').style.display = 'block';
}

async function confirmFdPlan() {
  if (!activePlanSelection || !calculatedDetails) return;
  
  // Check balance and deduct
  const profile = await getProfile();
  if (!profile) {
    showNotification('Please log in first', 'error');
    return;
  }
  
  if (profile.wallet_balance < calculatedDetails.principal) {
    showNotification('Insufficient wallet balance for this deposit', 'error');
    document.getElementById('confirmationModal').style.display = 'none';
    return;
  }
  
  const fdId = 'FD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  
  const newFd = {
    id: fdId,
    planId: activePlanSelection.id,
    planName: activePlanSelection.name,
    duration: activePlanSelection.duration,
    rate: activePlanSelection.rate,
    principal: calculatedDetails.principal,
    interest: calculatedDetails.interest,
    maturityValue: calculatedDetails.maturityValue,
    startDate: calculatedDetails.startDate.toISOString(),
    maturityDate: calculatedDetails.maturityDate.toISOString(),
    status: 'active'
  };
  
  saveFd(newFd);
  
  // Deduct balance and add transaction
  const newBalance = profile.wallet_balance - calculatedDetails.principal;
  await updateWalletBalance(newBalance);
  await addTransaction(calculatedDetails.principal, 'FD_DEPOSIT', `FD Deposit: ${activePlanSelection.name} Plan`);
  
  // Try to update UI balance if on dashboard
  if (typeof updateUserInfo === 'function') {
    await updateUserInfo();
  }
  
  document.getElementById('confirmationModal').style.display = 'none';
  document.getElementById('fdExploreSection').style.display = 'none';
  document.getElementById('fdOverviewSection').style.display = 'block';
  
  showNotification('FD Account created successfully');
  loadFdDashboard();
}

function renderActiveFds(fds, container) {
  container.innerHTML = '<h3 style="margin-bottom: var(--spacing-md);">Your Active Plans</h3>';
  
  fds.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)).forEach(fd => {
    const start = new Date(fd.startDate);
    const end = new Date(fd.maturityDate);
    const now = new Date();
    
    let progress = 0;
    let isMatured = false;
    let daysRemaining = 0;
    
    if (now >= end) {
      progress = 100;
      isMatured = true;
    } else {
      const totalTime = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      progress = Math.max(0, Math.min(100, (elapsed / totalTime) * 100));
      daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    const card = document.createElement('div');
    card.className = 'active-fd-card';
    card.innerHTML = `
      <div class="active-fd-header">
        <div>
          <p class="active-fd-title">PAYMONEY FD</p>
          <p class="active-fd-plan">${fd.planName} Plan</p>
        </div>
        <div>
          <span class="status-banner ${isMatured ? 'matured' : ''}" style="color:var(--text-dark); background:rgba(255,255,255,0.8);">${isMatured ? 'Matured' : 'Active'}</span>
        </div>
      </div>
      
      <div class="active-fd-amount-row">
        <div>
          <div class="active-fd-amount-label">Principal</div>
          <div class="active-fd-amount-value">${formatCurrency(fd.principal)}</div>
        </div>
        <div style="text-align: right;">
          <div class="active-fd-amount-label">Est. Maturity</div>
          <div class="active-fd-amount-value">${formatCurrency(fd.maturityValue)}</div>
        </div>
      </div>
      
      <div class="progress-container">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-labels">
          <span>${formatDate(start)}</span>
          <span>${isMatured ? 'Matured' : (daysRemaining + ' days left')}</span>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => openFdDetails(fd));
    container.appendChild(card);
  });
  
  const createNewBtn = document.createElement('button');
  createNewBtn.className = 'btn btn-outline';
  createNewBtn.style.width = '100%';
  createNewBtn.style.marginTop = 'var(--spacing-md)';
  createNewBtn.textContent = '+ Create New FD';
  createNewBtn.addEventListener('click', () => {
    document.getElementById('fdOverviewSection').style.display = 'none';
    document.getElementById('fdExploreSection').style.display = 'block';
    renderPlansGrid();
  });
  container.appendChild(createNewBtn);
}

function openFdDetails(fd) {
  currentViewedFd = fd;
  document.getElementById('detailsId').textContent = fd.id;
  document.getElementById('detailsPlanName').textContent = `${fd.planName} (${fd.duration} Months)`;
  document.getElementById('detailsPrincipal').textContent = formatCurrency(fd.principal);
  document.getElementById('detailsRate').textContent = `${fd.rate.toFixed(1)}% p.a.`;
  document.getElementById('detailsInterest').textContent = formatCurrency(fd.interest);
  document.getElementById('detailsMaturity').textContent = formatCurrency(fd.maturityValue);
  
  const start = new Date(fd.startDate);
  const end = new Date(fd.maturityDate);
  const now = new Date();
  
  document.getElementById('detailsStartDate').textContent = formatDate(start);
  document.getElementById('detailsMaturityDate').textContent = formatDate(end);
  
  const statusBanner = document.getElementById('detailsStatusBanner');
  const maturedActions = document.getElementById('maturedActions');
  const activeActions = document.getElementById('activeActions');
  const currentPoint = document.getElementById('detailsCurrentPoint');
  const progressBar = document.getElementById('detailsTimelineProgress');
  
  if (now >= end) {
    statusBanner.textContent = 'Matured';
    statusBanner.className = 'status-banner matured';
    maturedActions.style.display = 'block';
    if (activeActions) activeActions.style.display = 'none';
    progressBar.style.height = '100%';
    currentPoint.style.display = 'none';
    document.querySelector('.timeline-point.end').classList.add('completed');
  } else {
    statusBanner.textContent = 'Active';
    statusBanner.className = 'status-banner';
    maturedActions.style.display = 'none';
    if (activeActions) activeActions.style.display = 'block';
    
    const totalTime = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const progress = Math.max(0, Math.min(100, (elapsed / totalTime) * 100));
    
    progressBar.style.height = `${progress}%`;
    currentPoint.style.display = 'block';
    currentPoint.style.top = `${progress}%`;
    document.querySelector('.timeline-point.end').classList.remove('completed');
  }
  
  document.getElementById('fdDetailsModal').style.display = 'block';
}

function formatCurrency(amount) {
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDate(date) {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function processCancelFd() {
  if (!currentViewedFd || !currentUser) return;
  
  const fds = getSavedFds();
  const updatedFds = fds.filter(f => f.id !== currentViewedFd.id);
  localStorage.setItem(`fd_accounts_${currentUser.id}`, JSON.stringify(updatedFds));
  
  const profile = await getProfile();
  if (profile) {
    const newBalance = parseFloat(profile.wallet_balance) + currentViewedFd.principal;
    await updateWalletBalance(newBalance);
    await addTransaction(currentViewedFd.principal, 'FD_WITHDRAWAL', `FD Canceled: ${currentViewedFd.planName} Plan Refund`);
    if (typeof updateUserInfo === 'function') {
      await updateUserInfo();
    }
  }
  
  document.getElementById('cancelFdModal').style.display = 'none';
  document.getElementById('fdDetailsModal').style.display = 'none';
  
  showNotification('FD canceled successfully. Principal refunded to wallet.');
  loadFdDashboard();
}
