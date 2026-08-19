"use strict";

/* =====================================================
TÃœRKAI 10.0
SOHBET + HAFIZA + Ä°NTERNET ARAÅTIRMASI
===================================================== */

const API_URL = "/api/chat";
const MEMORY_API_URL = "/api/user-memory";
const RESEARCH_API_URL = "/api/research";

const STORAGE_KEY = "erencanai_pro_chats_v1";
const USER_ID_KEY = "erencanai_pro_user_id_v1";
const SETTINGS_KEY = "erencanai_pro_settings_v1";
const DEFAULT_SETTINGS = {

    memory: true,

    animations: true,

    research: true,

    advancedCoding: true,

    certainty: true,

    sources: true,

    deepResearch: true,

    autoMode: true,

    securityCheck: true

};


function loadSettings() {

    try {

        const saved =
            localStorage.getItem(
                SETTINGS_KEY
            );

        if (!saved) {

            return {
                ...DEFAULT_SETTINGS
            };
        }

        return {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(saved)
        };

    } catch (error) {

        console.error(
            "AYARLAR YÃœKLENEMEDÄ°:",
            error
        );

        return {
            ...DEFAULT_SETTINGS
        };
    }
}


function saveSettings(settings) {

    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );
}
const ErencanAI = {
    isThinking: false,
    chats: [],
    currentChatId: null,
    userId: null,
    settings: loadSettings()
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
BAÅLANGIÃ‡
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

    elements.researchButton =
        document.getElementById("researchToolButton");

    elements.memoryButton =
        document.getElementById("memoryToolButton");

    loadChats();

    if (ErencanAI.chats.length === 0) {

        createNewChat(false);

    } else {

        const lastChat =
            ErencanAI.chats[0];

        openChat(lastChat.id);
    }

    /* =================================================
    GÃ–NDER
    ================================================= */

    if (elements.sendButton) {

        elements.sendButton.addEventListener(
            "click",
            sendMessage
        );
    }

    /* =================================================
    ENTER
    ================================================= */

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

    /* =================================================
    YENÄ° SOHBET
    ================================================= */

    if (elements.newChatButton) {

        elements.newChatButton.addEventListener(
            "click",
            function () {

                createNewChat(true);
            }
        );
    }

    /* =================================================
    SOHBET TEMÄ°ZLE
    ================================================= */

    if (elements.clearChatButton) {

        elements.clearChatButton.addEventListener(
            "click",
            function () {

                clearCurrentChat();
            }
        );
    }

    /* =================================================
    MOBÄ°L MENÃœ
    ================================================= */

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

    /* =================================================
    ARAMA
    ================================================= */

    if (elements.searchButton) {

        elements.searchButton.addEventListener(
            "click",
            searchChats
        );
    }

    /* =================================================
    AYARLAR
    ================================================= */

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

    /* =================================================
    TÃœM GEÃ‡MÄ°ÅÄ° SÄ°L
    ================================================= */

    if (elements.deleteHistoryButton) {

        elements.deleteHistoryButton.addEventListener(
            "click",
            deleteAllChats
        );
    }

    /* =================================================
    Ä°NTERNET ARAÅTIRMASI BUTONU
    ================================================= */

    if (elements.researchButton) {

        elements.researchButton.addEventListener(
            "click",
            startResearch
        );
    }

    /* =================================================
    HAFIZA BUTONU
    ================================================= */

    if (elements.memoryButton) {

        elements.memoryButton.addEventListener(
            "click",
            showUserMemory
        );
    }

    /* =================================================
    Ã–NERÄ°LER
    ================================================= */

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

    /* =================================================
    MODAL KAPATMA
    ================================================= */

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

    /* =================================================
    MODAL DIÅINA TIKLAMA
    ================================================= */

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
        "TÃœRKAI 10.0 HAZIR"
    );

    console.log(
        "KULLANICI ID:",
        ErencanAI.userId
    );
}

/* =====================================================
SOHBETLERÄ° YÃœKLE
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
            "SOHBET GEÃ‡MÄ°ÅÄ° OKUNAMADI:",
            error
        );

        ErencanAI.chats = [];
    }
}

/* =====================================================
SOHBETLERÄ° KAYDET
===================================================== */

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
            "SOHBET GEÃ‡MÄ°ÅÄ° KAYDEDÄ°LEMEDÄ°:",
            error
        );
    }
}

/* =====================================================
YENÄ° SOHBET
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
            "Yeni sohbet oluÅŸturuldu."
        );
    }

    if (elements.messageInput) {

        elements.messageInput.focus();
    }
}

/* =====================================================
SOHBET AÃ‡
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
BAÅLIK
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
GEÃ‡MÄ°ÅÄ° GÃ–STER
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
MEVCUT SOHBETÄ° GÃ–STER
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
ANA AI MESAJI
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
            "DÃ¼ÅŸÃ¼nÃ¼yor...",
            "ai thinking"
        );

    try {

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
                "Sunucu hatasÄ± (" +
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
                "Sunucudan geÃ§erli JSON gelmedi."
            );
        }

        if (!data) {

            throw new Error(
                "Sunucudan cevap alÄ±namadÄ±."
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
                "ErencanAI boÅŸ cevap gÃ¶nderdi."
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
ğŸ§  HAFIZA BUTONU
===================================================== */

