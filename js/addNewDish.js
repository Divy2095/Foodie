import { db } from './FirebaseConfig.js';
import {
  doc,
  getDoc,
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
    const pageTitle = document.querySelector('.title');

    // Check if we're in edit mode
    const isEditing = localStorage.getItem('isEditing') === 'true';
    
    // Clear edit mode if we came from "Add New Dish" button
    const params = new URLSearchParams(window.location.search);
    if (params.has('new')) {
        localStorage.removeItem('isEditing');
        localStorage.removeItem('editDishIndex');
        localStorage.removeItem('editDishData');
    }

    if (isEditing) {
        // Update UI for edit mode
        pageTitle.textContent = 'Edit Dish';
        buttonText.textContent = 'Update Dish';
        
        // Pre-fill form with existing data
        const dishData = JSON.parse(localStorage.getItem('editDishData'));
        if (dishData) {
            document.getElementById('dishName').value = dishData.name || '';
            document.getElementById('price').value = dishData.price || '';
            document.getElementById('description').value = dishData.description || '';
            
            // Make image optional in edit mode
            document.getElementById('image').removeAttribute('required');
        }
    }

    // Function to handle loading state
    const setLoading = (isLoading) => {
        submitBtn.disabled = isLoading;
        submitBtn.classList.toggle('submitting', isLoading);
        buttonText.style.display = isLoading ? 'none' : 'block';
        loadingSpinner.style.display = isLoading ? 'block' : 'none';
        if (isLoading) {
            submitBtn.classList.add('processing');
        } else {
            submitBtn.classList.remove('processing');
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dishName = document.getElementById('dishName').value.trim();
            const price = document.getElementById('price').value.trim();
            const description = document.getElementById('description').value.trim();
            const imageFile = document.getElementById('image').files[0];
            
            // Only require image for new dishes
            if (!isEditing && !imageFile) {
                alert("Please select an image.");
                return;
            }

            // Get restaurant ID from localStorage
            const restaurantId = localStorage.getItem('restaurantid');
            if (!restaurantId) {
                alert("Restaurant ID not found. Cannot add dish.");
                return;
            }

            let imageUrl = '';
            if (imageFile) {
                // Upload image to Cloudinary
                const formData = new FormData();
                formData.append("file", imageFile);
                formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

                const cloudRes = await fetch(CLOUDINARY_API_URL, {
                    method: 'POST',
                    body: formData
                });

                const cloudData = await cloudRes.json();
                if (!cloudRes.ok) {
                    throw new Error(cloudData.error?.message || 'Failed to upload image');
                }
                imageUrl = cloudData.secure_url;
            }

            // Create dish object
            let dishData = {
                name: dishName,
                price: parseFloat(price),
                description
            };

            // Handle image URL
            if (imageUrl) {
                dishData.imageUrl = imageUrl;
            } else if (isEditing) {
                // Keep the existing image URL
                const existingData = JSON.parse(localStorage.getItem('editDishData'));
                dishData.imageUrl = existingData.imageUrl;
            }

            // Add timestamp for sorting
            dishData.createdAt = new Date().toISOString();

            // Reference to the specific restaurant document
            const restaurantRef = doc(db, "restaurants", restaurantId);

            if (isEditing) {
                const editIndex = parseInt(localStorage.getItem('editDishIndex'));
                const restaurantDoc = await getDoc(restaurantRef);
                if (!restaurantDoc.exists()) {
                    throw new Error('Restaurant not found');
                }
                const menu = restaurantDoc.data().menu;
                
                // Remove old dish and add updated one
                menu[editIndex] = dishData;
                
                await updateDoc(restaurantRef, {
                    menu: menu
                });

                // Clear edit mode data
                localStorage.removeItem('isEditing');
                localStorage.removeItem('editDishIndex');
                localStorage.removeItem('editDishData');
            } else {
                // Add new dish
                await updateDoc(restaurantRef, {
                    menu: arrayUnion(dishData)
                });
            }

            // Show success message and redirect
            const message = isEditing ? 'Dish updated successfully!' : 'Dish added successfully!';
            alert(message);
            
            // Use replace to prevent back button issues
            window.location.replace('adminDashboard.html');
        } catch (error) {
            console.error("Error:", error);
            alert(error.message || "Failed to process dish. Please try again.");
        } finally {
            setLoading(false);
        }
    });
});