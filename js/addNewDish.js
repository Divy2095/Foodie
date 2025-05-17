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

document.getElementById('dishForm').addEventListener('submit', async (e) => {
  e.preventDefault();

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
    });

    alert("Dish added successfully to the selected restaurant.");
    document.getElementById('dishForm').reset();

  } catch (error) {
    console.error("Error adding new dish:", error);
    alert("Something went wrong. Check console for details.");
  }
});