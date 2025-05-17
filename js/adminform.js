import { app, db } from "./FirebaseConfig.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  const newJoinBtn = document.getElementById("newJoinBtn");
  const continueBtn = document.getElementById("continueBtn");

  newJoinBtn.addEventListener("click", function () {
    window.location.href = "restaurant-detailform.html";
  });

  continueBtn.addEventListener("click", async function () {
    const contactNo = document.getElementById("contact").value.trim();

    if (contactNo.length !== 10 || isNaN(contactNo)) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }

    try {
      // ✅ Correct Firestore query
      const q = query(collection(db, "restaurants"), where("contact", "==", contactNo));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Please sign up.");
      } else {
        const restaurantDoc = querySnapshot.docs[0];
        const restaurantId = restaurantDoc.id;
  
        // ✅ Store in localStorage
        localStorage.setItem("restaurantid", restaurantId);
        window.location.href = "adminDashboard.html";
      }
    } catch (error) {
      console.error("Error checking contact number:", error);
      alert("Error checking contact number. Please try again.");
    }
  });
});
