"use strict";

/* =====================================================
ERENCANAI PRO 8.00
SOHBET GEÇMİŞİ + LOCALSTORAGE + ÇOKLU KULLANICI
===================================================== */

const API_URL = "/api/chat";

const STORAGE_KEY = "erencanai_pro_chats_v1";
const USER_ID_KEY = "erencanai_pro_user_id_v1";

const ErencanAI = {
    isThinking: false,
    chats: [],
    currentChatId: null,
    userId: null
};

const elements = {};

/* =====================================================
KULLANICI ID
===================================================== */

function getUserId() {

    let userId =
        localStorage.getItem(USER_ID_KEY);

    if (!userId) {

        userId =
            "user_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 12);

        localStorage.setItem(
            USER_ID_KEY,
            userId
        );
    }

    return userId;
}

/* =====================================================
BAŞLANGIÇ
===================================================== */

function init() {

    ErencanAI.userId =
        getUserId();

    elements.chatContainer =
        document.getElementById("chatContainer");

    elements.chatArea =
        document.getElementById("chatArea");

    elements.messageInput =
        document.getElementById("messageInput");

    elements.sendButton =
        document.getElementById("sendButton");

    elements.welcome =
        document.getElementById("welcome");

    elements.newChatButton =
        document.getElementById("newChatButton");

    elements.clearChatButton =
        document.getElementById("clearChatButton");

    elements.chatHistory =
        document.getElementById("chatHistory");

    elements.menuButton =
        document.getElementById("menuButton");

    elements.sidebar =
        document.getElementById("sidebar");

    elements.searchButton =
        document.getElementById("searchButton");

    elements.settingsButton =
        document.getElementById("settingsButton");

    elements.deleteHistoryButton =
        document.getElementById("deleteHistoryButton");

    loadChats();

    if (ErencanAI.chats.length === 0) {

        createNewChat(false);

    } else {

        const lastChat =
            ErencanAI.chats[0];

        openChat(lastChat.id);
    }

    if (elements.sendButton) {

        elements.sendButton.addEventListener(
            "click",
            sendMessage
        );
    }

    if (elements.messageInput) {

        elements.messageInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();
                }
            }
        );

        elements.messageInput.addEventListener(
            "input",
            autoResizeInput
        );
    }

    if (elements.newChatButton) {

        elements.newChatButton.addEventListener(
            "click",
            function () {

                createNewChat(true);
            }
        );
    }

    if (elements.clearChatButton) {

        elements.clearChatButton.addEventListener(
            "click",
            function () {

                clearCurrentChat();
            }
        );
    }

    if (elements.menuButton) {

        elements.menuButton.addEventListener(
            "click",
            function () {

                if (elements.sidebar) {

                    elements.sidebar.classList.toggle(
                        "open"
                    );
                }
            }
        );
    }

    if (elements.searchButton) {

        elements.searchButton.addEventListener(
            "click",
            searchChats
        );
    }

    if (elements.settingsButton) {

        elements.settingsButton.addEventListener(
            "click",
            function () {

                const modal =
                    document.getElementById(
                        "settingsModal"
                    );

                if (modal) {

                    modal.classList.add(
                        "active"
                    );
                }
            }
        );
    }

    if (elements.deleteHistoryButton) {

        elements.deleteHistoryButton.addEventListener(
            "click",
            deleteAllChats
        );
    }

    document
        .querySelectorAll(".suggestion")
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const prompt =
                            button.dataset.prompt || "";

                        if (!prompt) {
                            return;
                        }

                        elements.messageInput.value =
                            prompt;

                        sendMessage();
                    }
                );
            }
        );

    document
        .querySelectorAll("[data-close]")
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            button.dataset.close;

                        const modal =
                            document.getElementById(id);

                        if (modal) {

                            modal.classList.remove(
                                "active"
                            );
                        }
                    }
                );
            }
        );

    document
        .querySelectorAll(".modal")
        .forEach(
            function (modal) {

                modal.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target === modal
                        ) {

                            modal.classList.remove(
                                "active"
                            );
                        }
                    }
                );
            }
        );

    renderChatHistory();

    console.log(
        "ERENCANAI PRO 8.00 HAZIR"
    );

    console.log(
        "KULLANICI ID:",
        ErencanAI.userId
    );
}

