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
        console.log(predictions);
        const fullHandDetected = predictions.some(prediction => prediction.landmarks.length === 21);

        if (fullHandDetected) {
            messageInput.value = 'Detected a full hand gesture!';
        } else {
            messageInput.value = 'No hand gesture detected!';
        }
    } else {
        messageInput.value = 'No hand gesture detected!';
    }

    requestAnimationFrame(detectHands);
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    console.log('Sending message:', message);  // Debug log

    const newMessage = document.createElement('p');
    newMessage.classList.add('chat-message');
    newMessage.innerHTML = `<span style="color:blue;"><strong>Student:</strong></span> ${message}`;
    chatbox.appendChild(newMessage);

    socket.emit('studentMessage', message);  // Send message via Socket.IO
    console.log('Message sent to socket:', message);  // Debug log

    messageInput.value = '';  // Clear the input box
}

async function toggleCamera() {
    if (cameraOpen) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());  // Stop all tracks of the stream
            cameraFeed.srcObject = null;
        }
        cameraOpen = false;
        toggleCameraBtn.textContent = 'Open Camera';
    } else {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraFeed.srcObject = stream;
        cameraOpen = true;
        toggleCameraBtn.textContent = 'Close Camera';
        await loadModel();  // Load the model and start detection
    }
}

// Event listeners
toggleCameraBtn.addEventListener('click', toggleCamera);
sendMessageBtn.addEventListener('click', sendMessage);
