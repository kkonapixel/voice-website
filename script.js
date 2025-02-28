// Import WebRTC/Media Stream API to handle video calls
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        // Access the video element on the page
        const videoElement = document.createElement('video');
        document.getElementById('video-grid').appendChild(videoElement);

        // Set the video stream as the source
        videoElement.srcObject = stream;
        videoElement.play();

        // Log stream info for debugging
        console.log("Camera stream:", stream);

    })
    .catch(error => {
        console.error("Error accessing camera or microphone:", error);
    });
