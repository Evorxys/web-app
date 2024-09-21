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

// Keep track of connected teachers and students
let teachers = [];
let students = [];

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle identifying whether a user is a teacher or student
  socket.on('identify', (role) => {
    if (role === 'teacher') {
      teachers.push(socket);
      console.log(`Teacher connected: ${socket.id}`);
    } else if (role === 'student') {
      students.push(socket);
      console.log(`Student connected: ${socket.id}`);
    }
    console.log(`Current teachers: ${teachers.map(t => t.id)}`);
    console.log(`Current students: ${students.map(s => s.id)}`);
  });

  // Handle messages from Teacher
  socket.on('teacherMessage', (message) => {
    console.log(`Teacher message: ${message}`);
    console.log('Broadcasting message to students...');
    // Send the message to all students only
    students.forEach(student => {
      console.log(`Sending message to student: ${student.id}`);
      student.emit('studentMessage', message);
    });
  });

  // Handle messages from Student
  socket.on('studentMessage', (message) => {
    console.log(`Student message: ${message}`);
    console.log('Broadcasting message to teachers...');
    // Send the message to all teachers only
    teachers.forEach(teacher => {
      console.log(`Sending message to teacher: ${teacher.id}`);
      teacher.emit('teacherMessage', message);
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    // Remove disconnected teachers and students from their respective lists
    teachers = teachers.filter(t => t.id !== socket.id);
    students = students.filter(s => s.id !== socket.id);
  });
});

// Serve the static files from the 'public' folder if needed (this is optional)
app.use(express.static('public'));

// Start server listening on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
