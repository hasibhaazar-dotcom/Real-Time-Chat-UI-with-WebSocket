const wsUrl = "wss://echo.websocket.events/";

let socket;
let reconnectDelay = 1000;
let messageQueue = [];
let uploadedImage = null;

const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const typingIndicator = document.getElementById("typingIndicator");
const charCount = document.getElementById("charCount");

const uploadBtn = document.getElementById("uploadBtn");
const imageUpload = document.getElementById("imageUpload");
const previewBox = document.getElementById("previewBox");
const previewImage = document.getElementById("previewImage");
const removePreview = document.getElementById("removePreview");

const autoReplies = [
    "Hey there 👋",
    "That's interesting!",
    "Nice 😊",
    "Tell me more.",
    "Sounds great 👍",
    "I completely agree.",
    "Cool 😎",
    "That's awesome!",
    "How was your day?",
    "Good idea!",
    "Really?",
    "Can you explain more?"
];

/* ===========================
   WebSocket Connection
=========================== */

function connectSocket() {

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        updateStatus("Connected", "#22c55e");

        reconnectDelay = 1000;

        while (messageQueue.length) {
            socket.send(messageQueue.shift());
        }
    };

    socket.onmessage = () => {
        // Ignore echo server response
    };

    socket.onerror = () => {
        updateStatus("Connection Error", "#ef4444");
    };

    socket.onclose = () => {

        updateStatus("Reconnecting...", "#f59e0b");

        setTimeout(() => {
            connectSocket();
        }, reconnectDelay);

        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    };
}

connectSocket();

/* ===========================
   Status
=========================== */

function updateStatus(text, color) {
    statusText.textContent = text;
    statusDot.style.background = color;
}

/* ===========================
   Message Creation
=========================== */

function createMessage(content, type) {

    const message = document.createElement("div");
    message.className = `message ${type}`;

    message.innerHTML = `
        <div class="message-content">
            ${content}
        </div>

        <div class="timestamp">
            ${getCurrentTime()}
            ${type === "sent"
                ? '<span class="read-receipt">✓✓</span>'
                : ""}
        </div>

        <div class="reactions">
            <button class="reaction-btn">👍</button>
            <button class="reaction-btn">❤️</button>
            <button class="reaction-btn">😂</button>
        </div>
    `;

    const reactionButtons =
        message.querySelectorAll(".reaction-btn");

    reactionButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            btn.textContent = btn.textContent + " 1";
            btn.disabled = true;
        });
    });

    messagesContainer.appendChild(message);

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;
}

/* ===========================
   Send Message
=========================== */

function sendMessage() {

    const text = messageInput.value.trim();

    if (!text && !uploadedImage) return;

    let content = "";

    if (text) {
        content += text;
    }

    if (uploadedImage) {
        content += `
            <div class="image-message">
                <img src="${uploadedImage}">
            </div>
        `;
    }

    createMessage(content, "sent");

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(text);
    } else {
        messageQueue.push(text);
    }

    messageInput.value = "";
    uploadedImage = null;

    previewBox.classList.add("hidden");

    updateCharacterCount();

    simulateReply();
}

/* ===========================
   Auto Reply
=========================== */

function simulateReply() {

    typingIndicator.classList.remove("hidden");

    const delay =
        Math.floor(Math.random() * 2000) + 1000;

    setTimeout(() => {

        typingIndicator.classList.add("hidden");

        const randomReply =
            autoReplies[
                Math.floor(
                    Math.random() * autoReplies.length
                )
            ];

        createMessage(randomReply, "received");

        showNotification(
            "Zara Quinn",
            randomReply
        );

    }, delay);
}

/* ===========================
   Time
=========================== */

function getCurrentTime() {

    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* ===========================
   Character Counter
=========================== */

function updateCharacterCount() {

    const length = messageInput.value.length;

    charCount.textContent =
        `${length} / 500`;

    charCount.style.color =
        length > 450
            ? "#ef4444"
            : "#64748b";
}

messageInput.addEventListener(
    "input",
    updateCharacterCount
);

/* ===========================
   Send Events
=========================== */

sendBtn.addEventListener(
    "click",
    sendMessage
);

messageInput.addEventListener(
    "keydown",
    (e) => {

        if (
            e.key === "Enter" &&
            !e.shiftKey
        ) {
            e.preventDefault();
            sendMessage();
        }
    }
);

/* ===========================
   Image Upload
=========================== */

uploadBtn.addEventListener(
    "click",
    () => imageUpload.click()
);

imageUpload.addEventListener(
    "change",
    e => {

        const file = e.target.files[0];

        if (!file) return;

        const reader =
            new FileReader();

        reader.onload = event => {

            uploadedImage =
                event.target.result;

            previewImage.src =
                uploadedImage;

            previewBox.classList.remove(
                "hidden"
            );
        };

        reader.readAsDataURL(file);
    }
);

removePreview.addEventListener(
    "click",
    () => {

        uploadedImage = null;

        imageUpload.value = "";

        previewBox.classList.add(
            "hidden"
        );
    }
);

/* ===========================
   Browser Notification
=========================== */

if (
    "Notification" in window &&
    Notification.permission !== "granted"
) {
    Notification.requestPermission();
}

function showNotification(
    title,
    body
) {

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        new Notification(title, {
            body: body
        });
    }
}

/* ===========================
   Demo History Messages
=========================== */

const historyMessages = [
    {
        type: "received",
        text: "Hi! I'm Zara Quinn 👋"
    },
    {
        type: "sent",
        text: "Hello!"
    },
    {
        type: "received",
        text: "Welcome to ChatSphere."
    }
];

historyMessages.forEach(msg => {
    createMessage(
        msg.text,
        msg.type
    );
});
