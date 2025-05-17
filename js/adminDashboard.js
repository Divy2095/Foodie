import { db, auth } from "./FirebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { doc, getDoc, updateDoc, arrayRemove } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const restaurantName = document.getElementById('restaurantName');
    const totalDishes = document.getElementById('totalDishes');
    const todayOrders = document.getElementById('todayOrders');
    const totalRevenue = document.getElementById('totalRevenue');
    const rating = document.getElementById('rating');
    const menuGrid = document.getElementById('menuGrid');
    const searchDish = document.getElementById('searchDish');
    const logoutBtn = document.getElementById('logoutBtn');

    // Set initial loading states
    restaurantName.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    menuGrid.innerHTML = '<div class="loading-menu"><i class="fas fa-spinner fa-spin"></i> Loading menu...</div>';

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
            const restaurantDoc = await getDoc(restaurantRef);
            
            if (restaurantDoc.exists()) {
                const data = restaurantDoc.data();
                restaurantName.textContent = data.name || 'Restaurant';
                
                // Update stats
                updateStats(data);
                
                // Load menu items
                if (data.menu && Array.isArray(data.menu)) {
                    displayMenu(data.menu);
                } else {
                    displayMenu([]);
                }
            } else {
                restaurantName.textContent = 'Restaurant Not Found';
                menuGrid.innerHTML = '<div class="error-message">Restaurant data not found</div>';
            }
        } catch (error) {
            console.error("Error loading restaurant data:", error);
            restaurantName.textContent = 'Error Loading';
            menuGrid.innerHTML = '<div class="error-message">Failed to load menu data</div>';
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

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await auth.signOut();
                localStorage.removeItem("restaurantid");
                window.location.href = 'adminform.html';
            } catch (error) {
                console.error("Error signing out:", error);
                alert("Failed to logout. Please try again.");
            }
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
                new Date(order.timestamp).toDateString() === today
            ).length;
            todayOrders.textContent = todayOrdersCount;
        }

        // Calculate total revenue
        if (data.orders) {
            const revenue = data.orders.reduce((total, order) => total + (order.total || 0), 0);
            totalRevenue.textContent = `₹${revenue.toFixed(2)}`;
        }

        // Show rating
        if (data.rating) {
            rating.textContent = `${data.rating.toFixed(1)} ⭐`;
        }
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
        }        // Sort menu by most recently added
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
            
            dishCard.innerHTML = `                <div class="dish-image-container">
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
            `;            // Add event listeners
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
                
                // Load menu items
                if (data.menu && Array.isArray(data.menu)) {
                    displayMenu(data.menu);
                }
            }
        } catch (error) {
            console.error("Error refreshing dashboard:", error);
        }
    };    window.editDish = async (index) => {
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