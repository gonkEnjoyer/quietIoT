import { database } from "./firebase_init.js";
import { ref, onValue, off } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js"
import { subscribeToAuthChanges } from "./firebase_auth.js";

let currentRTDBUnsubscribe = null;

function setUpUserRTDBListener(uid) {
    if (currentRTDBUnsubscribe) {
        currentRTDBUnsubscribe();
        console.log("Detached previous RTDB listener");
    }

    console.log(`Setting up RTDB listener for user: ${uid}`);
    const userRef = ref(database, `users/${uid}`);

    currentRTDBUnsubscribe = onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        console.log("RTDB user data for", uid, ":", userData);
        
        if (userData && userData.devices) {
            console.log("Processing IoT device data for " + userData)
            document.getElementById("dumpField").textContent = JSON.stringify(userData, null, 2);

        } else {
            console.log("No IoT devices found for this user.")
        }
    });
}

function detachUserRTDBListener() {
    if (currentRTDBUnsubscribe) {
        currentRTDBUnsubscribe();
        currentRTDBUnsubscribe = null; // Clear the reference
        console.log("RTDB listener detached because user logged out.");
    }
}

subscribeToAuthChanges((user) => {
    if (user) {
        // User is logged in, set up the RTDB listener for their data
        setUpUserRTDBListener(user.uid);
    } else {
        // User is logged out, detach any active RTDB listener
        detachUserRTDBListener();
        console.log("No user signed in, RTDB listener removed.");
        // HERE: Clear any user-specific data from your UI/state
        // For example: clearUserDataFromUI();
    }
});