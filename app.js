
"use strict";

const API_URL = "/api/chat";

const ErencanAI = {
    messages: [],
    isThinking: false
};

const elements = {};

function init() {
    elements.chatContainer = document.getElementById("chatContainer");
    elements.chatArea = document.getElementById("chatArea");
    elements.messageInput = document.getElementById("messageInput");
    elements.sendButton = document.getElementById("sendButton");
    elements.welcome = document.getElementById("welcome");
    elements.newChatButton = document.getElementById("newChatButton");
    elements.clearChatButton = document.getElementById("clearChatButton");

    console.log("ERENCANAI FRONTEND BAÅLADI");

    if (!elements.messageInput) {
        console.error("messageInput YOK");
        return;
    }

    if (!elements.sendButton) {
        console.error("sendButton YOK");
        return;
    }

    if (!elements.chatContainer) {
        console.error("chatContainer YOK");
        return;
    }

    // Butonun form gÃ¶ndermesini engelle
    elements.sendButton.type = "button";

    elements.sendButton.onclick = function (event) {
        event.preventDefault();
        sendMessage();
    };

    elements.messageInput.onkeydown = function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    if (elements.newChatButton) {
        elements.newChatButton.type = "button";
        elements.newChatButton.onclick = newChat;
    }

    if (elements.clearChatButton) {
        elements.clearChatButton.type = "button";
        elements.clearChatButton.onclick = newChat;
    }

    console.log("ERENCANAI FRONTEND HAZIR");
}

async function sendMessage() {
    if (ErencanAI.isThinking) {
        return;
    }

    const input = elements.messageInput;

    if (!input) {
        showError("Mesaj kutusu bulunamadÄ±.");
        return;
    }

    const text = input.value.trim();

    if (!text) {
        return;
    }

    console.log("MESAJ:", text);

    ErencanAI.isThinking = true;

    hideWelcome();

    addMessage("Sen", text, "user");

    input.value = "";

    const thinking = addMessage(
        "ErencanAI",
        "DÃ¼ÅŸÃ¼nÃ¼yorum...",
        "ai thinking-message"
    );

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                message: text
            })
        });

        console.log("API STATUS:", response.status);

        const data = await response.json();

        console.log("API CEVABI:", data);

        if (!response.ok || data.ok === false) {
            throw new Error(
                data.reply ||
                data.error ||
                "API hatasÄ±: " + response.status
            );
        }

        const reply = String(
            data.reply ||
            data.response ||
            data.message ||
            ""
        ).trim();

        if (!reply) {
            throw new Error("AI boÅŸ cevap gÃ¶nderdi.");
        }

        if (thinking) {
            thinking.remove();
        }

        addMessage("ErencanAI", reply, "ai");

    } catch (error) {
        console.error("ERENCANAI HATASI:", error);

        if (thinking) {
            thinking.remove();
        }

        addMessage(
            "ErencanAI",
            "Hata: " + error.message,
            "error"
        );

    } finally {
        ErencanAI.isThinking = false;
    }
}

function addMessage(name, text, type) {
    if (!elements.chatContainer) {
        return null;
    }

    const message = document.createElement("div");

    message.className = "message";

    if (type) {
        type.split(" ").forEach(function (className) {
            message.classList.add("message-" + className);
        });
    }

    const nameElement = document.createElement("strong");
    nameElement.textContent = name;

    const textElement = document.createElement("div");
    textElement.className = "message-text";
    textElement.textContent = text;

    message.appendChild(nameElement);
    message.appendChild(textElement);

    elements.chatContainer.appendChild(message);

    ErencanAI.messages.push({
        role: type === "user" ? "user" : "assistant",
        name: name,
        content: text,
        time: Date.now()
    });

    scrollBottom();

    return message;
}

function hideWelcome() {
    if (elements.welcome) {
        elements.welcome.style.display = "none";
    }
}

function newChat() {
    if (!elements.chatContainer) {
        return;
    }

    elements.chatContainer
        .querySelectorAll(".message")
        .forEach(function (message) {
            message.remove();
        });

    ErencanAI.messages = [];

    if (elements.welcome) {
        elements.welcome.style.display = "";
    }
}

function showError(message) {
    addMessage("ErencanAI", message, "error");
}

function scrollBottom() {
    if (!elements.chatArea) {
        return;
    }

    requestAnimationFrame(function () {
        elements.chatArea.scrollTop =
            elements.chatArea.scrollHeight;
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}