/* =====================================================
SOHBET VERİLERİ
===================================================== */

function loadChats() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!saved) {

            ErencanAI.chats = [];

            return;
        }

        const data =
            JSON.parse(saved);

        if (Array.isArray(data)) {

            ErencanAI.chats = data;

        } else {

            ErencanAI.chats = [];
        }

    } catch (error) {

        console.error(
            "SOHBET GEÇMİŞİ OKUNAMADI:",
            error
        );

        ErencanAI.chats = [];
    }
}

function saveChats() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                ErencanAI.chats
            )
        );

    } catch (error) {

        console.error(
            "SOHBET GEÇMİŞİ KAYDEDİLEMEDİ:",
            error
        );
    }
}

/* =====================================================
YENİ SOHBET
===================================================== */

function createNewChat(showToast) {

    const chat = {

        id:
            "chat_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 8),

        title:
            "Yeni sohbet",

        messages: [],

        createdAt:
            Date.now(),

        updatedAt:
            Date.now()
    };

    ErencanAI.chats.unshift(chat);

    ErencanAI.currentChatId =
        chat.id;

    saveChats();

    renderChatHistory();

    renderCurrentChat();

    if (
        showToast &&
        typeof showToastMessage === "function"
    ) {

        showToastMessage(
            "Yeni sohbet oluşturuldu."
        );
    }

    if (elements.messageInput) {

        elements.messageInput.focus();
    }
}

/* =====================================================
SOHBET AÇ
===================================================== */

function openChat(chatId) {

    const chat =
        ErencanAI.chats.find(
            function (item) {

                return item.id === chatId;
            }
        );

    if (!chat) {
        return;
    }

    ErencanAI.currentChatId =
        chat.id;

    renderChatHistory();

    renderCurrentChat();

    if (elements.sidebar) {

        elements.sidebar.classList.remove(
            "open"
        );
    }

    if (elements.messageInput) {

        elements.messageInput.focus();
    }
}

/* =====================================================
SOHBET BAŞLIĞI
===================================================== */

function createTitle(text) {

    let title =
        String(text || "")
            .replace(/\s+/g, " ")
            .trim();

    if (!title) {

        return "Yeni sohbet";
    }

    if (title.length > 38) {

        title =
            title.substring(0, 38)
                .trim() +
            "...";
    }

    return title;
}

/* =====================================================
SOHBET GEÇMİŞİ
===================================================== */

function renderChatHistory() {

    if (!elements.chatHistory) {
        return;
    }

    elements.chatHistory.innerHTML = "";

    ErencanAI.chats.forEach(
        function (chat) {

            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                "history-item";

            if (
                chat.id ===
                ErencanAI.currentChatId
            ) {

                button.classList.add(
                    "active"
                );
            }

            button.textContent =
                chat.title ||
                "Yeni sohbet";

            button.title =
                chat.title ||
                "Yeni sohbet";

            button.addEventListener(
                "click",
                function () {

                    openChat(chat.id);
                }
            );

            elements.chatHistory.appendChild(
                button
            );
        }
    );
}

/* =====================================================
MEVCUT SOHBETİ EKRANA BAS
===================================================== */

function renderCurrentChat() {

    if (!elements.chatContainer) {
        return;
    }

    elements.chatContainer
        .querySelectorAll(".message")
        .forEach(
            function (message) {

                message.remove();
            }
        );

    const chat =
        ErencanAI.chats.find(
            function (item) {

                return (
                    item.id ===
                    ErencanAI.currentChatId
                );
            }
        );

    if (!chat) {
        return;
    }

    if (
        chat.messages &&
        chat.messages.length > 0
    ) {

        hideWelcome();

        chat.messages.forEach(
            function (message) {

                addMessageToScreen(
                    message.name,
                    message.content,
                    message.type,
                    false
                );
            }
        );

    } else {

        if (elements.welcome) {

            elements.welcome.style.display =
                "";
        }
    }

    scrollBottom();
}

/* =====================================================
MESAJ EKLE
===================================================== */

function addMessage(
    name,
    text,
    type
) {

    return addMessageToScreen(
        name,
        text,
        type,
        true
    );
}

