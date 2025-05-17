import { db } from "./FirebaseConfig.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const restaurantId = localStorage.getItem("restaurantid");

  if (restaurantId) {
    try {
      const docRef = doc(db, "restaurants", restaurantId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const logoDiv = document.querySelector(".logo");
        logoDiv.textContent = data.name;
      } else {
        console.warn("No such restaurant found.");
      }
    } catch (error) {
      console.error("Error fetching restaurant name:", error);
    }
  }
});