async function showUserMemory() {

    if (ErencanAI.isThinking) {
        return;
    }

    hideWelcome();

    const thinking =
        addMessage(
            "ErencanAI",
            "ğŸ§  HafÄ±zam kontrol ediliyor...",
            "ai thinking"
        );

    try {

        const response =
            await fetch(
                MEMORY_API_URL,
                {

                    method:
                        "GET",

                    headers: {

                        "Accept":
                            "application/json",

                        "X-User-ID":
                            ErencanAI.userId
                    }
                }
            );

        const rawText =
            await response.text();

        if (!response.ok) {

            throw new Error(
                "HafÄ±za sunucu hatasÄ± (" +
                response.status +
                ")"
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
                "HafÄ±za API'sinden geÃ§ersiz cevap geldi."
            );
        }

        if (
            !data ||
            data.ok !== true
        ) {

            throw new Error(
                data &&
                data.reply
                    ? data.reply
                    : "HafÄ±za alÄ±namadÄ±."
            );
        }

        const messages =
            Array.isArray(data.messages)
                ? data.messages
                : [];

        if (thinking) {

            thinking.message.remove();
        }

        if (messages.length === 0) {

            addMessage(
                "ErencanAI",
                "ğŸ§  HafÄ±zam ÅŸu anda boÅŸ.",
                "ai"
            );

            return;
        }

        /*
         * Son 20 hafÄ±za mesajÄ±nÄ± gÃ¶ster.
         * BÃ¶ylece butona basÄ±nca ekran aÅŸÄ±rÄ±
         * uzun bir mesajla dolmaz.
         */

        const recent =
            messages.slice(-20);

        let memoryText =
            "ğŸ§  HafÄ±zamda " +
            messages.length +
            " kayÄ±t bulunuyor.\n\n";

        recent.forEach(
            function (item) {

                const role =
                    item.role === "assistant"
                        ? "ErencanAI"
                        : "Sen";

                const content =
                    String(
                        item.content || ""
                    ).trim();

                if (!content) {
                    return;
                }

                memoryText +=
                    role +
                    ": " +
                    content +
                    "\n\n";
            }
        );

        addMessage(
            "ErencanAI",
            memoryText.trim(),
            "ai"
        );

    } catch (error) {

        console.error(
            "HAFIZA HATASI:",
            error
        );

        if (thinking) {

            thinking.message.remove();
        }

        addMessage(
            "ErencanAI",
            "HafÄ±zaya ulaÅŸÄ±lamadÄ±: " +
            (
                error.message ||
                "Bilinmeyen hata"
            ),
            "error"
        );
    }
}

/* =====================================================
ğŸ” Ä°NTERNET ARAÅTIRMASI
===================================================== */

async function startResearch() {

    if (ErencanAI.isThinking) {
        return;
    }

    const input =
        elements.messageInput;

    if (!input) {
        return;
    }

    const query =
        input.value
            .trim();

    /*
     * Butona basÄ±ldÄ±ÄŸÄ±nda kutu boÅŸsa
     * kullanÄ±cÄ±dan konu ister.
     */

    if (!query) {

        input.value =
            "";

        input.placeholder =
            "AraÅŸtÄ±rÄ±lacak konuyu yaz...";

        input.focus();

        return;
    }

    ErencanAI.isThinking =
        true;

    hideWelcome();

    addMessage(
        "Sen",
        "ğŸ” " + query,
        "user"
    );

    input.value = "";

    input.style.height =
        "auto";

    const thinking =
        addMessage(
            "ErencanAI",
            "ğŸ” Ä°nternette araÅŸtÄ±rÄ±yor...",
            "ai thinking"
        );

    try {

        const response =
            await fetch(
                RESEARCH_API_URL,
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

                            query:
                                query
                        })
                }
            );

        const rawText =
            await response.text();

        if (!response.ok) {

            throw new Error(
                "AraÅŸtÄ±rma sunucu hatasÄ± (" +
                response.status +
                ")"
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
                "AraÅŸtÄ±rma API'sinden geÃ§ersiz cevap geldi."
            );
        }

        if (
            !data ||
            data.ok !== true
        ) {

            throw new Error(
                data &&
                data.reply
                    ? data.reply
                    : "Ä°nternet araÅŸtÄ±rmasÄ± baÅŸarÄ±sÄ±z."
            );
        }

        if (thinking) {

            thinking.message.remove();
        }

        let researchText =
            String(
                data.text ||
                data.reply ||
                ""
            ).trim();

        if (!researchText) {

            researchText =
                "AraÅŸtÄ±rma sonucu bulunamadÄ±.";
        }

        /*
         * Kaynaklar varsa cevabÄ±n sonuna ekle.
         */

        if (
            Array.isArray(data.sources) &&
            data.sources.length > 0
        ) {

            researchText +=
                "\n\nKaynaklar:";

            data.sources
                .slice(0, 6)
                .forEach(
                    function (source) {

                        if (!source) {
                            return;
                        }

                        const title =
                            source.title ||
                            source.name ||
                            "Kaynak";

                        const url =
                            source.url ||
                            source.link ||
                            "";

                        researchText +=
                            "\nâ€¢ " +
                            title;

                        if (url) {

                            researchText +=
                                "\n  " +
                                url;
                        }
                    }
                );
        }

        addMessage(
            "ErencanAI",
            researchText,
            "ai"
        );

    } catch (error) {

        console.error(
            "ARAÅTIRMA HATASI:",
            error
        );

        if (thinking) {

            thinking.message.remove();
        }

        addMessage(
            "ErencanAI",
            "Ä°nternet araÅŸtÄ±rmasÄ± yapÄ±lamadÄ±: " +
            (
                error.message ||
                "Bilinmeyen hata"
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
    }
}

/* =====================================================
SOHBET TEMÄ°ZLE
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
TÃœM GEÃ‡MÄ°ÅÄ° SÄ°L
===================================================== */

function deleteAllChats() {

    const confirmed =
        window.confirm(
            "TÃ¼m sohbet geÃ§miÅŸi silinsin mi?"
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
HOÅ GELDÄ°N
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
BÄ°LDÄ°RÄ°M
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
BAÅLAT
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


