document.addEventListener('DOMContentLoaded', function() {
    const messageBox = document.getElementById('messagebox');
    const chatbox = document.getElementById('chatbox');
    const sendBtn = document.getElementById('send-btn');
    const speakBtn = document.getElementById('speak-btn');
    const clearBtn = document.getElementById('clear-btn');
    const saveBtn = document.getElementById('save-btn');
    const printBtn = document.getElementById('print-btn');
    const socket = io();  // Initialize socket connection

    let recognition;
    let recognizing = false;
    let interimSpeech = '';  // Interim recognized speech
    let finalSpeech = '';    // Final recognized speech

    // Function to send a message
    function sendMessage() {
        const message = messageBox.value.trim();
        
        if (message) {
            const newMessage = document.createElement('p');
            newMessage.classList.add('chat-message');
            newMessage.innerHTML = `<span style="color:green;"><strong>Teacher:</strong></span> ${message}`;
            chatbox.appendChild(newMessage);

            // Emit message to the student
            socket.emit('teacherMessage', message);

            messageBox.value = '';  // Clear the message box
            finalSpeech = '';  // Reset final speech after sending
            clearTypingMessage();  // Clear the typing message
        }
    }

    // Function to clear the message box
    function clearMessageBox() {
        messageBox.value = '';
        finalSpeech = ''; // Clear the speech as well
        clearTypingMessage();  // Clear the typing message
    }

    // Function to clear typing message from chatbox
    function clearTypingMessage() {
        const typingMessage = document.getElementById('typing-message');
        if (typingMessage) {
            chatbox.removeChild(typingMessage);
        }
    }

    // Function to update typing message
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

    // Receive student messages
    socket.on('studentMessage', function(message) {
        const newMessage = document.createElement('p');
        newMessage.classList.add('chat-message');
        newMessage.innerHTML = `<span style="color:blue;"><strong>Student:</strong></span> ${message}`;
        chatbox.appendChild(newMessage);
    });

    // Speech recognition setup
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

            // Display real-time speech in chatbox
            displayRealTimeMessage(finalSpeech + interimSpeech);
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error: ', event.error);
        };

        recognition.onend = function() {
            recognizing = false;
            speakBtn.textContent = 'Start Speaking';

            // On stop, copy final speech to messagebox and treat it as sent
            messageBox.value = finalSpeech.trim(); // Set the final speech in message box
            sendMessage();  // Simulate sending the message
        };
    } else {
        alert('Speech Recognition API not supported in this browser.');
    }

    // Function to start/stop speech recognition
    function toggleSpeechRecognition() {
        if (recognizing) {
            recognition.stop();  // Stop speech recognition and trigger sending the message
        } else {
            recognition.start();  // Start speech recognition
        }
    }

    // Function to display teacher's real-time speech in chatbox
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
            if (message.innerHTML.includes('<strong>Teacher:</strong>')) {
                teacherMessages += message.innerText + '\n';
            }
        });

        if (teacherMessages.trim() === '') {
            alert('No Teacher messages to save.');
            return;
        }

        let fileName = prompt('Enter a name for your file:', 'TeacherMessages');
        if (!fileName) {
            alert('File name cannot be empty!');
            return;
        }

        fileName = fileName.replace(/\.docx$/, '') + '.docx';
        const docxContent = new Blob([teacherMessages], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        saveAs(docxContent, fileName);
    }

    // Print messages
    function printMessages() {
        let printContent = '';
        chatbox.querySelectorAll('p').forEach(message => {
            if (message.innerHTML.includes('<strong>Teacher:</strong>')) {
                printContent += message.innerHTML + '<br>';
            }
        });

        if (printContent) {
            const printWindow = window.open('', '', 'height=400,width=600');
            printWindow.document.write('<html><head><title>Print Teacher Messages</title></head><body>');
            printWindow.document.write(printContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        } else {
            alert("No teacher messages to print.");
        }
    }

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    speakBtn.addEventListener('click', toggleSpeechRecognition);
    clearBtn.addEventListener('click', clearMessageBox);
    saveBtn.addEventListener('click', saveMessages);
    printBtn.addEventListener('click', printMessages);
    
    // Update chatbox with typing message
    messageBox.addEventListener('input', updateTypingMessage);
});
