import { auth } from "./FirebaseConfig.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // Handle password visibility toggle
    const togglePasswordButton = document.querySelector('.toggle-password');
    togglePasswordButton.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    // Handle remember me checkbox
    const rememberMe = document.getElementById('remember');
    const savedEmail = localStorage.getItem('rememberedEmail');
    
    if (savedEmail) {
        document.getElementById('email').value = savedEmail;
        rememberMe.checked = true;
    }

    // Handle login form submission
    const loginBtn = document.getElementById('loginBtn');
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Basic validation
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Show loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Handle remember me
            if (rememberMe.checked) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            // Store user info in localStorage
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userId', user.uid);
            localStorage.setItem('userName', user.displayName);
            localStorage.setItem('userType', 'customer'); // You might want to get this from Firestore

            // Show success message
            alert('Login successful!');

            // Redirect to home page
            window.location.href = 'index.html';

        } catch (error) {
            console.error("Login error:", error);
            let errorMessage = 'Failed to login. ';

            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage += 'Invalid email format.';
                    break;
                case 'auth/user-disabled':
                    errorMessage += 'This account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    errorMessage += 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage += 'Invalid password.';
                    break;
                default:
                    errorMessage += error.message;
            }

            alert(errorMessage);

            // Reset button state
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Login</span><i class="fas fa-arrow-right"></i>';
        }
    });
});
