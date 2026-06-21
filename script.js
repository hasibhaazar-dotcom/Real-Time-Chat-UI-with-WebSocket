const wsUrl = "wss://echo.websocket.events/";
let ws;
let retryDelay = 1000;
let queue = [];

const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const typing = document.getElementById("typingIndicator");
const charCount = document.getElementById("charCount");
const uploadBtn = document.getElementById("uploadBtn");
const imageUpload = document.getElementById("imageUpload");
const previewBox = document.getElementById("previewBox");
const previewImage = document.getElementById("previewImage");

let uploadedImage = null;

function connect() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        statusDot.style.background = "green";
        statusText.textContent = "Connected";
        retryDelay = 1000;

        queue.forEach(msg => ws.send(msg));
        queue = [];
    };

    ws.onmessage = (e) => {
        addMessage(e.data, "received");
        simulateReadReceipt();
        notify("New message", e.data);
    };

    ws.onclose = () => {
        statusDot.style.background = "red";
        statusText.textContent = "Disconnected";

        setTimeout(() => {
            statusDot.style.background = "orange";
            statusText.textContent = "Reconnecting...";
            connect();
            retryDelay = Math.min(retryDelay * 2, 30000);
        }, retryDelay);
    };
}

connect();

function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = `message ${type}`;

    div.innerHTML = `
        ${text}
        <div class="timestamp">${timeAgo()}</div>
        <div class="reactions">
            <button onclick="react(this,'👍')">👍</button>
            <button onclick="react(this,'❤️')">❤️</button>
            <button onclick="react(this,'😂')">😂</button>
        </div>
    `;

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function sendMessage() {
    let text = input.value.trim();
    if (!text && !uploadedImage) return;

    if (uploadedImage) {
        text += `<br><img src="${uploadedImage}" width="150">`;
    }

    addMessage(text, "sent");

    if (ws.readyState === 1) {
        ws.send(text);
    } else {
        queue.push(text);
    }

    input.value = "";
    uploadedImage = null;
    previewBox.classList.add("hidden");
    charCount.textContent = "0 / 500";

    simulateTyping();
}

sendBtn.onclick = sendMessage;

input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

input.addEventListener("input", () => {
    charCount.textContent = `${input.value.length} / 500`;

    if (input.value.length > 500) {
        charCount.style.color = "red";
    } else {
        charCount.style.color = "#555";
    }
});

function simulateTyping() {
    typing.classList.remove("hidden");

    setTimeout(() => {
        typing.classList.add("hidden");
    }, 2000);
}

function simulateReadReceipt() {
    console.log("Read receipt");
}

function react(button, emoji) {
    button.innerText = emoji + " 1";
}

function timeAgo() {
    return "Just now";
}

uploadBtn.onclick = () => imageUpload.click();

imageUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(event) {
        uploadedImage = event.target.result;
        previewImage.src = uploadedImage;
        previewBox.classList.remove("hidden");
    };

    reader.readAsDataURL(file);
};

function notify(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body });
    }
}

if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

/* Virtual Scroll Simulation */
for (let i = 1; i <= 30; i++) {
    addMessage("History message " + i, i % 2 ? "received" : "sent");
}
