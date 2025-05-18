import { db } from './FirebaseConfig.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    const restaurantsGrid = document.getElementById('restaurantsGrid');
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading restaurants...';
    restaurantsGrid.appendChild(loadingElement);
    
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
