import { db, auth } from "./FirebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { doc, getDoc, updateDoc, arrayRemove, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const restaurantName = document.getElementById('restaurantName');
    const totalDishes = document.getElementById('totalDishes');
    const todayOrders = document.getElementById('todayOrders');
    const totalRevenue = document.getElementById('totalRevenue');
    
    // Navigation elements
    const dashboardLink = document.getElementById('dashboardLink');
    const ordersLink = document.getElementById('ordersLink');
    const menuLink = document.getElementById('menuLink');
    
    // Setup navigation
    function setupNavigation() {
        const sections = {
            dashboard: document.querySelector('.restaurant-info'),
            orders: document.querySelector('.orders-section'),
            menu: document.querySelector('.menu-section')
        };
        
        function showSection(sectionId) {
            // Update active link
            [dashboardLink, ordersLink, menuLink].forEach(link => {
                link.classList.remove('active');
            });
            document.getElementById(sectionId + 'Link')?.classList.add('active');
            
            // Show/hide sections
            Object.entries(sections).forEach(([id, element]) => {
                if (element) {
                    if (id === sectionId) {
                        element.style.display = 'block';
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        element.style.display = id === 'dashboard' ? 'block' : 'none';
                    }
                }
            });
        }

        // Add click handlers
        dashboardLink?.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('dashboard');
        });

        ordersLink?.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('orders');
        });

        menuLink?.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('menu');
        });

        // Check hash on page load
        const hash = window.location.hash.slice(1) || 'dashboard';
        showSection(hash);
    }

    setupNavigation();
    const rating = document.getElementById('rating');
    const menuGrid = document.getElementById('menuGrid');
    const searchDish = document.getElementById('searchDish');
    const logoutBtn = document.getElementById('logoutBtn');
    const ordersGrid = document.getElementById('ordersGrid');
    const orderFilter = document.getElementById('orderFilter');

    // Set initial loading states
    restaurantName.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    menuGrid.innerHTML = '<div class="loading-menu"><i class="fas fa-spinner fa-spin"></i> Loading menu...</div>';
    ordersGrid.innerHTML = '<div class="loading-orders"><i class="fas fa-spinner fa-spin"></i> Loading orders...</div>';

    let unsubscribeOrders = null; // Store the unsubscribe function

    // Check authentication and load restaurant data
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'adminform.html';
            return;
        }

        // Get restaurant data
        const restaurantId = localStorage.getItem('restaurantid');
        if (!restaurantId) {
            window.location.href = 'adminform.html';
            return;
        }

        try {
            const restaurantRef = doc(db, "restaurants", restaurantId);
            
            // Set up real-time orders listener
            unsubscribeOrders = onSnapshot(restaurantRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    restaurantName.textContent = data.name || 'Restaurant';
                    
                    // Update stats and orders
                    updateStats(data);
                    displayOrders(data.orders || []);
                    
                    // Load menu items
                    if (data.menu && Array.isArray(data.menu)) {
                        displayMenu(data.menu);
                    } else {
                        displayMenu([]);
                    }
                } else {
                    restaurantName.textContent = 'Restaurant Not Found';
                    menuGrid.innerHTML = '<div class="error-message">Restaurant data not found</div>';
                    ordersGrid.innerHTML = '<div class="error-message">Orders data not found</div>';
                }
            });

        } catch (error) {
            console.error("Error loading restaurant data:", error);
            restaurantName.textContent = 'Error Loading';
            menuGrid.innerHTML = '<div class="error-message">Failed to load menu data</div>';
            ordersGrid.innerHTML = '<div class="error-message">Failed to load orders data</div>';
        }
    });

    // Handle dish search with debouncing
    if (searchDish) {
        let searchTimeout;
        searchDish.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = e.target.value.toLowerCase();
                const dishes = menuGrid.querySelectorAll('.dish-card');
                let hasVisibleDishes = false;
                
                dishes.forEach(dish => {
                    const name = dish.querySelector('.dish-name').textContent.toLowerCase();
                    const description = dish.querySelector('.dish-description').textContent.toLowerCase();
                    const price = dish.querySelector('.dish-price').textContent.toLowerCase();
                    
                    if (name.includes(searchTerm) || 
                        description.includes(searchTerm) || 
                        price.includes(searchTerm)) {
                        dish.style.display = 'block';
                        hasVisibleDishes = true;
                    } else {
                        dish.style.display = 'none';
                    }
                });

                // Show/hide no results message
                const noResultsMsg = menuGrid.querySelector('.no-results');
                if (!hasVisibleDishes && searchTerm) {
                    if (!noResultsMsg) {
                        const message = document.createElement('div');
                        message.className = 'no-results';
                        message.innerHTML = `<p>No dishes found matching "${searchTerm}"</p>`;
                        menuGrid.appendChild(message);
                    }
                } else if (noResultsMsg) {
                    noResultsMsg.remove();
                }
            }, 300);
        });
    }

    // Handle order filtering
    if (orderFilter) {
        orderFilter.addEventListener('change', () => {
            const restaurantId = localStorage.getItem('restaurantid');
            if (!restaurantId) return;

            refreshDashboard();
        });
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                if (unsubscribeOrders) {
                    unsubscribeOrders(); // Clean up the real-time listener
                }
                await auth.signOut();
                localStorage.removeItem("restaurantid");
                window.location.href = 'adminform.html';
            } catch (error) {
                console.error("Error signing out:", error);
                alert("Failed to logout. Please try again.");
            }
        });
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function updateStats(data) {
        // Update total dishes
        if (data.menu) {
            totalDishes.textContent = data.menu.length;
        }
        
        // Calculate today's orders
        const today = new Date().toDateString();
        if (data.orders) {
            const todayOrdersCount = data.orders.filter(order => 
                new Date(order.orderedAt).toDateString() === today
            ).length;
            todayOrders.textContent = todayOrdersCount;
        }

        // Calculate total revenue including delivery fees
        if (data.orders) {
            const revenue = data.orders.reduce((total, order) => {
                // If order has total with delivery fee, use that
                if (order.total) {
                    return total + parseFloat(order.total);
                }
                // If order has itemTotal, add delivery fee
                if (order.itemTotal) {
                    return total + parseFloat(order.itemTotal) + (order.deliveryFee || 40);
                }
                // Fallback to calculating from price and quantity
                const orderAmount = order.price * (order.quantity || 1);
                return total + orderAmount + (order.deliveryFee || 40);
            }, 0);
            totalRevenue.textContent = `₹${revenue.toFixed(2)}`;
        }

        // Show rating
        if (data.rating) {
            rating.textContent = `${data.rating.toFixed(1)} ⭐`;
        }
    }

    function displayOrders(orders = []) {
        if (!orders.length) {
            ordersGrid.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-receipt" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>No orders yet</h3>
                    <p>New orders will appear here</p>
                </div>
            `;
            return;
        }

        // Filter and sort orders
        const filterValue = orderFilter.value;
        const now = new Date();
        const filteredOrders = orders.filter(order => {
            const orderDate = new Date(order.orderedAt);
            switch (filterValue) {
                case 'today':
                    return orderDate.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return orderDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return orderDate >= monthAgo;
                default:
                    return true;
            }
        }).sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));

        // Display orders
        ordersGrid.innerHTML = filteredOrders.map(order => {
            // Calculate total including delivery fee
            const itemTotal = order.itemTotal || (order.price * (order.quantity || 1));
            const total = order.total || (itemTotal + (order.deliveryFee || 40));

            return `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-id">#${order.orderId || Math.random().toString(36).substr(2, 9)}</span>
                        <span class="order-status status-${order.orderStatus?.toLowerCase() || 'paid'}">${order.orderStatus || 'Paid'}</span>
                    </div>                    <div class="order-info">
                        <div class="order-customer">
                            <i class="fas fa-user"></i>
                            <span>${order.userName || order.orderedBy.split('@')[0] || 'Anonymous'}</span>
                        </div>
                        <div class="order-contact">
                            <i class="fas fa-phone"></i>
                            <span>${order.deliveryInfo?.phone || 'No phone provided'}</span>
                        </div>
                        <div class="order-address">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${order.deliveryInfo?.address || 'No address provided'}</span>
                            ${order.deliveryInfo?.landmark ? `<br><small>(Landmark: ${order.deliveryInfo.landmark})</small>` : ''}
                        </div>
                        <div class="order-datetime">
                            <i class="fas fa-clock"></i>
                            <span>${formatDate(order.orderedAt)}</span>
                        </div>
                        <div class="delivery-status">
                            <i class="fas fa-truck"></i>
                            <span class="status-${order.deliveryInfo?.deliveryStatus?.toLowerCase() || 'pending'}">${order.deliveryInfo?.deliveryStatus || 'Pending'}</span>
                        </div>
                    </div>
                    <div class="order-items">
                        <div class="order-item">
                            <span>${order.name} × ${order.quantity || 1}</span>
                            <span>₹${itemTotal.toFixed(2)}</span>
                        </div>
                        <div class="order-delivery">
                            <span>Delivery Fee</span>
                            <span>₹${(order.deliveryFee || 40).toFixed(2)}</span>
                        </div>
                        <div class="order-total">
                            <span>Total</span>
                            <span>₹${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function displayMenu(menu = []) {
        menuGrid.innerHTML = '';
        
        if (!menu || menu.length === 0) {
            menuGrid.innerHTML = `
                <div class="empty-menu">
                    <i class="fas fa-utensils" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>No dishes added yet</h3>
                    <p>Click "Add New Dish" to create your first menu item!</p>
                </div>
            `;
            return;
        }

        // Sort menu by most recently added
        const sortedMenu = [...menu].sort((a, b) => 
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        // Create a map of sorted indices to original indices
        const indexMap = menu.reduce((map, dish, index) => {
            const sortedIndex = sortedMenu.findIndex(d => d === dish);
            map[sortedIndex] = index;
            return map;
        }, {});

        sortedMenu.forEach((dish, sortedIndex) => {
            const dishCard = document.createElement('div');
            dishCard.className = 'dish-card';
            
            dishCard.innerHTML = `
                <div class="dish-image-container">
                    <img src="${dish.imageUrl || 'images/placeholder.jpg'}" 
                         alt="${dish.name}" 
                         class="dish-image"
                         onerror="this.src='images/placeholder.jpg'">
                </div>
                <div class="dish-info">
                    <h3 class="dish-name">${dish.name}</h3>
                    <p class="dish-description">${dish.description || 'No description available'}</p>
                    <div class="dish-price">₹${dish.price?.toFixed(2) || '0.00'}</div>
                </div>
                <div class="dish-actions">
                    <button class="edit-btn">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            
            // Add event listeners
            const editBtn = dishCard.querySelector('.edit-btn');
            const deleteBtn = dishCard.querySelector('.delete-btn');
            
            // Use the original index from our map
            const originalIndex = indexMap[sortedIndex];
            editBtn.addEventListener('click', () => window.editDish(originalIndex));
            deleteBtn.addEventListener('click', () => window.deleteDish(originalIndex));
            
            menuGrid.appendChild(dishCard);
        });
    }

    // Make these functions available globally
    window.refreshDashboard = async () => {
        try {
            const restaurantId = localStorage.getItem("restaurantid");
            if (!restaurantId) return;

            const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId));
            if (restaurantDoc.exists()) {
                const data = restaurantDoc.data();
                
                // Update stats
                updateStats(data);
                
                // Load menu items and orders
                if (data.menu && Array.isArray(data.menu)) {
                    displayMenu(data.menu);
                }
                if (data.orders && Array.isArray(data.orders)) {
                    displayOrders(data.orders);
                }
            }
        } catch (error) {
            console.error("Error refreshing dashboard:", error);
        }
    };

    window.editDish = async (index) => {
        try {
            const restaurantId = localStorage.getItem("restaurantid");
            if (!restaurantId) return;

            const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId));
            const menu = restaurantDoc.data().menu;
            
            if (menu && menu[index]) {
                const dishToEdit = menu[index];
                // Store both index and dish data
                localStorage.setItem('isEditing', 'true');
                localStorage.setItem('editDishIndex', index.toString());
                localStorage.setItem('editDishData', JSON.stringify(dishToEdit));
                window.location.href = 'addNewDish.html';
            }
        } catch (error) {
            console.error("Error preparing dish for edit:", error);
            alert("Failed to edit dish. Please try again.");
        }
    };

    window.deleteDish = async (index) => {
        if (!confirm("Are you sure you want to delete this dish?")) {
            return;
        }

        try {
            const restaurantId = localStorage.getItem("restaurantid");
            const restaurantRef = doc(db, "restaurants", restaurantId);
            const restaurantDoc = await getDoc(restaurantRef);
            const menu = restaurantDoc.data().menu;

            if (menu && menu[index]) {
                const dishCard = menuGrid.querySelectorAll('.dish-card')[index];
                if (dishCard) {
                    dishCard.classList.add('deleting');
                    dishCard.innerHTML += `
                        <div class="delete-overlay">
                            <i class="fas fa-spinner fa-spin"></i>
                            Deleting...
                        </div>
                    `;
                }

                const dishToRemove = menu[index];

                await updateDoc(restaurantRef, {
                    menu: arrayRemove(dishToRemove)
                });

                await refreshDashboard();
            }
        } catch (error) {
            console.error("Error deleting dish:", error);
            alert("Failed to delete dish. Please try again.");
        }
    };
});