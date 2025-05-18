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
            if (authButtons) authButtons.style.cssText = 'display: none !important';
            if (userMenu) userMenu.style.cssText = 'display: block !important';
            if (cartIcon) cartIcon.style.cssText = 'display: block !important';
            if (userName) userName.textContent = user.displayName || 'User';

            // Get cart count from localStorage or set to 0
            if (cartCount) cartCount.textContent = localStorage.getItem('cartCount') || '0';
        } else {
            // User is signed out
            if (authButtons) authButtons.style.cssText = 'display: block !important';
            if (userMenu) userMenu.style.cssText = 'display: none !important';
            if (cartIcon) cartIcon.style.cssText = 'display: none !important';
        }
    });    // Toggle dropdown menu
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const dropdown = document.querySelector('.dropdown-menu');
            dropdown.classList.toggle('show');
        });
    }

    // Handle My Orders click
    const myOrders = document.getElementById('myOrders');
    if (myOrders) {
        myOrders.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'orders.html';
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.querySelector('.dropdown-menu');
        const userMenu = document.querySelector('.user-menu');
        
        if (dropdown && !userMenu.contains(e.target)) {
            dropdown.classList.remove('show');
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
