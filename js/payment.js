// Import Firebase modules
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { db, auth } from './FirebaseConfig.js';
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"

let cart = [];
let totalAmount = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (!loadOrderSummary()) {
        // Only redirect if both storage options are empty
        if (!localStorage.getItem('cart') && !sessionStorage.getItem('checkoutCart')) {
            window.location.href = 'index.html';
            return;
        }
    }
    setupFormListeners();
    setupAuthListener();
});

function loadOrderSummary() {
    // Try sessionStorage first, then fallback to localStorage
    let savedCart = sessionStorage.getItem('checkoutCart');
    if (!savedCart) {
        savedCart = localStorage.getItem('cart');
        if (savedCart) {
            // If found in localStorage, save to sessionStorage for consistency
            sessionStorage.setItem('checkoutCart', savedCart);
        } else {
            return false;
        }
    }

    try {
        cart = JSON.parse(savedCart);
        if (!Array.isArray(cart) || cart.length === 0) {
            return false;
        }

        const orderItems = document.getElementById('orderItems');
        const subtotalElem = document.getElementById('subtotal');
        const totalElem = document.getElementById('total');
        const payAmount = document.getElementById('payAmount');

        // Calculate subtotal
        const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const total = subtotal + 40; // Adding delivery fee
        totalAmount = total;

        // Update order summary
        orderItems.innerHTML = cart.map(item => `
            <div class="order-item">
                <img src="${item.imageUrl || 'images/placeholder.jpg'}" 
                     alt="${item.name}" 
                     onerror="this.src='images/placeholder.jpg'">
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">₹${item.price.toFixed(2)}</div>
                    <div class="item-quantity">Quantity: ${item.quantity || 1}</div>
                </div>
                <div class="item-total">
                    ₹${((item.price * (item.quantity || 1))).toFixed(2)}
                </div>
            </div>
        `).join('');

        // Update totals
        subtotalElem.textContent = `₹${subtotal.toFixed(2)}`;
        totalElem.textContent = `₹${total.toFixed(2)}`;
        payAmount.textContent = total.toFixed(2);

        return true;
    } catch (error) {
        console.error('Error loading cart:', error);
        return false;
    }
}

function setupFormListeners() {
    const cardInput = document.getElementById('card');
    const expiryInput = document.getElementById('expiry');
    const form = document.getElementById('paymentForm');
    const backToHomeBtn = document.getElementById('backToHome');

    // Format card number with spaces
    cardInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '');
        if (value.length > 16) value = value.slice(0, 16);
        const parts = value.match(/.{1,4}/g) || [];
        e.target.value = parts.join(' ');
    });

    // Format expiry date
    expiryInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        e.target.value = value;
    });

    // Handle form submission
    form.addEventListener('submit', handlePayment);

    // Handle back to home button
    backToHomeBtn.addEventListener('click', () => {
        sessionStorage.removeItem('checkoutCart');
        sessionStorage.removeItem('checkoutRestaurantId');
        window.location.href = 'index.html';
    });
}

function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
        const payBtn = document.querySelector('button[type="submit"]');
        if (!user) {
            payBtn.disabled = true;
            payBtn.textContent = 'Please Login First';
        } else {
            payBtn.disabled = false;
            payBtn.textContent = 'Pay Now';
        }
    });
}

async function handlePayment(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const modal = document.getElementById('successModal');
    
    try {
        // Disable the submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        // Get current user
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Please login first');
        }

        // Get cart data, trying both storage options
        let cartData = sessionStorage.getItem('checkoutCart') || localStorage.getItem('cart');
        if (!cartData) {
            throw new Error('Cart is empty');
        }

        // Parse cart data
        try {
            cart = JSON.parse(cartData);
            if (!Array.isArray(cart) || cart.length === 0) {
                throw new Error('Invalid cart data');
            }
        } catch (e) {
            throw new Error('Invalid cart data');
        }
        
        // Fetch restaurant data for each cart item
        const processedCart = [];
        for (const item of cart) {            const restId = item.restaurantid;
            if (!restId) {
                // Try to find restaurant by checking each restaurant's menu
                const restaurantsRef = collection(db, "restaurants");
                const restaurantsSnapshot = await getDocs(restaurantsRef);
                let foundRestaurant = null;

                for (const doc of restaurantsSnapshot.docs) {
                    const restaurant = doc.data();
                    if (restaurant.menu && Array.isArray(restaurant.menu)) {
                        const found = restaurant.menu.find(menuItem => 
                            menuItem.name === item.name && 
                            menuItem.price === item.price
                        );
                        if (found) {
                            foundRestaurant = {
                                id: doc.id,
                                ...restaurant
                            };
                            break;
                        }
                    }
                }
                
                if (foundRestaurant) {
                    processedCart.push({
                        ...item,
                        restaurantid: foundRestaurant.id
                    });
                    continue;
                }
                throw new Error(`Could not find restaurant for item: ${item.name}. Please try adding the item to cart again.`);
            }
            processedCart.push(item);
        }
        cart = processedCart;

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        const updatedUserOrders = [];
        const restaurantUpdates = [];

        // Prepare all updates
        for (const item of cart) {
            if (!item.restaurantid) {
                throw new Error('Invalid item data: missing restaurant ID');
            }

            const restRef = doc(db, "restaurants", item.restaurantid);
            const restSnap = await getDoc(restRef);

            if (!restSnap.exists()) {
                throw new Error(`Restaurant ${item.restaurantid} not found`);
            }            const restData = restSnap.data();
            
            // Calculate item total
            const itemTotal = item.price * (item.quantity || 1);

            // Prepare the order item without removing restaurantid yet
            const orderItem = {
                ...item,
                itemTotal: itemTotal,
                orderedBy: user.email,
                orderedAt: new Date().toISOString(),
                userName: user.displayName || user.email,
                orderStatus: 'Paid'
            };

            // Add to user's orders (remove restaurantid here)
            const { restaurantid, ...userOrderItem } = orderItem;
            updatedUserOrders.push({
                ...userOrderItem,
                restaurantName: restData.name
            });

            // Add to restaurant's orders (keep restaurantid)
            restaurantUpdates.push(updateDoc(restRef, {
                orders: arrayUnion(orderItem)
            }));
        }

        // Update user's orders
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            orders: arrayUnion(...updatedUserOrders)
        });

        // Update all restaurants' orders in parallel
        await Promise.all(restaurantUpdates);

        // Clear cart data only after successful update
        sessionStorage.removeItem('checkoutCart');
        sessionStorage.removeItem('checkoutRestaurantId');
        localStorage.removeItem('cart');
        localStorage.removeItem('cartCount');

        // Show success modal
        modal.classList.add('show');
        
        // Redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);

    } catch (error) {
        console.error('Payment error:', error);
        alert(error.message || 'Payment failed. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Pay Now';
    }
}