document.addEventListener('DOMContentLoaded', async function() {
  // Only normal accounts can monitor child accounts
  if (!await requireAuth('normal')) return;

  const parentId = localStorage.getItem('paymoney_user_id');
  if (!parentId) return;

  // Handle Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  await loadFamilyData(parentId);
});

async function loadFamilyData(parentId) {
  const container = document.getElementById('liteAccountsList');
  
  try {
    // 1. Fetch all child accounts connected to this parent
    const { data: children, error: childError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, phone, upi_id, wallet_balance, age')
      .eq('parent_id', parentId)
      .eq('account_type', 'lite');

    if (childError) throw childError;

    if (!children || children.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3 style="color: #64748b; margin-bottom: 10px;">No Lite Accounts found</h3>
          <p style="color: #94a3b8; font-size: 0.95rem;">You have not connected any PayMoney Lite accounts for your children yet.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = ''; // Clear loading

    // 2. Render each child account and fetch their transactions
    for (const child of children) {
      const card = document.createElement('div');
      card.className = 'lite-account-card';
      
      const header = document.createElement('div');
      header.className = 'lite-account-header';
      header.innerHTML = `
        <h3>
          <span style="background: #dcfce7; color: #16a34a; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">LITE</span>
          ${child.full_name} 
          <span style="font-size: 0.9rem; color: #64748b; font-weight: normal;">(Age: ${child.age || 'N/A'})</span>
        </h3>
        <div class="lite-balance">₹${parseFloat(child.wallet_balance).toFixed(2)}</div>
      `;
      
      const details = document.createElement('div');
      details.style.marginBottom = '16px';
      details.style.fontSize = '0.9rem';
      details.style.color = '#475569';
      details.innerHTML = `
        <strong>Mobile:</strong> ${child.phone} &nbsp;|&nbsp; <strong>UPI ID:</strong> ${child.upi_id}
      `;

      const txContainer = document.createElement('div');
      txContainer.className = 'lite-transactions-container';
      txContainer.innerHTML = `<p style="text-align:center; color:#94a3b8; font-size:0.9rem; padding: 20px;">Loading transactions...</p>`;

      card.appendChild(header);
      card.appendChild(details);
      card.appendChild(txContainer);
      container.appendChild(card);

      // Fetch transactions for this specific child
      fetchChildTransactions(child.id, txContainer);
    }
    
  } catch (err) {
    console.error('Error loading family data:', err);
    container.innerHTML = `<p style="color: red; text-align: center;">Failed to load accounts. Please try again later.</p>`;
  }
}

async function fetchChildTransactions(childId, txContainer) {
  try {
    const { data: transactions, error } = await supabaseClient
      .from('transactions')
      .select('*, sender:profiles!sender_id(full_name), receiver:profiles!receiver_id(full_name)')
      .or(`sender_id.eq.${childId},receiver_id.eq.${childId}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!transactions || transactions.length === 0) {
      txContainer.innerHTML = `<p style="text-align:center; color:#94a3b8; font-size:0.9rem; padding: 20px;">No recent transactions found for this account.</p>`;
      return;
    }

    txContainer.innerHTML = '<h4 style="margin-bottom: 12px; color: #334155; font-size: 0.95rem;">Recent Activity</h4>';
    
    transactions.forEach(tx => {
      const isSender = tx.sender_id === childId;
      const otherPartyName = isSender 
        ? (tx.receiver ? tx.receiver.full_name : 'Unknown') 
        : (tx.sender ? tx.sender.full_name : 'Unknown');
        
      const title = (tx.transaction_type === 'recharge' || tx.transaction_type === 'bill_payment') ? `Paid ${tx.description}` :
                    isSender ? `Paid to ${otherPartyName}` : `Received from ${otherPartyName}`;
                   
      const sign = isSender ? '-' : '+';
      const cssClass = isSender ? 'debit' : 'credit';
      
      const date = new Date(tx.created_at).toLocaleString();

      const item = document.createElement('div');
      item.className = 'lite-txn-item';
      item.innerHTML = `
        <div class="txn-details">
          <p class="title">${title}</p>
          <p class="date">${date}</p>
        </div>
        <div class="txn-amount ${cssClass}">${sign}₹${parseFloat(tx.amount).toFixed(2)}</div>
      `;
      txContainer.appendChild(item);
    });

  } catch (err) {
    console.error('Error fetching child tx:', err);
    txContainer.innerHTML = `<p style="color: red; text-align: center; font-size: 0.9rem;">Could not load transactions</p>`;
  }
}
