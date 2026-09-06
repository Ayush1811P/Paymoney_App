/**
 * Main functionality for the PayMoney application
 */

// Initialize main page
document.addEventListener('DOMContentLoaded', async function() {
  // Check if user is logged in and redirect
  if (await isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }
  
  // Show standard auth buttons
  const authButtons = document.querySelector('.auth-buttons');
  if (authButtons) {
    authButtons.innerHTML = `
      <a href="login.html" class="btn btn-outline">Login</a>
      <a href="register.html" class="btn btn-primary">Register</a>
    `;
  }
  
  // Initialize mobile menu toggle
  initMobileMenu();
});