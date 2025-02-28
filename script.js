// Import Firebase SDK functions (this is for Firebase v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, push, onChildAdded, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

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
const app = initializeApp(firebaseConfig); // Initialize Firebase
const database = getDatabase(app); // Get the Realtime Database instance

const videoGrid = document.getElementById("video-grid");
const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const peerConnections = {}; // Stores all connections
let localStream;

// 🔹 Get User Media (Camera & Mic)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        console.log("Local stream received");  // Debugging line
        localStream = stream;
        const localVideo = document.createElement("video");
        localVideo.srcObject = stream;
        localVideo.muted = true;
        localVideo.autoplay = true;
        videoGrid.appendChild(localVideo);

        // Listen for new connections
        const callersRef = ref(database, "callers");
        onChildAdded(callersRef, (snapshot) => {
            const callerId = snapshot.key;
            console.log("New caller detected:", callerId); // Debugging line
            if (callerId !== firebase.auth().currentUser?.uid) {
                connectToUser(callerId);
            }
        });

        // Announce presence
        const userRef = push(callersRef);
        set(userRef, true);
        onValue(userRef, () => {}, { onlyOnce: true });
    })
    .catch(err => {
        console.error("Error accessing media devices.", err);  // Debugging line
    });

// 🔹 Connect to a new user
function connectToUser(callerId) {
    console.log("Connecting to user:", callerId);  // Debugging line
    const peerConnection = new RTCPeerConnection(servers);
    peerConnections[callerId] = peerConnection;

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
        const remoteVideo = document.createElement("video");
        remoteVideo.srcObject = event.streams[0];
        remoteVideo.autoplay = true;
        videoGrid.appendChild(remoteVideo);
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            const candidatesRef = ref(database, `candidates/${callerId}`);
            push(candidatesRef, event.candidate);
        }
    };

    // 🔹 Handle Offer/Answer exchange
    const offersRef = ref(database, `offers/${callerId}`);
    onValue(offersRef, snapshot => {
        if (snapshot.exists()) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(snapshot.val()));
            peerConnection.createAnswer()
                .then(answer => {
                    peerConnection.setLocalDescription(answer);
                    const answersRef = ref(database, `answers/${callerId}`);
                    set(answersRef, answer);
                });
        } else {
            peerConnection.createOffer()
                .then(offer => {
                    peerConnection.setLocalDescription(offer);
                    set(offersRef, offer);
                });
        }
    });

    const answersRef = ref(database, `answers/${callerId}`);
    onValue(answersRef, snapshot => {
        if (snapshot.exists()) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(snapshot.val()));
        }
    });

    const candidatesRef = ref(database, `candidates/${callerId}`);
    onChildAdded(candidatesRef, snapshot => {
        if (snapshot.exists()) {
            peerConnection.addIceCandidate(new RTCIceCandidate(snapshot.val()));
        }
    });
}
