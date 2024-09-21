const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: ["https://teacher-app.onrender.com", "https://student-app.onrender.com"],  // Add both URLs
        methods: ["GET", "POST"]
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for messages from the teacher
    socket.on('teacherMessage', (message) => {
        console.log('Received teacherMessage:', message);
        // Broadcast to all students
        socket.broadcast.emit('teacherMessage', message);
    });

    // Listen for messages from the student
    socket.on('studentMessage', (message) => {
        console.log('Received studentMessage:', message);
        // Broadcast to all teachers
        socket.broadcast.emit('studentMessage', message);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
