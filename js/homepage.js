import { db } from './FirebaseConfig.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    const restaurantsGrid = document.getElementById('restaurantsGrid');
    
    try {
        // Get all restaurants
        const restaurantsSnapshot = await getDocs(collection(db, "restaurants"));
        
        restaurantsSnapshot.forEach((doc) => {
            const restaurant = doc.data();
            const card = createRestaurantCard(restaurant, doc.id);
            restaurantsGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading restaurants:", error);
    }
});

function createRestaurantCard(restaurant, restaurantId) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';

    // Get up to 4 dishes for preview
    const previewDishes = restaurant.menu ? restaurant.menu.slice(0, 4) : [];

    card.innerHTML = `
        <div class="restaurant-header">
            <h3>${restaurant.name}</h3>
        </div>
        <div class="restaurant-info">
            <p><i class="fas fa-map-marker-alt"></i>${restaurant.address || 'Address not available'}</p>
            <p><i class="fas fa-clock"></i>${restaurant.timing || 'Timing not available'}</p>
            <p><i class="fas fa-star"></i>${restaurant.rating || '0'} Rating</p>
        </div>
        <div class="menu-preview">
            <h4>Popular Dishes</h4>
            <div class="dish-grid">
                ${previewDishes.map(dish => `
                    <div class="dish-item">
                        <img src="${dish.imageUrl}" alt="${dish.name}">
                        <h5>${dish.name}</h5>
                        <p class="price">₹${dish.price}</p>
                    </div>
                `).join('')}
            </div>
            <a href="restaurants.html?id=${restaurantId}" class="view-menu-btn">
                View Full Menu
            </a>
        </div>
    `;

    return card;
}