function addMessageToScreen(
    name,
    text,
    type,
    save
) {

    if (!elements.chatContainer) {
        return null;
    }

    const message =
        document.createElement(
            "div"
        );

    message.className =
        "message";

    if (type) {

        type
            .split(" ")
            .forEach(
                function (className) {

                    if (className) {

                        message.classList.add(
                            "message-" +
                            className
                        );
                    }
                }
            );
    }

    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        "avatar";

    if (
        type &&
        type.includes("user")
    ) {

        avatar.classList.add(
            "user-avatar"
        );

        avatar.textContent =
            "S";

    } else {

        avatar.classList.add(
            "ai-avatar"
        );

        avatar.textContent =
            "E";
    }

    const body =
        document.createElement(
            "div"
        );

    body.className =
        "message-body";

    const nameElement =
        document.createElement(
            "div"
        );

    nameElement.className =
        "message-name";

    nameElement.textContent =
        name;

    const textElement =
        document.createElement(
            "div"
        );

    textElement.className =
        "message-content";

    textElement.textContent =
        text;

    body.appendChild(
        nameElement
    );

    body.appendChild(
        textElement
    );

    message.appendChild(
        avatar
    );

    message.appendChild(
        body
    );

    elements.chatContainer.appendChild(
        message
    );

    if (save) {

        const chat =
            ErencanAI.chats.find(
                function (item) {

                    return (
                        item.id ===
                        ErencanAI.currentChatId
                    );
                }
            );

        if (chat) {

            if (
                !Array.isArray(
                    chat.messages
                )
            ) {

                chat.messages = [];
            }

            chat.messages.push({

                name:
                    name,

                content:
                    text,

                type:
                    type,

                time:
                    Date.now()
            });

            chat.updatedAt =
                Date.now();

            if (
                chat.title ===
                "Yeni sohbet" &&
                type &&
                type.includes("user")
            ) {

                chat.title =
                    createTitle(text);
            }

            saveChats();

            renderChatHistory();
        }
    }

    scrollBottom();

    return {

        message:
            message,

        textElement:
            textElement
    };
}

/* =====================================================
MESAJ GÖNDER
===================================================== */

async function sendMessage() {

    if (ErencanAI.isThinking) {
        return;
    }

    const input =
        elements.messageInput;

    if (!input) {
        return;
    }

    const text =
        input.value.trim();

    if (!text) {
        return;
    }

    ErencanAI.isThinking =
        true;

    hideWelcome();

    addMessage(
        "Sen",
        text,
        "user"
    );

    input.value = "";

    input.style.height =
        "auto";

    const thinking =
        addMessage(
            "ErencanAI",
            "Düşünüyor...",
            "ai thinking"
        );

    try {

        console.log(
            "API İSTEĞİ:",
            API_URL
        );

        const response =
            await fetch(
                API_URL,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message:
                                text,

                            userId:
                                ErencanAI.userId
                        })
                }
            );

        const rawText =
            await response.text();

        if (!response.ok) {

            throw new Error(
                "Sunucu hatası (" +
                response.status +
                "): " +
                rawText
            );
        }

        let data;

        try {

            data =
                JSON.parse(
                    rawText
                );

        } catch (error) {

            throw new Error(
                "Sunucudan geçerli JSON gelmedi."
            );
        }

        if (!data) {

            throw new Error(
                "Sunucudan cevap alınamadı."
            );
        }

        if (data.ok === false) {

            throw new Error(
                data.reply ||
                data.error ||
                "ErencanAI hata verdi."
            );
        }

        let reply = "";

        if (
            typeof data.reply ===
            "string"
        ) {

            reply =
                data.reply.trim();
        }

        if (
            !reply &&
            typeof data.response ===
            "string"
        ) {

            reply =
                data.response.trim();
        }

        if (
            !reply &&
            data.message
        ) {

            if (
                typeof data.message ===
                "string"
            ) {

                reply =
                    data.message.trim();
            }

            if (
                typeof data.message ===
                    "object" &&
                typeof data.message.content ===
                    "string"
            ) {

                reply =
                    data.message.content.trim();
            }
        }

        if (!reply) {

            throw new Error(
                "ErencanAI boş cevap gönderdi."
            );
        }

        if (thinking) {

            thinking.message.remove();
        }

        addMessage(
            "ErencanAI",
            reply,
            "ai"
        );

    } catch (error) {

        console.error(
            "ERENCANAI HATASI:",
            error
        );

        if (thinking) {

            thinking.message.remove();
        }

        addMessage(
            "ErencanAI",
            "Hata: " +
            (
                error &&
                error.message
                    ? error.message
                    : "Bilinmeyen hata"
            ),
            "error"
        );

    } finally {

        ErencanAI.isThinking =
            false;

        if (input) {

            input.disabled =
                false;

            input.focus();
        }

        if (elements.sendButton) {

            elements.sendButton.disabled =
                false;
        }
    }
}

