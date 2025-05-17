import { auth } from "./FirebaseConfig.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    const cartIcon = document.querySelector('.cart-icon');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    const cartCount = document.querySelector('.cart-count');
    const userMenuBtn = document.getElementById('userMenuBtn');

    // Check authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            authButtons.style.display = 'none';
            userMenu.style.display = 'block';
            cartIcon.style.display = 'block';
            userName.textContent = user.displayName || 'User';

            // Get cart count from localStorage or set to 0
            cartCount.textContent = localStorage.getItem('cartCount') || '0';
        } else {
            // User is signed out
            authButtons.style.display = 'block';
            userMenu.style.display = 'none';
            cartIcon.style.display = 'none';
        }
    });

    // Toggle dropdown menu
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = document.querySelector('.dropdown-menu');
            dropdown.classList.toggle('show');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            const dropdown = document.querySelector('.dropdown-menu');
            if (dropdown && dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    });

    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                localStorage.removeItem('userType');
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Error signing out:', error);
                alert('Error signing out. Please try again.');
            }
        });
    }
});
