import { db ,auth} from './FirebaseConfig.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
let cart = [];

// Store restaurantId globally so it's accessible to all functions
let restaurantId;

document.addEventListener('DOMContentLoaded', async () => {
    // Get elements
    const menuGrid = document.getElementById('menuGrid');
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCart = document.getElementById('closeCart');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const menuSearch = document.getElementById('menuSearch');

    // Get restaurant ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    restaurantId = urlParams.get('id');

    if (!restaurantId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Get restaurant data
        const restaurantRef = doc(db, "restaurants", restaurantId);
        const restaurantDoc = await getDoc(restaurantRef);
        
        if (restaurantDoc.exists()) {
            const restaurant = restaurantDoc.data();
            
            // Update restaurant details
            document.getElementById('restaurantName').textContent = restaurant.name;
            document.getElementById('restaurantAddress').textContent = restaurant.address || 'Address not available';
            
            const timing = `${restaurant.open || '09:00'} - ${restaurant.close || '22:00'}`;
            document.getElementById('restaurantTiming').textContent = timing;
            
            document.getElementById('restaurantRating').textContent = restaurant.rating?.toFixed(1) || '0.0';
            
            // Update status badge
            updateStatusBadge(restaurant.open, restaurant.close);
            
            // Display menu
            displayMenu(restaurant.menu || []);
            
            // Setup search functionality
            setupSearch();
        } else {
            alert('Restaurant not found!');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error("Error loading restaurant:", error);
        alert('Error loading restaurant details');
    }

    // Cart functionality
    cartBtn.addEventListener('click', toggleCart);
    closeCart.addEventListener('click', toggleCart);
    checkoutBtn.addEventListener('click', handleCheckout);

    // Initialize cart from localStorage
    loadCart();
});

function displayMenu(menu) {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';

    if (!menu || menu.length === 0) {
        menuGrid.innerHTML = `
            <div class="empty-menu">
                <i class="fas fa-utensils"></i>
                <h3>No items in menu</h3>
                <p>The restaurant hasn't added any dishes yet.</p>
            </div>
        `;
        return;
    }

    menu.forEach(dish => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
            <img src="${dish.imageUrl || 'images/placeholder.jpg'}" 
                 alt="${dish.name}" 
                 class="menu-item-image"
                 onerror="this.src='images/placeholder.jpg'">
            <div class="menu-item-content">
                <div class="menu-item-header">
                    <h3 class="menu-item-title">${dish.name}</h3>
                    <span class="menu-item-price">₹${dish.price?.toFixed(2) || '0.00'}</span>
                </div>
                <p class="menu-item-description">${dish.description || 'No description available'}</p>
                <button class="add-to-cart-btn" onclick="addToCart(${JSON.stringify(dish).replace(/"/g, '&quot;')})">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        `;
        menuGrid.appendChild(menuItem);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('menuSearch');
    const menuItems = document.querySelectorAll('.menu-item');

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        let hasResults = false;

        menuItems.forEach(item => {
            const name = item.querySelector('.menu-item-title').textContent.toLowerCase();
            const description = item.querySelector('.menu-item-description').textContent.toLowerCase();

            if (name.includes(searchTerm) || description.includes(searchTerm)) {
                item.style.display = 'block';
                hasResults = true;
            } else {
                item.style.display = 'none';
            }
        });

        // Show no results message if needed
        const noResults = document.querySelector('.no-results');
        if (!hasResults && searchTerm) {
            if (!noResults) {
                const message = document.createElement('div');
                message.className = 'no-results empty-menu';
                message.innerHTML = `
                    <i class="fas fa-search"></i>
                    <h3>No matching items found</h3>
                    <p>Try a different search term</p>
                `;
                document.getElementById('menuGrid').appendChild(message);
            }
        } else if (noResults) {
            noResults.remove();
        }
    });
}

function updateStatusBadge(openTime, closeTime) {
    const statusBadge = document.getElementById('statusBadge');
    const isOpen = checkIfOpen(openTime, closeTime);
    
    statusBadge.className = `status-badge ${isOpen ? 'open' : 'closed'}`;
    statusBadge.innerHTML = `
        <i class="fas ${isOpen ? 'fa-check-circle' : 'fa-times-circle'}"></i>
        ${isOpen ? 'Open Now' : 'Closed'}
    `;
}

function checkIfOpen(openTime, closeTime) {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const [openHours, openMinutes] = (openTime || '09:00').split(':').map(Number);
    const [closeHours, closeMinutes] = (closeTime || '22:00').split(':').map(Number);
    
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

function saveCart() {
    // Make sure all items have restaurantid and are properly structured
    cart = cart.map(item => {
        // Ensure we have a restaurantid
        if (!item.restaurantid && restaurantId) {
            console.log('Adding missing restaurantid to item:', item.name);
        }
        return {
            ...item,
            restaurantid: item.restaurantid || restaurantId,
            quantity: item.quantity || 1
        };
    });

    // Save to localStorage
    const cartString = JSON.stringify(cart);
    localStorage.setItem('cart', cartString);
    
    // Keep sessionStorage in sync
    sessionStorage.setItem('checkoutCart', cartString);
    
    // Update global cart count
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    localStorage.setItem('cartCount', totalItems.toString());
    
    updateCartDisplay();
}

function addToCart(dish) {
    if (!auth.currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    if (!restaurantId) {
        console.error('No restaurant ID found');
        alert('Error adding to cart. Please try refreshing the page.');
        return;
    }

    // Add restaurantId to the dish object
    const dishWithRestaurant = {
        ...dish,
        restaurantid: restaurantId
    };

    const existingItem = cart.find(item => item.name === dish.name);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
        // Ensure restaurantId is set
        existingItem.restaurantid = restaurantId;
    } else {
        cart.push({ 
            ...dishWithRestaurant,
            quantity: 1
        });
    }
    
    saveCart();
    showAddedToCartMessage(dish.name);
}

function showAddedToCartMessage(itemName) {
    const message = document.createElement('div');
    message.className = 'add-to-cart-message';
    message.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${itemName} added to cart
    `;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 2000);
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.getElementById('cartTotal');
    
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

function updateQuantity(itemName, newQuantity) {
    if (newQuantity < 1) {
        cart = cart.filter(item => item.name !== itemName);
    } else {
        const item = cart.find(item => item.name === itemName);
        if (item) {
            item.quantity = newQuantity;
        }
    }
    saveCart();
}

function handleCheckout() {
    if (cart.length === 0) {
        alert('Please add items to your cart before checking out');
        return;
    }

    // Verify all items have restaurantid
    const validCart = cart.map(item => ({
        ...item,
        restaurantid: item.restaurantid || restaurantId
    }));
    
    // Save validated cart to both storages
    const cartString = JSON.stringify(validCart);
    localStorage.setItem('cart', cartString);
    sessionStorage.setItem('checkoutCart', cartString);
    
    window.location.href = 'payment.html';
}

// Make functions available globally
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
