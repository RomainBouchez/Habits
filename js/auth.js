// auth.js - Handles user authentication

// Check if user is logged in
function checkAuth() {
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    
    if (userId && username) {
        // User is logged in
        document.getElementById('login-section').classList.add('d-none');
        document.getElementById('dashboard-section').classList.remove('d-none');
        
        // Update UI with username
        const navbarBrand = document.querySelector('.navbar-brand');
        navbarBrand.textContent = `Habit Tracker | ${username}`;
        
        return true;
    } else {
        // User is not logged in
        document.getElementById('login-section').classList.remove('d-none');
        document.getElementById('dashboard-section').classList.add('d-none');
        document.getElementById('habits-section').classList.add('d-none');
        document.getElementById('stats-section').classList.add('d-none');
        
        return false;
    }
}

// Add login alert div if it doesn't exist
if (!document.getElementById('login-alert')) {
    const loginForm = document.getElementById('login-form');
    const alertDiv = document.createElement('div');
    alertDiv.id = 'login-alert';
    alertDiv.className = 'alert mt-3 d-none';
    loginForm.appendChild(alertDiv);
}

// Function to show alert
function showLoginAlert(message, type) {
    const alertDiv = document.getElementById('login-alert');
    alertDiv.textContent = message;
    alertDiv.classList.remove('d-none', 'alert-danger', 'alert-success');
    alertDiv.classList.add('alert-' + type);
}

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Create form data
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Logging in...';
    
    // Send login request
    fetch('backend/auth.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        
        if (data.success) {
            // Store user info in localStorage
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('username', data.username);
            
            // Show success message
            showLoginAlert('Login successful!', 'success');
            
            // Update UI
            checkAuth();
            
            // Load dashboard data
            loadTodayHabits();
        } else {
            // Show error message
            showLoginAlert('Login failed: ' + data.message, 'danger');
        }
    })
    .catch(error => {
        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        
        console.error('Error:', error);
        showLoginAlert('An error occurred. Please try again.', 'danger');
    });
});

// Handle logout
document.getElementById('logout-link').addEventListener('click', function(e) {
    e.preventDefault();
    
    // Clear localStorage
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    
    // Update UI
    checkAuth();
    
    // Show message
    alert('You have been logged out.');
});

// Check authentication status when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});