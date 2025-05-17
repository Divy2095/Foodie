import { db } from './FirebaseConfig.js';
import {
  doc,
  updateDoc,
  arrayUnion
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

// Import Cloudinary config
import {
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_URL
} from './CloudinaryConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dishForm');
    const submitBtn = form.querySelector('.submit-btn');
    const buttonText = submitBtn.querySelector('.button-text');
    const loadingSpinner = submitBtn.querySelector('.loading-spinner');

    const setLoading = (isLoading) => {
        submitBtn.disabled = isLoading;
        submitBtn.classList.toggle('submitting', isLoading);
        buttonText.style.display = isLoading ? 'none' : 'inline';
        loadingSpinner.style.display = isLoading ? 'inline' : 'none';
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoading(true);

        const dishName = document.getElementById('dishName').value.trim();
  const price = document.getElementById('price').value.trim();
  const description = document.getElementById('description').value.trim();
  const imageFile = document.getElementById('image').files[0];

  if (!imageFile) {
    alert("Please select an image.");
    return;
  }

  // Get restaurant ID from localStorage
  const restaurantId = localStorage.getItem('restaurantid');
  if (!restaurantId) {
    alert("Restaurant ID not found. Cannot add dish.");
    return;
  }

  try {
    // Upload image to Cloudinary
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const cloudRes = await fetch(CLOUDINARY_API_URL, {
      method: 'POST',
      body: formData
    });

    const cloudData = await cloudRes.json();
    const imageUrl = cloudData.secure_url;

    // New dish object
    const newDish = {
      name: dishName,
      price: parseFloat(price),
      description,
      imageUrl
    };

    console.log("Adding dish:", newDish, "to restaurant:", restaurantId);

    // Reference to the specific restaurant document
    const restaurantRef = doc(db, "restaurants", restaurantId);

    // Update the restaurant's menu with the new dish
    await updateDoc(restaurantRef, {
      menu: arrayUnion(newDish)
    });            // Show success message
            form.reset();
            alert("Dish added successfully!");
            
            // Add a small delay before redirect for better UX
            setTimeout(() => {
                window.location.href = 'adminDashboard.html';
            }, 500);

        } catch (error) {
            console.error("Error adding new dish:", error);
            alert(error.message || "Failed to add dish. Please try again.");
        } finally {
            setLoading(false);
        }
    });
});