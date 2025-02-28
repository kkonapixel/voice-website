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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const videoGrid = document.getElementById("video-grid");
const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const peerConnections = {}; // Stores all connections
let localStream;

// 🔹 Get User Media (Camera & Mic)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        const localVideo = document.createElement("video");
        localVideo.srcObject = stream;
        localVideo.muted = true;
        localVideo.autoplay = true;
        videoGrid.appendChild(localVideo);

        // Listen for new connections
        database.ref("callers").on("child_added", snapshot => {
            const callerId = snapshot.key;
            if (callerId !== firebase.auth().currentUser?.uid) {
                connectToUser(callerId);
            }
        });

        // Announce presence
        const userRef = database.ref("callers").push();
        userRef.set(true);
        userRef.onDisconnect().remove();
    })
    .catch(err => console.error("Error accessing media devices.", err));

// 🔹 Connect to a new user
function connectToUser(callerId) {
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
            database.ref(`candidates/${callerId}`).push(event.candidate);
        }
    };

    // 🔹 Handle Offer/Answer exchange
    database.ref(`offers/${callerId}`).once("value", snapshot => {
        if (snapshot.exists()) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(snapshot.val()));
            peerConnection.createAnswer()
                .then(answer => {
                    peerConnection.setLocalDescription(answer);
                    database.ref(`answers/${callerId}`).set(answer);
                });
        } else {
            peerConnection.createOffer()
                .then(offer => {
                    peerConnection.setLocalDescription(offer);
                    database.ref(`offers/${callerId}`).set(offer);
                });
        }
    });

    database.ref(`answers/${callerId}`).on("value", snapshot => {
        if (snapshot.exists()) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(snapshot.val()));
        }
    });

    database.ref(`candidates/${callerId}`).on("child_added", snapshot => {
        if (snapshot.exists()) {
            peerConnection.addIceCandidate(new RTCIceCandidate(snapshot.val()));
        }
    });
}
