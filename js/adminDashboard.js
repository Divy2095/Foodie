import { db, auth } from "./FirebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const restaurantName = document.getElementById('restaurantName');
    const totalDishes = document.getElementById('totalDishes');
    const todayOrders = document.getElementById('todayOrders');
    const totalRevenue = document.getElementById('totalRevenue');
    const rating = document.getElementById('rating');
    const menuGrid = document.getElementById('menuGrid');
    const searchDish = document.getElementById('searchDish');

    // Set initial loading state
    restaurantName.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

    // Check authentication and load restaurant data
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Get restaurant data
            const restaurantId = localStorage.getItem("restaurantid");
            if (!restaurantId) {
                window.location.href = 'adminform.html';
                return;
            }

            try {
                const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId));
                if (restaurantDoc.exists()) {
                    const data = restaurantDoc.data();
                    restaurantName.textContent = data.name || 'Restaurant';
                    
                    // Update stats
                    updateStats(data);
                    
                    // Load menu items
                    if (data.menu && Array.isArray(data.menu)) {
                        displayMenu(data.menu);
                    }
                } else {
                    restaurantName.textContent = 'Restaurant Not Found';
                }
            } catch (error) {
                console.error("Error loading restaurant data:", error);
                restaurantName.textContent = 'Error Loading';
            }
        } else {
            window.location.href = 'adminform.html';
        }
    });    // Handle dish search with debouncing
    if (searchDish) {
        let searchTimeout;
        searchDish.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = e.target.value.toLowerCase();
                const dishes = menuGrid.querySelectorAll('.dish-card');
                
                dishes.forEach(dish => {
                    const name = dish.querySelector('.dish-name').textContent.toLowerCase();
                    const description = dish.querySelector('.dish-description').textContent.toLowerCase();
                    const price = dish.querySelector('.dish-price').textContent.toLowerCase();
                    
                    if (name.includes(searchTerm) || 
                        description.includes(searchTerm) || 
                        price.includes(searchTerm)) {
                        dish.style.display = 'block';
                    } else {
                        dish.style.display = 'none';
                    }
                });

                // Show message if no results found
                const visibleDishes = menuGrid.querySelectorAll('.dish-card[style="display: block"]');
                const noResultsMsg = menuGrid.querySelector('.no-results');
                
                if (visibleDishes.length === 0 && searchTerm) {
                    if (!noResultsMsg) {
                        menuGrid.insertAdjacentHTML('beforeend', `
                            <div class="no-results">
                                <p>No dishes found matching "${searchTerm}"</p>
                            </div>
                        `);
                    }
                } else if (noResultsMsg) {
                    noResultsMsg.remove();
                }
            }, 300); // Debounce delay
        });
    }

    function updateStats(data) {
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
            const revenue = data.orders.reduce((total, order) => total + order.total, 0);
            totalRevenue.textContent = `₹${revenue.toFixed(2)}`;
        }

        // Show rating
        if (data.rating) {
            rating.textContent = `${data.rating.toFixed(1)} ⭐`;
        }
    }    function displayMenu(menu = []) {
        menuGrid.innerHTML = '';
        
        if (!menu || menu.length === 0) {
            menuGrid.innerHTML = `
                <div class="empty-menu">
                    <p>No dishes added yet. Click "Add New Dish" to get started!</p>
                </div>
            `;
            return;
        }

        // Sort menu by most recently added
        const sortedMenu = [...menu].sort((a, b) => 
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        sortedMenu.forEach((dish, index) => {
            const dishCard = document.createElement('div');
            dishCard.className = 'dish-card';
            
            // Create a loading state for the image
            const imageHtml = `
                <div class="dish-image-container">
                    <img src="${dish.imageUrl}" 
                         alt="${dish.name}" 
                         class="dish-image"
                         onload="this.classList.add('loaded')"
                         onerror="this.src='images/placeholder.jpg'">
                    <div class="image-loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
            `;
            
            dishCard.innerHTML = `
                ${imageHtml}
                <div class="dish-info">
                    <h3 class="dish-name">${dish.name}</h3>
                    <p class="dish-description">${dish.description}</p>
                    <div class="dish-price">₹${dish.price.toFixed(2)}</div>
                </div>
                <div class="dish-actions">
                    <button class="edit-btn" onclick="editDish(${index})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="deleteDish(${index})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
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
    };

    window.editDish = async (index) => {
        // Implement edit functionality
        console.log("Edit dish at index:", index);
    };    window.deleteDish = async (index) => {
        if (confirm("Are you sure you want to delete this dish?")) {
            try {
                const restaurantId = localStorage.getItem("restaurantid");
                const restaurantRef = doc(db, "restaurants", restaurantId);
                const restaurantDoc = await getDoc(restaurantRef);
                const menu = restaurantDoc.data().menu;

                if (menu && menu[index]) {
                    const dishToRemove = menu[index];
                    
                    // Show loading state
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

                    await updateDoc(restaurantRef, {
                        menu: arrayRemove(dishToRemove)
                    });

                    // Refresh menu without page reload
                    loadRestaurantData();
                }
            } catch (error) {
                console.error("Error deleting dish:", error);
                alert("Failed to delete dish. Please try again.");
            }
        }
    };
});
