const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');  // Required to handle cross-origin requests

const app = express();
const server = http.createServer(app);

// Setup Socket.IO and allow cross-origin requests for your two static web apps
const io = new Server(server, {
  cors: {
    origin: [
      'https://web-app-for-student.onrender.com', // Student app URL
      'https://web-app-for-teacher.onrender.com'  // Teacher app URL
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware to use CORS globally in the app
app.use(cors({
  origin: [
    'https://web-app-for-student.onrender.com',
    'https://web-app-for-teacher.onrender.com'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle messages from Teacher
  socket.on('teacherMessage', (message) => {
    console.log(`Teacher message: ${message}`);
    // Broadcast the message to all connected clients, including the student
    io.emit('studentMessage', message);  // Use io.emit to send to everyone
  });

  // Handle messages from Student
  socket.on('studentMessage', (message) => {
    console.log(`Student message: ${message}`);
    // Broadcast the message to all connected clients, including the teacher
    io.emit('teacherMessage', message);  // Use io.emit to send to everyone
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Serve the static files from the 'public' folder if needed (this is optional)
app.use(express.static('public'));

// Start server listening on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
