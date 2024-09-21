const socket = io('https://web-app-backend-service.onrender.com');  // Connect to the server using Socket.IO

// Elements
const toggleCameraBtn = document.getElementById('toggleCameraBtn');
const cameraFeed = document.getElementById('cameraFeed');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatbox = document.getElementById('chatbox');

socket.on('connect', () => {
  console.log('Connected to the socket server');
  // Identify as a student
  socket.emit('identify', 'student');
});

socket.on('disconnect', () => {
    console.log('Disconnected from the socket server');
});

let cameraOpen = false;
let stream = null;
let model = null;  // Ensure model is initialized only once

// Load the HandPose model
async function loadModel() {
    model = await handpose.load();
    console.log("HandPose model loaded.");
    detectHands(); // Start detecting once the model is loaded
}

// Start detecting hand gestures
async function detectHands() {
    if (!cameraOpen || !model) return; // Ensure camera is on and model is loaded

    const predictions = await model.estimateHands(cameraFeed); // Detect hands

    if (predictions.length > 0) {
        console.log("Hand detected", predictions);
        const gesture = interpretGesture(predictions); // Interpret the detected gesture
        if (gesture) {
            messageInput.value = gesture; // Display the interpreted gesture
        }
    }

    // Call detectHands on the next animation frame for continuous detection
    requestAnimationFrame(detectHands);
}

// Interpret gestures based on predictions
function interpretGesture(predictions) {
    const hand = predictions[0]; // Assuming there's at least one hand detected
    const fingerCount = hand.landmarks.length;

    // Example: If the hand is in a certain position, return a predefined message.
    if (fingerCount === 21) {
        return 'Detected a full hand gesture!'; // Example gesture detection logic
    }
    return null;
}

// Start the camera
async function startCamera() {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraFeed.srcObject = stream;
    cameraOpen = true;
    if (!model) {
        await loadModel();  // Load the model if not already loaded
    } else {
        detectHands();  // Start detecting hands
    }
}

// Stop the camera
function stopCamera() {
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop()); // Stop all tracks to turn off the camera
    }
    cameraFeed.srcObject = null;
    cameraOpen = false;
}

// Toggle the camera on and off
toggleCameraBtn.addEventListener('click', async () => {
    if (cameraOpen) {
        stopCamera();
        toggleCameraBtn.textContent = 'Open Camera';
    } else {
        await startCamera();
        toggleCameraBtn.textContent = 'Close Camera';
    }
});

// Send message event
sendMessageBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    console.log('Sending message:', message);  // Debug log

    if (message) {
        const newMessage = document.createElement('p');
        newMessage.classList.add('chat-message');
        newMessage.innerHTML = `<span style="color:blue;"><strong>Student:</strong></span> ${message}`;
        chatbox.appendChild(newMessage);

        // Emit message to the teacher
        socket.emit('studentMessage', message);
        console.log('Message sent to socket:', message);  // Debug log

        messageInput.value = '';  // Clear the input field after sending
    }
});

// Receive teacher's messages
socket.on('teacherMessage', function(message) {
    console.log('Received message from teacher:', message);  // Debug log
    const newMessage = document.createElement('p');
    newMessage.classList.add('chat-message');
    newMessage.innerHTML = `<span style="color:green;"><strong>Teacher:</strong></span> ${message}`;
    chatbox.appendChild(newMessage);
});
