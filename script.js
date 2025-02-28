// Firebase SDK v9 modular imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getDatabase, ref, set, get, child, onValue } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase app and database
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Set up PeerJS
const peer = new Peer();  // Peer instance for handling peer-to-peer connections

let localStream;   // Local video stream
let peers = {};    // Object to store peer connections for other users

// Elements in HTML
const startCallButton = document.getElementById('startCall');
const videoGrid = document.getElementById('video-grid');
const localVideo = document.getElementById('local-video');

// Start the call when the button is clicked
startCallButton.addEventListener('click', startCall);

// Start video call function
function startCall() {
  // Get local media stream (audio + video)
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localStream = stream;
      localVideo.srcObject = stream;
      localVideo.style.display = 'block';  // Show local video feed

      // Listen for incoming calls and set up peer connections
      peer.on('call', incomingCall => {
        console.log('Receiving a call...');
        incomingCall.answer(localStream); // Answer the call with our local stream

        // When the remote peer answers, display their video
        incomingCall.on('stream', remoteStream => {
          const remoteVideo = document.createElement('video');
          remoteVideo.srcObject = remoteStream;
          remoteVideo.autoplay = true;
          videoGrid.appendChild(remoteVideo); // Show remote video
        });
      });

      // Store call info in Firebase
      const callRef = ref(database, 'calls/');
      set(callRef, { peerId: peer.id });
      console.log("Local peer ID:", peer.id);

      // Enable communication with other peers in the database (to start call)
      peer.on('open', peerId => {
        // Now, connect to the other peer using their peer ID (found from Firebase or manual input)
        connectToPeer(peerId);
      });
    })
    .catch(err => {
      console.error('Error accessing media devices:', err);
    });
}

// Connect to another peer using their Peer ID (the ID is saved in Firebase)
function connectToPeer(peerId) {
  const call = peer.call(peerId, localStream);  // Call another peer with our stream

  // When the remote peer answers, display their video
  call.on('stream', remoteStream => {
    const remoteVideo = document.createElement('video');
    remoteVideo.srcObject = remoteStream;
    remoteVideo.autoplay = true;
    videoGrid.appendChild(remoteVideo); // Show remote video
  });

  call.on('close', () => {
    console.log('Connection closed');
    // Clean up the video elements if the connection closes
    const videoElements = videoGrid.getElementsByTagName('video');
    for (let video of videoElements) {
      video.srcObject = null;
      video.remove();
    }
  });
}

// Listening for data from Firebase to update connections
const callRef = ref(database, 'calls/');
onValue(callRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.peerId) {
    // If another peer ID is found in the Firebase DB, attempt to connect
    if (peer.id !== data.peerId) {
      connectToPeer(data.peerId);
    }
  }
});

// Handle peer connection events
peer.on('error', (err) => {
  console.error('PeerJS error:', err);
});

peer.on('close', () => {
  console.log('Peer connection closed');
  // Clean up video and peer references when closing the connection
  const videoElements = videoGrid.getElementsByTagName('video');
  for (let video of videoElements) {
    video.srcObject = null;
    video.remove();
  }
});
