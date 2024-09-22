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

    // Add event listener to the message box to track typing in real-time
    messageBox.addEventListener('input', updateTypingMessage);

    // Event listeners for other buttons
    sendBtn.addEventListener('click', sendMessage);
    clearBtn.addEventListener('click', clearMessageBox);
    
    // Function to save teacher messages
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

    // Function to print messages
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

    // Attach event listeners to save and print buttons
    saveBtn.addEventListener('click', saveMessages);
    printBtn.addEventListener('click', printMessages);

    // MutationObserver for monitoring new messages added to the chatbox
    const observer = new MutationObserver((mutationList) => {
        mutationList.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName === 'P') {
                        console.log('New message detected in chatbox:', node.innerText);
                        // You can handle further actions when new messages are added
                    }
                });
            }
        });
    });

    // Start observing the chatbox for changes
    observer.observe(chatbox, { childList: true });
});
