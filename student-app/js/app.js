const socket = io('https://web-app-backend-service.onrender.com');  // Connect to the server using Socket.IO

// Elements
const toggleCameraBtn = document.getElementById('toggleCameraBtn');
const cameraFeed = document.getElementById('cameraFeed');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatbox = document.getElementById('chatbox');

// Ensure the connection is established before registering listeners
function setupListeners() {
    console.log('Setting up listeners for student...');
    
    socket.on('teacherMessage', function(message) {
        console.log('Received message from teacher:', message);  // Debug log
        const newMessage = document.createElement('p');
        newMessage.classList.add('chat-message');
        newMessage.innerHTML = `<span style="color:green;"><strong>Teacher:</strong></span> ${message}`;
        chatbox.appendChild(newMessage);
    });
}

socket.on('connect', () => {
    console.log('Connected to the socket server as student');
    socket.emit('identify', 'student');
    setupListeners(); // Register the listener once connected
});

socket.on('disconnect', () => {
    console.log('Disconnected from the socket server. Retrying...');
    setTimeout(() => {
        socket.connect(); // Attempt to reconnect
    }, 1000);  // Retry after 1 second
});

// Retry setting up listeners when reconnecting
socket.on('reconnect', () => {
    console.log('Reconnected to the server');
    setupListeners();  // Re-register listeners after reconnect
});

let cameraOpen = false;
let stream = null;
let model = null;  // Ensure model is initialized only once

async function loadModel() {
    model = await handpose.load();
    console.log("HandPose model loaded.");
    detectHands(); // Start detecting once the model is loaded
}

async function detectHands() {
    if (!cameraOpen || !model) return;

    const predictions = await model.estimateHands(cameraFeed);

    if (predictions.length > 0) {
        const gesture = interpretGesture(predictions);
        if (gesture) {
            messageInput.value = gesture;
        }
    }

    requestAnimationFrame(detectHands);
}

function interpretGesture(predictions) {
    const hand = predictions[0];
    const fingerCount = hand.landmarks.length;

    if (fingerCount === 21) {
        return 'Detected a full hand gesture!'; // Example gesture detection logic
    }
    return null;
}

async function startCamera() {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraFeed.srcObject = stream;
    cameraOpen = true;
    if (!model) {
        await loadModel();
    } else {
        detectHands();
    }
}

function stopCamera() {
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
    }
    cameraFeed.srcObject = null;
    cameraOpen = false;
}

toggleCameraBtn.addEventListener('click', async () => {
    if (cameraOpen) {
        stopCamera();
        toggleCameraBtn.textContent = 'Open Camera';
    } else {
        await startCamera();
        toggleCameraBtn.textContent = 'Close Camera';
    }
});

sendMessageBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    console.log('Sending message:', message);  // Debug log

    if (message) {
        const newMessage = document.createElement('p');
        newMessage.classList.add('chat-message');
        newMessage.innerHTML = `<span style="color:blue;"><strong>Student:</strong></span> ${message}`;
        chatbox.appendChild(newMessage);

        socket.emit('studentMessage', message);
        console.log('Message sent to socket:', message);  // Debug log

        messageInput.value = '';  // Clear the input field after sending
    }
});
