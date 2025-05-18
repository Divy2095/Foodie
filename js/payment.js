// Load cart items from localStorage
let cart = [];
let totalAmount = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadOrderSummary();
    setupFormListeners();
});

function loadOrderSummary() {
    const savedCart = localStorage.getItem('cart');
    if (!savedCart) {
        window.location.href = 'index.html';
        return;
    }

    cart = JSON.parse(savedCart);
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
        // Clear cart and redirect to home
        localStorage.removeItem('cart');
        localStorage.removeItem('cartCount');
        window.location.href = 'index.html';
    });
}

async function handlePayment(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Disable the submit button to prevent double submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Show success modal with animation
    const modal = document.getElementById('successModal');
    modal.classList.add('show');

    // Play success sound (optional)
    const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVgANTU1NTU1Q0NDQ0NDUFBQUFBQXl5eXl5ea2tra2tra3l5eXl5eYaGhoaGhpSUlJSUlKGhoaGhoaGvr6+vr6+8vLy8vLzKysrKysrX19fX19fX5eXl5eXl8vLy8vLy////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQCgAAAAAAAAAVY82AhbwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxHYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxLEAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV').play().catch(() => {});
}