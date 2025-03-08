// signup.js - Handles user registration

document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    const alertBox = document.getElementById('signup-alert');
    
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Clear previous alerts
        alertBox.classList.remove('alert-danger', 'alert-success', 'd-none');
        
        // Validate inputs
        if (username.length < 3) {
            showAlert('Username must be at least 3 characters long.', 'danger');
            return;
        }
        
        if (password.length < 8) {
            showAlert('Password must be at least 8 characters long.', 'danger');
            return;
        }
        
        if (password !== confirmPassword) {
            showAlert('Passwords do not match.', 'danger');
            return;
        }
        
        // Create registration data
        const registrationData = new FormData();
        registrationData.append('username', username);
        registrationData.append('password', password);
        
        // Show loading state
        const submitButton = signupForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Creating account...';
        
        // Send registration request via fetch
        // Since our backend expects PUT for registration, we'll use XMLHttpRequest
        // as fetch doesn't make it easy to set the body for PUT requests
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', 'backend/auth.php');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onload = function() {
            // Reset button
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    
                    if (response.success) {
                        // Registration successful
                        showAlert('Account created successfully! Redirecting to login...', 'success');
                        
                        // Reset form
                        signupForm.reset();
                        
                        // Redirect to login page after a delay
                        setTimeout(function() {
                            window.location.href = 'index.html';
                        }, 2000);
                    } else {
                        // Registration failed
                        showAlert('Registration failed: ' + response.message, 'danger');
                    }
                } catch (error) {
                    console.error('Error parsing response:', error);
                    showAlert('An unexpected error occurred. Please try again.', 'danger');
                }
            } else {
                // HTTP error
                showAlert('Error: ' + xhr.status, 'danger');
            }
        };
        
        xhr.onerror = function() {
            // Reset button
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            
            // Network error
            showAlert('A network error occurred. Please check your connection and try again.', 'danger');
        };
        
        // Convert the data to URL encoded string
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);
        
        // Send the request
        xhr.send(params.toString());
    });
    
    // Function to show alert messages
    function showAlert(message, type) {
        alertBox.textContent = message;
        alertBox.classList.remove('d-none', 'alert-danger', 'alert-success');
        alertBox.classList.add('alert-' + type);
    }
});
