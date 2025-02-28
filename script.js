// Import the Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Firebase configuration (use your actual credentials here)
const firebaseConfig = {
  apiKey: "AIzaSyButcRwGtboCo_WrVxVz-7NXiaawmEY0NI",
  authDomain: "create-database-a8af3.firebaseapp.com",
  databaseURL: "https://create-database-a8af3-default-rtdb.firebaseio.com",
  projectId: "create-database-a8af3",
  storageBucket: "create-database-a8af3.firebasestorage.app",
  messagingSenderId: "180941029548",
  appId: "1:180941029548:web:438ade660742bee6629f09",
  measurementId: "G-5222C6DH4Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // Get a reference to the Realtime Database

// Log to confirm Firebase initialization
console.log("Firebase Initialized:", app);

// Define the reference to your Realtime Database
const dbRef = ref(database, 'calls/');

// Example function to store a new call record
function storeCallData(callId, callDetails) {
  const callRef = push(dbRef); // Push new data into the 'calls' node
  set(callRef, {
    callId: callId,
    details: callDetails,
    timestamp: new Date().toISOString()
  }).then(() => {
    console.log("Call data saved successfully!");
  }).catch((error) => {
    console.error("Error saving call data: ", error);
  });
}

// Function to listen for updates in the 'calls' node
function listenForCalls() {
  onValue(dbRef, (snapshot) => {
    const calls = snapshot.val();
    console.log("Current calls:", calls);
    // You can use this data to update the UI, display call information, etc.
  }, (error) => {
    console.error("Error reading data: ", error);
  });
}

// Call the listenForCalls function to listen for updates in real-time
listenForCalls();

// Example of storing a new call data (this can be triggered on user action like clicking a button)
storeCallData('call123', { host: 'User1', participants: ['User1', 'User2', 'User3'] });

// You can also handle additional actions like screen sharing, joining a call, etc.
// The structure for those actions will depend on the rest of your app's logic

