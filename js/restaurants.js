import { db } from './FirebaseConfig.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Get restaurant ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const restaurantId = urlParams.get('id');

    if (!restaurantId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Get restaurant data
        const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId));
        
        if (restaurantDoc.exists()) {
            const restaurant = restaurantDoc.data();
            
            // Update restaurant details
            document.getElementById('restaurantName').textContent = restaurant.name;
            document.getElementById('restaurantAddress').textContent = restaurant.address || 'Address not available';
            document.getElementById('restaurantTiming').textContent = restaurant.timing || 'Timing not available';
            document.getElementById('restaurantRating').textContent = restaurant.rating || '0';

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
});

function displayMenu(menu) {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';

    menu.forEach(dish => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
            <img src="${dish.imageUrl}" alt="${dish.name}">
            <div class="menu-item-info">
                <div class="menu-item-header">
                    <h3 class="menu-item-name">${dish.name}</h3>
                    <span class="menu-item-price">₹${dish.price}</span>
                </div>
                <p class="menu-item-description">${dish.description}</p>
                <button class="add-to-cart">
                    <i class="fas fa-shopping-cart"></i>
                    Add to Cart
                </button>
            </div>
        `;
        menuGrid.appendChild(menuItem);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('menuSearch');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const menuItems = document.querySelectorAll('.menu-item');

        menuItems.forEach(item => {
            const name = item.querySelector('.menu-item-name').textContent.toLowerCase();
            const description = item.querySelector('.menu-item-description').textContent.toLowerCase();

            if (name.includes(searchTerm) || description.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
}