/* =====================================================
SOHBET TEMİZLE
===================================================== */

function clearCurrentChat() {

    const chat =
        ErencanAI.chats.find(
            function (item) {

                return (
                    item.id ===
                    ErencanAI.currentChatId
                );
            }
        );

    if (!chat) {
        return;
    }

    chat.messages = [];

    chat.title =
        "Yeni sohbet";

    chat.updatedAt =
        Date.now();

    saveChats();

    renderChatHistory();

    renderCurrentChat();

    if (elements.messageInput) {

        elements.messageInput.focus();
    }
}

/* =====================================================
TÜM GEÇMİŞİ SİL
===================================================== */

function deleteAllChats() {

    const confirmed =
        window.confirm(
            "Tüm sohbet geçmişi silinsin mi?"
        );

    if (!confirmed) {
        return;
    }

    ErencanAI.chats = [];

    ErencanAI.currentChatId =
        null;

    localStorage.removeItem(
        STORAGE_KEY
    );

    createNewChat(false);

    renderChatHistory();

    renderCurrentChat();
}

/* =====================================================
SOHBETLERDE ARA
===================================================== */

function searchChats() {

    const search =
        window.prompt(
            "Sohbetlerde ne aramak istiyorsun?"
        );

    if (search === null) {
        return;
    }

    const query =
        search
            .trim()
            .toLowerCase();

    if (!query) {

        renderChatHistory();

        return;
    }

    if (!elements.chatHistory) {
        return;
    }

    elements.chatHistory.innerHTML =
        "";

    ErencanAI.chats
        .filter(
            function (chat) {

                const title =
                    String(
                        chat.title || ""
                    ).toLowerCase();

                const messages =
                    JSON.stringify(
                        chat.messages || []
                    ).toLowerCase();

                return (
                    title.includes(query) ||
                    messages.includes(query)
                );
            }
        )
        .forEach(
            function (chat) {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "history-item";

                if (
                    chat.id ===
                    ErencanAI.currentChatId
                ) {

                    button.classList.add(
                        "active"
                    );
                }

                button.textContent =
                    chat.title ||
                    "Yeni sohbet";

                button.addEventListener(
                    "click",
                    function () {

                        openChat(chat.id);
                    }
                );

                elements.chatHistory.appendChild(
                    button
                );
            }
        );
}

/* =====================================================
HOŞ GELDİN
===================================================== */

function hideWelcome() {

    if (elements.welcome) {

        elements.welcome.style.display =
            "none";
    }
}

/* =====================================================
INPUT BOYUTU
===================================================== */

function autoResizeInput() {

    const input =
        elements.messageInput;

    if (!input) {
        return;
    }

    input.style.height =
        "auto";

    input.style.height =
        Math.min(
            input.scrollHeight,
            180
        ) +
        "px";
}

/* =====================================================
SCROLL
===================================================== */

function scrollBottom() {

    if (!elements.chatArea) {
        return;
    }

    requestAnimationFrame(
        function () {

            elements.chatArea.scrollTop =
                elements.chatArea.scrollHeight;
        }
    );
}

/* =====================================================
BİLDİRİM
===================================================== */

function showToastMessage(text) {

    const toast =
        document.getElementById(
            "toast"
        );

    const toastText =
        document.getElementById(
            "toastText"
        );

    if (!toast) {
        return;
    }

    if (toastText) {

        toastText.textContent =
            text;
    }

    toast.classList.add(
        "active"
    );

    setTimeout(
        function () {

            toast.classList.remove(
                "active"
            );

        },
        1800
    );
}

/* =====================================================
BAŞLAT
===================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}