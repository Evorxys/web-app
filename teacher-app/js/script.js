document.addEventListener('DOMContentLoaded', function() {
    const messageBox = document.getElementById('messagebox');
    const chatbox = document.getElementById('chatbox');
    const sendBtn = document.getElementById('send-btn');
    const speakBtn = document.getElementById('speak-btn');
    const clearBtn = document.getElementById('clear-btn');
    const saveBtn = document.getElementById('save-btn');
    const printBtn = document.getElementById('print-btn');
    const socket = io('https://web-app-backend-service.onrender.com');  // Initialize socket connection

    socket.on('connect', () => {
        console.log('Connected to the socket server');
        // Identify as a teacher
        socket.emit('identify', 'teacher');

        // Register the message listener after connection is confirmed
        socket.on('studentMessage', function(message) {
            console.log('Received message from student:', message);  // Debug log
            const newMessage = document.createElement('p');
            newMessage.classList.add('chat-message');
            newMessage.innerHTML = `<span style="color:blue;"><strong>Student:</strong></span> ${message}`;
            chatbox.appendChild(newMessage);
        });
        console.log('Listening for student messages...');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from the socket server');
    });

    let recognition;
    let recognizing = false;
    let interimSpeech = '';  // Interim recognized speech
    let finalSpeech = '';    // Final recognized speech

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
        finalSpeech = '';  // Reset final speech after sending
        clearTypingMessage();  // Clear the typing message
    }

    function clearMessageBox() {
        messageBox.value = '';
        finalSpeech = ''; // Clear the speech as well
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

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;  
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = function() {
            recognizing = true;
            speakBtn.textContent = 'Stop Speaking';
        };

        recognition.onresult = function(event) {
            interimSpeech = ''; // Clear interim speech for this round

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalSpeech += event.results[i][0].transcript.trim() + ' ';
                } else {
                    interimSpeech += event.results[i][0].transcript.trim() + ' ';
                }
            }

            displayRealTimeMessage(finalSpeech + interimSpeech);
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error: ', event.error);
        };

        recognition.onend = function() {
            recognizing = false;
            speakBtn.textContent = 'Start Speaking';
            messageBox.value = finalSpeech.trim(); 
            sendMessage();  // Simulate sending the message
        };
    } else {
        alert('Speech Recognition API not supported in this browser.');
    }

    function toggleSpeechRecognition() {
        if (recognizing) {
            recognition.stop();  
        } else {
            recognition.start();  
        }
    }

    function displayRealTimeMessage(text) {
        let realTimeMessageElement = document.getElementById('real-time-message');
        
        if (!realTimeMessageElement) {
            realTimeMessageElement = document.createElement('p');
            realTimeMessageElement.id = 'real-time-message';
            realTimeMessageElement.classList.add('chat-message');
            realTimeMessageElement.innerHTML = `<span style="color:green;"><strong>Teacher (Speaking):</strong></span> ${text}`;
            chatbox.appendChild(realTimeMessageElement);
        } else {
            realTimeMessageElement.innerHTML = `<span style="color:green;"><strong>Teacher (Speaking):</strong></span> ${text}`;
        }
    }

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

    sendBtn.addEventListener('click', sendMessage);
    messageBox.addEventListener('input', updateTypingMessage);
    clearBtn.addEventListener('click', clearMessageBox);
    speakBtn.addEventListener('click', toggleSpeechRecognition);
    saveBtn.addEventListener('click', saveMessages);
    printBtn.addEventListener('click', printMessages);
});
