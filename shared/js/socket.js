const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Create an Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files for teacher and student interfaces
app.use('/student', express.static(path.join(__dirname, '../student')));
app.use('/teacher', express.static(path.join(__dirname, '../teacher')));

// Handle connections to the Socket.IO server
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle student messages
    socket.on('studentMessage', (message) => {
        console.log('Student message:', message);
        socket.broadcast.emit('studentMessage', message);  // Broadcast to other clients (e.g., teacher)
    });

    // Handle teacher messages
    socket.on('teacherMessage', (message) => {
        console.log('Teacher message:', message);
        socket.broadcast.emit('teacherMessage', message);  // Broadcast to other clients (e.g., student)
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
