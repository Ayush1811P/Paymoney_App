/**
 * Help & Support functionality for the PayMoney application
 */

document.addEventListener('DOMContentLoaded', async function() {
  if (!(await requireAuth())) return;
  
  initFaqAccordion();
  initTicketForm();
  initChatWidget();
});

/* FAQ Accordion Toggle */
function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const isActive = item.classList.contains('active');
      
      // Close all other FAQs
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      
      // Toggle current FAQ
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* Raise Ticket Form Submission */
function initTicketForm() {
  const form = document.getElementById('ticketForm');
  const successCard = document.getElementById('ticketSuccessCard');
  const downloadBtn = document.getElementById('downloadTicketReceiptBtn');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const categorySelect = document.getElementById('ticketCategory');
      const categoryText = categorySelect.options[categorySelect.selectedIndex].text;
      const refId = document.getElementById('ticketReferenceId').value.trim();
      const desc = document.getElementById('ticketDescription').value.trim();
      
      const ticketId = 'TKT' + Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
      
      // Populate receipt
      document.getElementById('successTicketId').textContent = ticketId;
      document.getElementById('successTicketCategory').textContent = categoryText;
      
      // Toggle card
      form.classList.add('hidden');
      successCard.classList.remove('hidden');
      
      showNotification('Support ticket submitted successfully!');
    });
  }
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadTicketReceipt);
  }
}

async function downloadTicketReceipt() {
  const downloadBtn = document.getElementById('downloadTicketReceiptBtn');
  if (!downloadBtn) return;
  
  const originalText = downloadBtn.textContent;
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Generating...';
  
  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    
    const card = document.getElementById('ticketSuccessCard');
    
    // Temporarily hide download button so it doesn't show in PNG
    downloadBtn.style.display = 'none';
    const originalBg = card.style.background;
    card.style.background = '#ffffff';
    card.style.padding = '24px';
    
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    downloadBtn.style.display = 'block';
    card.style.background = originalBg;
    card.style.padding = '';
    
    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `PayMoney_SupportTicket_${document.getElementById('successTicketId').textContent}.png`;
    link.href = imgData;
    link.click();
    
    showNotification('Ticket receipt downloaded successfully!');
  } catch (error) {
    console.error('Error generating ticket receipt:', error);
    showNotification('Failed to generate ticket receipt.', 'error');
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = originalText;
  }
}

/* Chatbot Widget Simulation */
function initChatWidget() {
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const quickReplies = document.querySelectorAll('.quick-reply-btn');
  
  const floatingChatBtn = document.getElementById('floatingChatBtn');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const chatWidget = document.querySelector('.chat-widget');
  
  if (!chatMessages || !chatInput || !chatSendBtn) return;
  
  // Mobile Floating Chat toggle
  if (floatingChatBtn && chatWidget) {
    floatingChatBtn.addEventListener('click', () => {
      chatWidget.classList.add('active');
      floatingChatBtn.style.display = 'none';
      setTimeout(scrollToBottom, 100);
    });
  }
  
  if (closeChatBtn && chatWidget) {
    closeChatBtn.addEventListener('click', () => {
      chatWidget.classList.remove('active');
      if (floatingChatBtn) {
        floatingChatBtn.style.display = '';
      }
    });
  }
  
  // Send message on click
  chatSendBtn.addEventListener('click', sendUserMessage);
  
  // Send message on Enter keypress
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendUserMessage();
    }
  });
  
  // Handle quick replies
  quickReplies.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.query;
      addUserMessage(text);
      triggerBotResponse(text);
    });
  });
}

function sendUserMessage() {
  const chatInput = document.getElementById('chatInput');
  const text = chatInput.value.trim();
  
  if (!text) return;
  
  addUserMessage(text);
  chatInput.value = '';
  
  triggerBotResponse(text);
}

function addUserMessage(text) {
  const chatMessages = document.getElementById('chatMessages');
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.textContent = text;
  chatMessages.appendChild(userBubble);
  scrollToBottom();
}

function addBotMessage(text) {
  const chatMessages = document.getElementById('chatMessages');
  const botBubble = document.createElement('div');
  botBubble.className = 'chat-bubble bot';
  botBubble.innerHTML = text; // innerHTML allows links or linebreaks
  chatMessages.appendChild(botBubble);
  scrollToBottom();
}

function scrollToBottom() {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function triggerBotResponse(userText) {
  const chatMessages = document.getElementById('chatMessages');
  
  // Create typing indicator
  const typingBubble = document.createElement('div');
  typingBubble.className = 'chat-bubble bot typing';
  typingBubble.id = 'botTypingIndicator';
  typingBubble.innerHTML = 'Typing <span></span><span></span><span></span>';
  
  chatMessages.appendChild(typingBubble);
  scrollToBottom();
  
  const text = userText.toLowerCase();
  let botReply = '';
  
  // Simple parser
  if (text.includes('recharge') || text.includes('dth') || text.includes('broadband') || text.includes('failed') || text.includes('deducted')) {
    botReply = `If your recharge failed but money was deducted:<br>
    1. Check your transaction list on the Wallet page for payment status.<br>
    2. Operator updates might take up to 2 hours. If it has been longer, you can download your receipt and raise a support ticket on the left panel.<br>
    3. Be assured, failed recharges are auto-refunded to your wallet within 24-48 hours.`;
  } else if (text.includes('pin') || text.includes('reset')) {
    botReply = `To reset your UPI PIN:<br>
    1. Navigate to the UPI tab on top.<br>
    2. Under linked accounts, select "Reset UPI PIN".<br>
    3. Input your debit card details (last 6 digits and expiry).<br>
    4. Set your new 4-digit UPI PIN and verify.`;
  } else if (text.includes('cooldown') || text.includes('add money') || text.includes('limit')) {
    botReply = `For security reasons, PayMoney has limits on Add Money transactions:<br>
    1. You can only Add Money once per hour (cooldown limit).<br>
    2. The maximum single transactional Add Money limit is ₹50,000.<br>
    Please wait 1 hour or select another payment option.`;
  } else if (text.includes('kyc') || text.includes('profile') || text.includes('setting')) {
    botReply = `To complete your KYC or update settings, head to the Profile section from the top navigation. There, you can update your avatar, name, and check your security status.`;
  } else if (text.includes('hi') || text.includes('hello') || text.includes('hey') || text.includes('help')) {
    botReply = `Hello! How can I help you? You can choose a quick reply above or ask about transaction status, wallet balance additions, UPI, or KYC.`;
  } else {
    botReply = `I didn't quite capture that. You can raise a support ticket using the "Raise a Ticket" form on the left, or ask another query about UPI, recharges, or wallet cooldowns.`;
  }
  
  // Simulate natural delay (900ms)
  setTimeout(() => {
    const indicator = document.getElementById('botTypingIndicator');
    if (indicator) indicator.remove();
    
    addBotMessage(botReply);
  }, 900);
}
