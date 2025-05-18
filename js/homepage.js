import { db } from './FirebaseConfig.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

// Initialize cart from localStorage
let cart = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Get elements
    const restaurantsGrid = document.getElementById('restaurantsGrid');
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCart = document.getElementById('closeCart');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading restaurants...';
    restaurantsGrid.appendChild(loadingElement);
    
    // Cart functionality
    if (cartBtn && closeCart) {
        cartBtn.addEventListener('click', toggleCart);
        closeCart.addEventListener('click', toggleCart);
    }
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    // Initialize cart
    loadCart();
    
    try {
        // Get all restaurants
        const restaurantsSnapshot = await getDocs(collection(db, "restaurants"));
        restaurantsGrid.innerHTML = ''; // Clear loading
        
        if (restaurantsSnapshot.empty) {
            restaurantsGrid.innerHTML = `
                <div class="no-restaurants">
                    <i class="fas fa-store-alt"></i>
                    <h3>No restaurants available</h3>
                    <p>Please check back later!</p>
                </div>
            `;
            return;
        }
        
        restaurantsSnapshot.forEach((doc) => {
            const restaurant = doc.data();
            const card = createRestaurantCard(restaurant, doc.id);
            restaurantsGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading restaurants:", error);
        restaurantsGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error loading restaurants</h3>
                <p>Please try again later</p>
            </div>
        `;
    }
});

function createRestaurantCard(restaurant, restaurantId) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';

    // Get up to 4 dishes for preview, sort by most popular or recent
    const previewDishes = restaurant.menu 
        ? restaurant.menu
            .slice()
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 4) 
        : [];

    const openingTime = restaurant.open || '09:00';
    const closingTime = restaurant.close || '22:00';
    const isOpen = checkIfOpen(openingTime, closingTime);

    card.innerHTML = `
        <div class="restaurant-header">
            <h3>${restaurant.name}</h3>
            <span class="status ${isOpen ? 'open' : 'closed'}">
                ${isOpen ? 'Open Now' : 'Closed'}
            </span>
        </div>
        <div class="restaurant-info">
            <p><i class="fas fa-map-marker-alt"></i>${restaurant.address || 'Address not available'}</p>
            <p><i class="fas fa-clock"></i>${openingTime} - ${closingTime}</p>
            <p><i class="fas fa-star"></i>${restaurant.rating ? restaurant.rating.toFixed(1) : '0'} Rating</p>
        </div>
        <div class="menu-preview">
            <h4>Popular Dishes</h4>
            ${previewDishes.length > 0 ? `
                <div class="dish-grid">
                    ${previewDishes.map(dish => `
                        <div class="dish-item">
                            <img src="${dish.imageUrl || 'images/placeholder.jpg'}" 
                                 alt="${dish.name}"
                                 onerror="this.src='images/placeholder.jpg'">
                            <h5>${dish.name}</h5>
                            <p class="price">₹${dish.price?.toFixed(2) || '0.00'}</p>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <p class="no-dishes">Menu coming soon!</p>
            `}
            <a href="restaurant.html?id=${restaurantId}" class="view-menu-btn">
                <i class="fas fa-utensils"></i> View Full Menu
            </a>
        </div>
    `;

    return card;
}

function checkIfOpen(openTime, closeTime) {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const [openHours, openMinutes] = openTime.split(':').map(Number);
    const [closeHours, closeMinutes] = closeTime.split(':').map(Number);
    
    const currentTotal = currentHours * 60 + currentMinutes;
    const openTotal = openHours * 60 + openMinutes;
    const closeTotal = closeHours * 60 + closeMinutes;
      return currentTotal >= openTotal && currentTotal <= closeTotal;
}

// Cart Functions
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    cartSidebar.classList.toggle('open');
}

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
    // Update cart count in the UI
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = localStorage.getItem('cartCount') || '0';
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems || !cartCount || !cartTotal) return;

    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartCount.textContent = totalItems;
    
    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add some delicious dishes to your cart</p>
            </div>
        `;
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.imageUrl || 'images/placeholder.jpg'}" 
                 alt="${item.name}" 
                 class="cart-item-image"
                 onerror="this.src='images/placeholder.jpg'">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.name}</h4>
                <p class="cart-item-price">₹${(item.price * (item.quantity || 1)).toFixed(2)}</p>
                <div class="cart-item-actions">
                    <button class="quantity-btn" onclick="updateQuantity('${item.name}', ${(item.quantity || 1) - 1})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="cart-item-quantity">${item.quantity || 1}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.name}', ${(item.quantity || 1) + 1})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    cartTotal.textContent = `₹${total.toFixed(2)}`;
}

function handleCheckout() {
    if (cart.length === 0) {
        alert('Please add items to your cart before checking out');
        return;
    }
    window.location.href = 'payment.html';
}

function updateQuantity(itemName, newQuantity, restaurantId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (newQuantity < 1) {
        cart = cart.filter(item => !(item.name === itemName && item.restaurantId === restaurantId));
    } else {
        const item = cart.find(item => item.name === itemName && item.restaurantId === restaurantId);
        if (item) {
            item.quantity = newQuantity;
        }
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    localStorage.setItem('cartCount', totalItems.toString());

    updateCartDisplay();
}

// Make functions available globally
window.updateQuantity = updateQuantity;
