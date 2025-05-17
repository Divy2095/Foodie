  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCQtSm_oWA2mQDJgipbOkT1EPzWZN9xsRQ",
    authDomain: "foodie-c9166.firebaseapp.com",
    projectId: "foodie-c9166",
    storageBucket: "foodie-c9166.firebasestorage.app",
    messagingSenderId: "408878282438",
    appId: "1:408878282438:web:6c14a869c8022bbc7c09c7",
    measurementId: "G-JBHNW7SZHX"
  };

  // Initialize Firebase
  export const app = initializeApp(firebaseConfig);
  export const analytics = getAnalytics(app);
  export const db = getFirestore(app);


