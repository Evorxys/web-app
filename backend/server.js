const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('a user connected');

  // Handle messages from Teacher
  socket.on('teacherMessage', (message) => {
    // Broadcast the message to the students
    socket.broadcast.emit('studentMessage', message);
  });

  // Handle messages from Student
  socket.on('studentMessage', (message) => {
    // Broadcast the message to the teacher
    socket.broadcast.emit('teacherMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Serve the static files (optional if you're hosting the apps separately)
app.use(express.static('public'));

server.listen(3000, () => {
  console.log('listening on *:3000');
});
