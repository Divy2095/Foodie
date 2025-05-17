import { db } from './FirebaseConfig.js';
import { doc, getDoc, updateDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

// Test function to add a dish directly
export async function testAddDish(restaurantId) {
    try {
        // Test dish
        const testDish = {
            name: "Test Dish " + new Date().toISOString(),
            price: 199,
            description: "Test dish description",
            imageUrl: "https://res.cloudinary.com/dfrwvoowc/image/upload/v1/samples/food/pot-mussels.jpg"
        };

        console.log("Testing with dish:", testDish);
        console.log("Restaurant ID:", restaurantId);

        // Get restaurant reference
        const restaurantRef = doc(db, "restaurants", restaurantId);
        
        // Check if restaurant exists
        const restaurantDoc = await getDoc(restaurantRef);
        if (!restaurantDoc.exists()) {
            throw new Error('Restaurant document not found');
        }

        console.log("Current restaurant data:", restaurantDoc.data());

        // Add dish to menu
        await updateDoc(restaurantRef, {
            menu: arrayUnion(testDish)
        });

        // Verify update
        const verifyDoc = await getDoc(restaurantRef);
        console.log("Updated restaurant data:", verifyDoc.data());

        return true;
    } catch (error) {
        console.error("Error in test add:", error);
        throw error;
    }
}
