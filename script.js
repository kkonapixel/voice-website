// Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const callRef = database.ref("calls"); // Firebase reference for calls

// Get DOM elements
const startCallButton = document.getElementById("startCall");
const localVideo = document.getElementById("local-video");
const videoGrid = document.getElementById("video-grid");

let localStream;
let peerConnection;
let callId;

// Get user's media (video and audio)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
    localVideo.style.display = 'block';  // Show local video stream
  })
  .catch(err => {
    console.error("Error accessing camera and mic", err);
  });

// Create PeerConnection
function createPeerConnection() {
  peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  });

  // Add local stream tracks to the connection
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  // Handle ICE candidates
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      callRef.push().set({
        type: "candidate",
        candidate: event.candidate
      });
    }
  };

  // Handle remote stream
  peerConnection.ontrack = event => {
    const remoteVideo = document.createElement("video");
    remoteVideo.srcObject = event.streams[0];
    remoteVideo.play();
    videoGrid.appendChild(remoteVideo);
  };
}

// Create Offer
function createOffer() {
  createPeerConnection();
  
  peerConnection.createOffer()
    .then(offer => peerConnection.setLocalDescription(offer))
    .then(() => {
      // Save offer to Firebase
      callRef.push().set({
        type: "offer",
        offer: peerConnection.localDescription
      });
    })
    .catch(error => console.error("Error creating offer:", error));
}

// Handle Offer from Firebase
function handleOffer(offer, callId) {
  createPeerConnection();
  
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => peerConnection.createAnswer())
    .then(answer => peerConnection.setLocalDescription(answer))
    .then(() => {
      // Send answer back to Firebase
      callRef.child(callId).set({
        type: "answer",
        answer: peerConnection.localDescription
      });
    })
    .catch(error => console.error("Error handling offer:", error));
}

// Handle ICE candidates from Firebase
function handleCandidate(candidate) {
  const iceCandidate = new RTCIceCandidate(candidate);
  peerConnection.addIceCandidate(iceCandidate);
}

// Listen to Firebase for offers, answers, and ICE candidates
callRef.on('child_added', snapshot => {
  const data = snapshot.val();
  
  if (data.type === "offer") {
    handleOffer(data.offer, snapshot.key);
  } else if (data.type === "answer") {
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  } else if (data.type === "candidate") {
    handleCandidate(data.candidate);
  }
});

// Start the call (triggered by button)
startCallButton.addEventListener("click", () => {
  createOffer();
});

