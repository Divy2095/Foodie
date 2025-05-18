import { db, auth } from "./FirebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const ordersGrid = document.getElementById('ordersGrid');
    const orderFilter = document.getElementById('orderFilter');

    // Set initial loading state
    ordersGrid.innerHTML = `
        <div class="loading-orders">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading your orders...</p>
        </div>
    `;

    // Check authentication and load user's orders
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                throw new Error('User document not found');
            }

            const userData = userDoc.data();
            displayOrders(userData.orders || []);

            // Setup filter functionality
            orderFilter.addEventListener('change', () => {
                displayOrders(userData.orders || []);
            });

        } catch (error) {
            console.error("Error loading orders:", error);
            ordersGrid.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error loading orders</h3>
                    <p>Please try refreshing the page</p>
                </div>
            `;
        }
    });

    function displayOrders(orders = []) {
        if (!orders.length) {
            ordersGrid.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>No orders yet</h3>
                    <p>When you make an order, it will appear here</p>
                </div>
            `;
            return;
        }

        // Filter orders based on selected timeframe
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

        ordersGrid.innerHTML = filteredOrders.map(order => {
            const itemTotal = order.itemTotal || (order.price * (order.quantity || 1));
            const total = order.total || (itemTotal + (order.deliveryFee || 40));

            return `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-id">#${order.orderId || Math.random().toString(36).substr(2, 9)}</span>
                        <span class="order-status status-${order.orderStatus?.toLowerCase() || 'paid'}">${order.orderStatus || 'Paid'}</span>
                    </div>
                    
                    <div class="order-info">
                        <div class="order-restaurant">
                            <i class="fas fa-store"></i>
                            <span>${order.restaurantName || 'Restaurant'}</span>
                        </div>
                        <div class="delivery-status">
                            <i class="fas fa-truck"></i>
                            <span>${order.deliveryInfo?.deliveryStatus || 'Pending'}</span>
                        </div>
                        <div class="order-address">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>
                                ${order.deliveryInfo?.address || 'No address provided'}
                                ${order.deliveryInfo?.landmark ? `<br><small>(Landmark: ${order.deliveryInfo.landmark})</small>` : ''}
                            </span>
                        </div>
                        <div class="order-datetime">
                            <i class="fas fa-clock"></i>
                            <span>${formatDate(order.orderedAt)}</span>
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

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        // Format time
        const timeStr = date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        // If the order is from today, show "Today at [time]"
        if (isToday) {
            return `Today at ${timeStr}`;
        }
        
        // For orders within the current year, show "Month Day at [time]"
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric'
            }) + ` at ${timeStr}`;
        }
        
        // For older orders, show full date
        return date.toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        }) + ` at ${timeStr}`;
    }
});
