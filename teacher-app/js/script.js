document.addEventListener('DOMContentLoaded', function() {
    const messageBox = document.getElementById('messagebox');
    const chatbox = document.getElementById('chatbox');
    const sendBtn = document.getElementById('send-btn');
    const speakBtn = document.getElementById('speak-btn');
    const clearBtn = document.getElementById('clear-btn');
    const saveBtn = document.getElementById('save-btn');
    const printBtn = document.getElementById('print-btn');
    const socket = io('https://web-app-backend-service.onrender.com');  // Initialize socket connection

    function setupListeners() {
        console.log('Setting up listeners for teacher...');
        socket.on('studentMessage', function(message) {
            console.log('Received message from student:', message);  // Debug log
            const newMessage = document.createElement('p');
            newMessage.classList.add('chat-message');
            newMessage.innerHTML = `<span style="color:blue;"><strong>Student:</strong></span> ${message}`;
            chatbox.appendChild(newMessage);
        });
    }

    socket.on('connect', () => {
        console.log('Connected to the socket server as teacher');
        socket.emit('identify', 'teacher');
        setupListeners();  // Register the listener once connected
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from the socket server. Retrying...');
        setTimeout(() => {
            socket.connect(); // Attempt to reconnect
        }, 1000);  // Retry after 1 second
    });

    socket.on('reconnect', () => {
        console.log('Reconnected to the server');
        setupListeners();  // Re-register listeners after reconnect
    });

    function sendMessage() {
        const message = messageBox.value.trim();
        if (!message) {
            console.warn("No message to send."); // Avoid sending empty messages
            return;
        }

        console.log('Sending message:', message);  // Debug log

        const newMessage = document.createElement('p');
        newMessage.classList.add('chat-message');
        newMessage.innerHTML = `<span style="color:green;"><strong>Teacher:</strong></span> ${message}`;
        chatbox.appendChild(newMessage);

        // Emit message to the student
        socket.emit('teacherMessage', message);
        console.log('Message sent to socket:', message);  // Debug log

        messageBox.value = '';  // Clear the message box
        clearTypingMessage();  // Clear the typing message
    }

    function clearMessageBox() {
        messageBox.value = '';
        clearTypingMessage();  // Clear the typing message
    }

    function clearTypingMessage() {
        const typingMessage = document.getElementById('typing-message');
        if (typingMessage) {
            chatbox.removeChild(typingMessage);
        }
    }

    // This function updates the "typing" message in the chatbox in real-time
    function updateTypingMessage() {
        const typingMessage = document.getElementById('typing-message');
        const message = messageBox.value.trim();

        if (message) {
            if (!typingMessage) {
                const newTypingMessage = document.createElement('p');
                newTypingMessage.id = 'typing-message';
                newTypingMessage.classList.add('chat-message');
                newTypingMessage.innerHTML = `<span style="color:orange;"><strong>Teacher (Typing):</strong></span> ${message}`;
                chatbox.appendChild(newTypingMessage);
            } else {
                typingMessage.innerHTML = `<span style="color:orange;"><strong>Teacher (Typing):</strong></span> ${message}`;
            }
        } else {
            clearTypingMessage();  // Clear typing message if input is empty
        }
    }

    // Listen for real-time input changes in the messageBox
    messageBox.addEventListener('input', updateTypingMessage);

    // Event listeners for sending messages and managing the chat interface
    sendBtn.addEventListener('click', sendMessage);
    clearBtn.addEventListener('click', clearMessageBox);
    saveBtn.addEventListener('click', saveMessages);
    printBtn.addEventListener('click', printMessages);

    // MutationObserver implementation for the chatbox to detect new messages added by other users
    const observer = new MutationObserver((mutationList, observer) => {
        mutationList.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName === 'P') {
                        console.log('New message detected in chatbox:', node.innerText);
                        // Perform any additional action when a new message is added to the chatbox
                    }
                });
            }
        });
    });

    // Start observing the chatbox for changes (new messages)
    observer.observe(chatbox, { childList: true });

    // Save chat messages as a text file
    function saveMessages() {
        let teacherMessages = '';
        chatbox.querySelectorAll('p').forEach(message => {
            if (message.innerText.includes('Teacher:')) {
                teacherMessages += message.innerText.replace('Teacher:', '') + '\n';
            }
        });

        const blob = new Blob([teacherMessages], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'teacher_messages.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Print chat messages
    function printMessages() {
        const newWindow = window.open('', '_blank');
        newWindow.document.write('<html><head><title>Messages</title></head><body>');
        newWindow.document.write(chatbox.innerHTML);
        newWindow.document.write('</body></html>');
        newWindow.document.close();
        newWindow.focus();
        newWindow.print();
        newWindow.close();
    }
});
