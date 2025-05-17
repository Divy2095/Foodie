import{app,db} from "./FirebaseConfig.js"

import {  collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import { CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_URL } from "./CloudinaryConfig.js";
// ImgBB Upload API Key
//const IMGBB_API_KEY = "a4c6ed9e10ee6c3b0079a5c4582e74d0";

// Submit Handler
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("restaurantForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const address = document.getElementById("address").value.trim();
    const contact = document.getElementById("contact").value.trim();
    const open = document.getElementById("open").value;
    const close = document.getElementById("close").value;
    const imageFile = document.getElementById("image").files[0];

    if (!name || !address || !contact || !open || !close || !imageFile) {
      alert("Please fill all fields and choose an image.");
      return;
    }

    try {
    //  const imageUrl = await uploadToImgBB(imageFile);
 const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const cloudinaryRes = await fetch(CLOUDINARY_API_URL, {
        method: "POST",
        body: formData,
      });
      // const imageUrl = await cloudinaryRes.json();
      const cloudinaryData = await cloudinaryRes.json();
      console.log("Cloudinary Response:", cloudinaryData);
      const imageUrl = cloudinaryData.secure_url;
      console.log("Image uploaded:", imageUrl);

        var data = await addDoc(collection(db, "restaurants"), {
          name,
          address,
          contact,
          open,
          close,
          imageUrl,
          timestamp: new Date()
        });
  
        console.log(data);
     
          alert("Restaurant data saved successfully!");
          form.reset(); // Reset the form fields
          window.location.href = "adminDashboard.html";
   
    } catch (error) {
      console.error("Error during form submission:", error);
      alert("Failed to upload image or submit form.");
    }
  });
});

// ImgBB Upload Function
// async function uploadToImgBB(imageFile) {
//   const formData = new FormData();
//   formData.append("image", imageFile);

//   const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
//     method: "POST",
//     body: formData,
//   });

//   if (!response.ok) {
//     throw new Error("Image upload failed");
//   }

//   const result = await response.json();
//   return result.data.url;
// }
