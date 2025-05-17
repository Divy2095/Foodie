import { auth, db } from "./FirebaseConfig.js";
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Helper functions for validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorDiv = input.parentElement.querySelector('.error-message') || 
                    document.createElement('div');
    
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    if (!input.parentElement.querySelector('.error-message')) {
        input.parentElement.appendChild(errorDiv);
    }
    
    input.classList.add('error');
}

function validateInput(input) {
    const errorDiv = input.parentElement.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
    input.classList.remove('error');
}

document.addEventListener('DOMContentLoaded', () => {
    // Handle password visibility toggle
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // Handle signup form submission
    console.log("SignupJS loaded"); // Debug log
    const signupBtn = document.getElementById('signupBtn');
    console.log("SignupBtn:", signupBtn); // Debug log
    const signupForm = document.getElementById('signupForm');
    console.log("SignupForm:", signupForm); // Debug log
    
    // Add input validation feedback
    const inputs = signupForm.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            validateInput(input);
        });
    });
    
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsCheckbox = document.querySelector('input[type="checkbox"]');
        
        // Enhanced validation
        let isValid = true;
        
        if (!name) {
            showError('name', 'Name is required');
            isValid = false;
        } else if (name.length < 2) {
            showError('name', 'Name must be at least 2 characters long');
            isValid = false;
        }
        
        if (!email) {
            showError('email', 'Email is required');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError('email', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (!password) {
            showError('password', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            showError('password', 'Password must be at least 6 characters long');
            isValid = false;
        } else if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
            showError('password', 'Password must contain both letters and numbers');
            isValid = false;
        }
        
        if (!confirmPassword) {
            showError('confirmPassword', 'Please confirm your password');
            isValid = false;
        } else if (password !== confirmPassword) {
            showError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }
        
        if (!termsCheckbox.checked) {
            alert('Please accept the Terms of Service and Privacy Policy');
            isValid = false;
        }
        
        if (!isValid) return;

        // Show loading state
        signupBtn.disabled = true;
        signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        
        try {
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update user profile
            await updateProfile(user, {
                displayName: name
            });
            
            // Store user data in Firestore
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: email,
                createdAt: new Date().toISOString(),
                type: 'customer',
                orders: [],
                favorites: []
            });
            
            // Store user info in localStorage
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userId', user.uid);
            localStorage.setItem('userName', name);
            localStorage.setItem('userType', 'customer');
            
            // Show success message
            alert('Account created successfully!');
            
            // Redirect to home page
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error("Signup error:", error);
            let errorMessage = 'Failed to create account. ';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage += 'An account with this email already exists.';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'Invalid email format.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage += 'Email/password accounts are not enabled.';
                    break;
                case 'auth/weak-password':
                    errorMessage += 'Please choose a stronger password.';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            alert(errorMessage);
            
            // Reset button state
            signupBtn.disabled = false;
            signupBtn.innerHTML = '<span>Create Account</span><i class="fas fa-arrow-right"></i>';
        }
    });
});
