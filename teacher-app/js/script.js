document.addEventListener('DOMContentLoaded', function () {
    const messageBox = document.getElementById('messagebox');
    const chatbox = document.getElementById('chatbox');
    const sendBtn = document.getElementById('send-btn');
    const speakBtn = document.getElementById('speak-btn');
    const clearBtn = document.getElementById('clear-btn');
    const saveBtn = document.getElementById('save-btn');
    const printBtn = document.getElementById('print-btn');
    const socket = io('https://web-app-backend-service.onrender.com'); // Initialize socket connection

    let recognition;
    let recognizing = false;
    let interimSpeech = '';
    let finalSpeech = '';

    // Set up socket listeners
    function setupListeners() {
        socket.on('studentMessage', function (message) {
            const newMessage = document.createElement('p');
            newMessage.classList.add('chat-message');
            newMessage.innerHTML = `<span style="color:blue;"><strong>Student:</strong></span> ${message}`;
            chatbox.appendChild(newMessage);
        });
    }

    socket.on('connect', () => {
        socket.emit('identify', 'teacher');
        setupListeners();
    });

    socket.on('disconnect', () => {
        setTimeout(() => {
            socket.connect();
        }, 1000);
    });

    socket.on('reconnect', () => {
        setupListeners();
    });

    // Function to send a message
    function sendMessage() {
        const message = messageBox.value.trim();
        if (!message) return;

        const newMessage = document.createElement('p');
        newMessage.classList.add('chat-message');
        newMessage.innerHTML = `<span style="color:green;"><strong>Teacher:</strong></span> ${message}`;
        chatbox.appendChild(newMessage);

        socket.emit('teacherMessage', message);

        messageBox.value = '';
        finalSpeech = '';
        clearTypingMessage();
    }

    // Function to clear typing message
    function clearTypingMessage() {
        const typingMessage = document.getElementById('typing-message');
        if (typingMessage) {
            chatbox.removeChild(typingMessage);
        }
    }

    // Update typing message
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
            clearTypingMessage();
        }
    }

    // Speech recognition setup
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = function () {
            recognizing = true;
            speakBtn.textContent = 'Stop Speaking';
        };

        recognition.onresult = function (event) {
            interimSpeech = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalSpeech += event.results[i][0].transcript.trim() + ' ';
                } else {
                    interimSpeech += event.results[i][0].transcript.trim() + ' ';
                }
            }

            displayRealTimeMessage(finalSpeech + interimSpeech);
        };

        recognition.onerror = function (event) {
            console.error('Speech recognition error: ', event.error);
        };

        recognition.onend = function () {
            recognizing = false;
            speakBtn.textContent = 'Start Speaking';
            messageBox.value = finalSpeech.trim();
            sendMessage();
        };
    } else {
        alert('Speech Recognition API not supported in this browser.');
    }

    // Function to toggle speech recognition
    function toggleSpeechRecognition() {
        if (recognizing) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }

    // Display real-time speech in chatbox
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

    // Save messages to a file
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

    // Print messages
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

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    speakBtn.addEventListener('click', toggleSpeechRecognition);
    clearBtn.addEventListener('click', () => messageBox.value = '');
    saveBtn.addEventListener('click', saveMessages);
    printBtn.addEventListener('click', printMessages);
    messageBox.addEventListener('input', updateTypingMessage);

});
