const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the teacher and student apps
app.use('/teacher-app', express.static(path.join(__dirname, '../teacher-app')));
app.use('/student-app', express.static(path.join(__dirname, '../student-app')));

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected');

    // Receive a message from the teacher and broadcast to the student
    socket.on('teacherMessage', (message) => {
        console.log('Teacher sent: ', message);
        io.emit('teacherMessage', message);
    });

    // Receive a message from the student and broadcast to the teacher
    socket.on('studentMessage', (message) => {
        console.log('Student sent: ', message);
        io.emit('studentMessage', message);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Server listening on port 3000
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
