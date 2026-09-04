/**
 * Electricity Bill Payment functionality for the PayMoney application
 */

const STATE_BOARDS = {
  delhi: [
    { value: 'bses_rajdhani', name: 'BSES Rajdhani Power Limited' },
    { value: 'bses_yamuna', name: 'BSES Yamuna Power Limited' },
    { value: 'tata_power_ddl', name: 'Tata Power Delhi Distribution Limited' }
  ],
  maharashtra: [
    { value: 'msedcl', name: 'Maharashtra State Electricity Distribution Co. Ltd (MSEDCL)' },
    { value: 'adani_mumbai', name: 'Adani Electricity Mumbai Limited' },
    { value: 'tata_power_mumbai', name: 'Tata Power Mumbai' }
  ],
  karnataka: [
    { value: 'bescom', name: 'Bangalore Electricity Supply Company (BESCOM)' },
    { value: 'hescom', name: 'Hubli Electricity Supply Company (HESCOM)' },
    { value: 'gescom', name: 'Gulbarga Electricity Supply Company (GESCOM)' }
  ],
  tamilnadu: [
    { value: 'tangedco', name: 'Tamil Nadu Generation and Distribution Corporation (TANGEDCO)' }
  ],
  up: [
    { value: 'uppcl_urban', name: 'Uttar Pradesh Power Corporation Ltd (UPPCL) - Urban' },
    { value: 'uppcl_rural', name: 'Uttar Pradesh Power Corporation Ltd (UPPCL) - Rural' }
  ],
  westbengal: [
    { value: 'wbsedcl', name: 'West Bengal State Electricity Distribution Co. Ltd' },
    { value: 'cesc', name: 'CESC Limited' }
  ],
  gujarat: [
    { value: 'dgvcl', name: 'Dakshin Gujarat Vij Company Ltd (DGVCL)' },
    { value: 'mgvcl', name: 'Madhya Gujarat Vij Company Ltd (MGVCL)' },
    { value: 'pgvcl', name: 'Paschim Gujarat Vij Company Ltd (PGVCL)' },
    { value: 'ugvcl', name: 'Uttar Gujarat Vij Company Ltd (UGVCL)' }
  ]
};

const MOCK_NAMES = [
  'Ayush Sharma', 'Rahul Varma', 'Priya Patel', 'Sunita Rao', 
  'Amit Kumar', 'Rajesh Kulkarni', 'Sneha Nair', 'Deepak Sen'
];

let currentBill = { state: '', board: '', boardName: '', consumerNumber: '', customerName: '', amount: 0, dueDate: '', billNo: '', billMonth: '' };

document.addEventListener('DOMContentLoaded', async function() {
  if (!(await requireAuth())) return;
  
  const stateSelect = document.getElementById('electricityState');
  if (stateSelect) {
    stateSelect.addEventListener('change', handleStateChange);
  }
  
  const fetchBillBtn = document.getElementById('fetchBillBtn');
  if (fetchBillBtn) fetchBillBtn.addEventListener('click', handleFetchBill);
  
  const proceedToPayBtn = document.getElementById('proceedToPayBtn');
  if (proceedToPayBtn) proceedToPayBtn.addEventListener('click', handleProceedToPay);

  const confirmRechargeBtn = document.getElementById('confirmRechargeBtn');
  if (confirmRechargeBtn) confirmRechargeBtn.addEventListener('click', handleConfirmPayment);
  
  const cancelRechargeBtn = document.getElementById('cancelRechargeBtn');
  if (cancelRechargeBtn) {
    cancelRechargeBtn.addEventListener('click', () => {
      document.getElementById('rechargeConfirmation').classList.add('hidden');
      document.getElementById('billContainer').classList.remove('hidden');
    });
  }

  const closeSuccessBtn = document.getElementById('closeSuccessBtn');
  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', () => {
      document.getElementById('rechargeSuccessModal').style.display = 'none';
      resetElectricityForm();
    });
  }

  const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
  if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', downloadReceipt);
  }
});

function handleStateChange() {
  const stateSelect = document.getElementById('electricityState');
  const boardSelect = document.getElementById('electricityBoard');
  const state = stateSelect.value;
  
  // Clear previous options
  boardSelect.innerHTML = '<option value="" disabled selected>Select Board</option>';
  
  if (state && STATE_BOARDS[state]) {
    STATE_BOARDS[state].forEach(board => {
      const option = document.createElement('option');
      option.value = board.value;
      option.textContent = board.name;
      boardSelect.appendChild(option);
    });
    boardSelect.disabled = false;
  } else {
    boardSelect.disabled = true;
  }
  
  // Hide bill details if state changes
  document.getElementById('billContainer').classList.add('hidden');
  document.getElementById('rechargeConfirmation').classList.add('hidden');
}

