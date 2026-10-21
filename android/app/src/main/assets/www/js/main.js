/**
 * Main functionality for the PayMoney application
 */

// Initialize main page
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  if (isLoggedIn()) {
    // Show logged in navigation
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
      authButtons.innerHTML = `
        <a href="dashboard.html" class="btn btn-primary">Dashboard</a>
      `;
    }
  }
  
  // Initialize mobile menu toggle
  initMobileMenu();
});