function handleFetchBill(e) {
  e.preventDefault();
  const state = document.getElementById('electricityState').value;
  const boardSelect = document.getElementById('electricityBoard');
  const board = boardSelect.value;
  const boardName = boardSelect.options[boardSelect.selectedIndex]?.text;
  const consumerNumber = document.getElementById('consumerNumber').value.trim();
  
  if (!state) {
    showNotification('Please select a state', 'error');
    return;
  }
  
  if (!board) {
    showNotification('Please select an electricity board', 'error');
    return;
  }
  
  if (!consumerNumber || consumerNumber.length < 6 || consumerNumber.length > 15 || isNaN(consumerNumber)) {
    showNotification('Please enter a valid 6-15 digit Consumer Number', 'error');
    return;
  }
  
  // Generate simulated bill
  currentBill.state = state;
  currentBill.board = board;
  currentBill.boardName = boardName;
  currentBill.consumerNumber = consumerNumber;
  
  // Random customer name
  const profileName = document.getElementById('userName')?.textContent;
  currentBill.customerName = (profileName && profileName !== 'User') ? profileName : MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
  
  // Random amount between 350 and 3200
  currentBill.amount = Math.floor(Math.random() * (3200 - 350) + 350);
  
  // Bill Details
  currentBill.billNo = 'BILL' + Math.floor(Math.random() * 10000000);
  
  // Dynamic months list
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const curDate = new Date();
  const prevMonthIdx = (curDate.getMonth() - 1 + 12) % 12;
  const billYear = prevMonthIdx === 11 ? curDate.getFullYear() - 1 : curDate.getFullYear();
  currentBill.billMonth = `${months[prevMonthIdx]} ${billYear}`;
  
  // Due date: 14 days from now
  const due = new Date();
  due.setDate(due.getDate() + 14);
  currentBill.dueDate = due.toLocaleDateString();
  
  // Populate UI
  document.getElementById('billCustomerName').textContent = currentBill.customerName;
  document.getElementById('billNumber').textContent = currentBill.billNo;
  document.getElementById('billMonth').textContent = currentBill.billMonth;
  document.getElementById('billDueDate').textContent = currentBill.dueDate;
  document.getElementById('billConsumerNo').textContent = currentBill.consumerNumber;
  document.getElementById('billBoardName').textContent = currentBill.boardName;
  document.getElementById('billAmount').textContent = `₹${currentBill.amount}`;
  
  // Show details
  document.getElementById('billContainer').classList.remove('hidden');
  document.getElementById('rechargeConfirmation').classList.add('hidden');
}

function handleProceedToPay() {
  const confirmConsumerNo = document.getElementById('confirmConsumerNo');
  const confirmBoard = document.getElementById('confirmBoard');
  const confirmCustomer = document.getElementById('confirmCustomer');
  const confirmAmount = document.getElementById('confirmAmount');
  
  if (confirmConsumerNo) confirmConsumerNo.textContent = currentBill.consumerNumber;
  if (confirmBoard) confirmBoard.textContent = currentBill.boardName;
  if (confirmCustomer) confirmCustomer.textContent = currentBill.customerName;
  if (confirmAmount) confirmAmount.textContent = `₹${currentBill.amount}`;
  
  document.getElementById('billContainer').classList.add('hidden');
  document.getElementById('rechargeConfirmation').classList.remove('hidden');
}

async function handleConfirmPayment() {
  const confirmBtn = document.getElementById('confirmRechargeBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Processing...';

  try {
    const currentBalance = await getWalletBalance();
    const payAmount = parseFloat(currentBill.amount);
    
    if (payAmount > currentBalance) {
      showNotification('Insufficient balance.', 'error');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm & Pay';
      return;
    }
    
    requireUpiVerification(payAmount, async () => {
      const newBalance = currentBalance - payAmount;
      await updateWalletBalance(newBalance);
      
      await addTransaction(
        payAmount,
        'recharge',
        `Electricity Bill - Consumer ID: ${currentBill.consumerNumber} (${currentBill.boardName})`
      );
      
      document.getElementById('rechargeConfirmation').classList.add('hidden');
      
      const successCustomer = document.getElementById('successCustomer');
      const successConsumerNo = document.getElementById('successConsumerNo');
      const successBoard = document.getElementById('successBoard');
      const successAmount = document.getElementById('successAmount');
      const transactionId = document.getElementById('transactionId');
      const transactionTime = document.getElementById('transactionTime');
      
      const genTxnId = 'TXN' + Math.floor(Math.random() * 1000000000);
      const genTime = new Date().toLocaleString();
      
      if (successCustomer) successCustomer.textContent = currentBill.customerName;
      if (successConsumerNo) successConsumerNo.textContent = currentBill.consumerNumber;
      if (successBoard) successBoard.textContent = currentBill.boardName;
      if (successAmount) successAmount.textContent = `₹${payAmount}`;
      if (transactionId) transactionId.textContent = genTxnId;
      if (transactionTime) transactionTime.textContent = genTime;
      
      document.getElementById('rechargeSuccessModal').style.display = 'block';
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm & Pay';
    });
  } catch (error) {
    console.error('Error confirming electricity payment:', error);
    showNotification('An error occurred. Please try again.', 'error');
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm & Pay';
  }
}

function resetElectricityForm() {
  document.getElementById('consumerNumber').value = '';
  document.getElementById('electricityState').value = '';
  const boardSelect = document.getElementById('electricityBoard');
  boardSelect.innerHTML = '<option value="" disabled selected>Select Board</option>';
  boardSelect.disabled = true;
  
  document.getElementById('billContainer').classList.add('hidden');
  document.getElementById('rechargeConfirmation').classList.add('hidden');
  
  currentBill = { state: '', board: '', boardName: '', consumerNumber: '', customerName: '', amount: 0, dueDate: '', billNo: '', billMonth: '' };
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
    link.download = `PayMoney_Electricity_Receipt_${Date.now()}.png`;
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
