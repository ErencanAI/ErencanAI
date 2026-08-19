"use strict";

/* =====================================================
   TÃœRKAI 10.0
   SOHBET + HAFIZA + Ä°NTERNET ARAÅTIRMASI + SES
===================================================== */


/* =====================================================
   SESLENDÄ°RME
===================================================== */

function speakText(text) {

    if (!text) {
        return;
    }

    if (!("speechSynthesis" in window)) {

        console.warn(
            "Bu tarayÄ±cÄ± seslendirmeyi desteklemiyor."
        );

        return;
    }

    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(
            String(text)
        );

 utterance.rate = 0.9;
utterance.pitch = 1.8;
utterance.volume = 1;

    window.speechSynthesis.speak(
        utterance
    );
}


/* =====================================================
   API ADRESLERÄ°
===================================================== */

const API_URL =
    "/api/chat";

const MEMORY_API_URL =
    "/api/user-memory";

const RESEARCH_API_URL =
    "/api/research";


/* =====================================================
   LOCAL STORAGE
===================================================== */

const STORAGE_KEY =
    "erencanai_pro_chats_v1";

const USER_ID_KEY =
    "erencanai_pro_user_id_v1";

const SETTINGS_KEY =
    "erencanai_pro_settings_v1";


/* =====================================================
   VARSAYILAN AYARLAR
===================================================== */

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


/* =====================================================
   AYARLARI YÃœKLE
===================================================== */

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


/* =====================================================
   AYARLARI KAYDET
===================================================== */

function saveSettings(settings) {

    try {

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(settings)
        );

    } catch (error) {

        console.error(
            "AYARLAR KAYDEDÄ°LEMEDÄ°:",
            error
        );
    }
}


/* =====================================================
   TürkAI ANA NESNESÄ°
===================================================== */

const TürkAI = {

    isThinking: false,

    chats: [],

    currentChatId: null,

    userId: null,

    lastAIReply: "",

    settings:
        loadSettings()

};


/* =====================================================
   DOM ELEMENTLERÄ°
===================================================== */

const elements = {};


/* =====================================================
   KULLANICI ID
===================================================== */

function getUserId() {

    let userId =
        localStorage.getItem(
            USER_ID_KEY
        );

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

    /* =================================================
       USER ID
    ================================================= */

    TürkAI.userId =
        getUserId();


    /* =================================================
       ELEMENTLER
    ================================================= */

    elements.chatContainer =
        document.getElementById(
            "chatContainer"
        );

    elements.chatArea =
        document.getElementById(
            "chatArea"
        );

    elements.messageInput =
        document.getElementById(
            "messageInput"
        );

    elements.sendButton =
        document.getElementById(
            "sendButton"
        );

    elements.voiceButton =
        document.getElementById(
            "voiceButton"
        );

    elements.welcome =
        document.getElementById(
            "welcome"
        );

    elements.newChatButton =
        document.getElementById(
            "newChatButton"
        );

    elements.clearChatButton =
        document.getElementById(
            "clearChatButton"
        );

    elements.chatHistory =
        document.getElementById(
            "chatHistory"
        );

    elements.menuButton =
        document.getElementById(
            "menuButton"
        );

    elements.sidebar =
        document.getElementById(
            "sidebar"
        );

    elements.searchButton =
        document.getElementById(
            "searchButton"
        );

    elements.settingsButton =
        document.getElementById(
            "settingsButton"
        );

    elements.deleteHistoryButton =
        document.getElementById(
            "deleteHistoryButton"
        );

    elements.researchButton =
        document.getElementById(
            "researchToolButton"
        );

    elements.weatherButton =
        document.getElementById(
            "weatherToolButton"
        );

    elements.memoryButton =
        document.getElementById(
            "memoryToolButton"
        );

    elements.topSettingsButton =
        document.getElementById(
            "topSettingsButton"
        );

    elements.accountButton =
        document.getElementById(
            "accountButton"
        );

    elements.chatSearchInput =
        document.getElementById(
            "chatSearchInput"
        );

    elements.searchResults =
        document.getElementById(
            "searchResults"
        );


    /* =================================================
       SOHBETLERÄ° YÃœKLE
    ================================================= */

    loadChats();


    if (
       TürkAI .chats.length ===
        0
    ) {

        createNewChat(false);

    } else {

        const lastChat =
            TürkAI.chats[0];

        openChat(
            lastChat.id
        );
    }


    /* =================================================
       GÃ–NDER BUTONU
    ================================================= */

    if (elements.sendButton) {

        elements.sendButton.addEventListener(
            "click",
            sendMessage
        );
    }


    /* =================================================
       SES BUTONU
    ================================================= */

    if (elements.voiceButton) {

        elements.voiceButton.addEventListener(
            "click",
            function () {

                if (
                    !TürkAI.lastAIReply
                ) {

                    showToastMessage(
                        "HenÃ¼z seslendirilecek bir cevap yok."
                    );

                    return;
                }

                speakText(
                    TürkAI.lastAIReply
                );
            }
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
                    event.key ===
                        "Enter" &&
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
            clearCurrentChat
        );
    }


    /* =================================================
       MOBÄ°L MENÃœ
    ================================================= */

    if (elements.menuButton) {

        elements.menuButton.addEventListener(
            "click",
            function () {

                if (
                    elements.sidebar
                ) {

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
       AYARLAR - SIDEBAR
    ================================================= */

    if (elements.settingsButton) {

        elements.settingsButton.addEventListener(
            "click",
            openSettings
        );
    }


    /* =================================================
       AYARLAR - TOPBAR
    ================================================= */

    if (
        elements.topSettingsButton
    ) {

        elements.topSettingsButton.addEventListener(
            "click",
            openSettings
        );
    }


    /* =================================================
       HESAP
    ================================================= */

    if (
        elements.accountButton
    ) {

        elements.accountButton.addEventListener(
            "click",
            function () {

                const modal =
                    document.getElementById(
                        "googleLoginModal"
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

    if (
        elements.deleteHistoryButton
    ) {

        elements.deleteHistoryButton.addEventListener(
            "click",
            deleteAllChats
        );
    }


    /* =================================================
       ARAÅTIRMA BUTONU
    ================================================= */

    if (
        elements.researchButton
    ) {

        elements.researchButton.addEventListener(
            "click",
            startResearch
        );
    }


    /* =================================================
       HAVA DURUMU BUTONU
    ================================================= */

    if (
        elements.weatherButton
    ) {

        elements.weatherButton.addEventListener(
            "click",
            startWeather
        );
    }


    /* =================================================
       HAFIZA BUTONU
    ================================================= */

    if (
        elements.memoryButton
    ) {

        elements.memoryButton.addEventListener(
            "click",
            showUserMemory
        );
    }


    /* =================================================
       Ã–NERÄ°LER
    ================================================= */

    document
        .querySelectorAll(
            ".suggestion"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const prompt =
                            button.dataset.prompt ||
                            "";

                        if (
                            !prompt ||
                            !elements.messageInput
                        ) {

                            return;
                        }

                        elements.messageInput.value =
                            prompt;

                        autoResizeInput();

                        elements.messageInput.focus();
                    }
                );
            }
        );


    /* =================================================
       MODAL KAPATMA
    ================================================= */

    document
        .querySelectorAll(
            "[data-close]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            button.dataset.close;

                        const modal =
                            document.getElementById(
                                id
                            );

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
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            function (modal) {

                modal.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target ===
                            modal
                        ) {

                            modal.classList.remove(
                                "active"
                            );
                        }
                    }
                );
            }
        );


    /* =================================================
       AYAR SWITCH'LERÄ°
    ================================================= */

    setupSettings();


    /* =================================================
       GEÃ‡MÄ°ÅÄ° GÃ–STER
    ================================================= */

    renderChatHistory();


    console.log(
        "TÃœRKAI 10.0 HAZIR"
    );

    console.log(
        "KULLANICI ID:",
       TürkAI.userId
    );
}


/* =====================================================
   AYARLARI BAÄLA
===================================================== */

function setupSettings() {

    const memorySwitch =
        document.getElementById(
            "memorySwitch"
        );

    const animationSwitch =
        document.getElementById(
            "animationSwitch"
        );

    const researchSwitch =
        document.getElementById(
            "researchSwitch"
        );


    if (memorySwitch) {

        memorySwitch.checked =
           TürkAI .settings.memory;

        memorySwitch.addEventListener(
            "change",
            function () {

               TürkAI.settings.memory =
                    memorySwitch.checked;

                saveSettings(
                    TürkAI.settings
                );
            }
        );
    }


    if (animationSwitch) {

        animationSwitch.checked =
            TürkAI.settings.animations;

        animationSwitch.addEventListener(
            "change",
            function () {

                TürkAI.settings.animations =
                    animationSwitch.checked;

                saveSettings(
                   TürkAI.settings
                );
            }
        );
    }


    if (researchSwitch) {

        researchSwitch.checked =
            TürkAI.settings.research;

        researchSwitch.addEventListener(
            "change",
            function () {

                TürkAI.settings.research =
                    researchSwitch.checked;

                saveSettings(
                TürkAI .settings
                );
            }
        );
    }
}


/* =====================================================
   AYARLARI AÃ‡
===================================================== */

function openSettings() {

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

            TürkAI.chats = [];

            return;
        }

        const data =
            JSON.parse(saved);

        if (
            Array.isArray(data)
        ) {

            TürkAI.chats =
                data;

        } else {

            TürkAI.chats = [];
        }

    } catch (error) {

        console.error(
            "SOHBET GEÃ‡MÄ°ÅÄ° OKUNAMADI:",
            error
        );

        TürkAI.chats = [];
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
                TürAI.chats
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

function createNewChat(
    showToast
) {

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


   TürkAI.chats.unshift(
        chat
    );


    TürkAI.currentChatId =
        chat.id;


    TürkAI.lastAIReply =
        "";


    saveChats();

    renderChatHistory();

    renderCurrentChat();


    if (
        showToast &&
        typeof showToastMessage ===
            "function"
    ) {

        showToastMessage(
            "Yeni sohbet oluÅŸturuldu."
        );
    }


    if (
        elements.messageInput
    ) {

        elements.messageInput.focus();
    }
}


/* =====================================================
   SOHBET AÃ‡
===================================================== */

function openChat(chatId) {

    const chat =
        TürkAI.chats.find(
            function (item) {

                return (
                    item.id ===
                    chatId
                );
            }
        );


    if (!chat) {

        return;
    }


    TürkAI.currentChatId =
        chat.id;


    /* Son AI cevabÄ±nÄ± bul */

    TürkAI.lastAIReply =
        "";


    if (
        Array.isArray(
            chat.messages
        )
    ) {

        for (
            let i =
                chat.messages.length -
                1;

            i >= 0;

            i--
        ) {

            const message =
                chat.messages[i];

            if (
                message.type &&
                message.type.includes(
                    "ai"
                ) &&
                !message.type.includes(
                    "thinking"
                )
            ) {

                TürkAI.lastAIReply =
                    String(
                        message.content ||
                        ""
                    );

                break;
            }
        }
    }


    renderChatHistory();

    renderCurrentChat();


    if (
        elements.sidebar
    ) {

        elements.sidebar.classList.remove(
            "open"
        );
    }


    if (
        elements.messageInput
    ) {

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


    if (
        title.length > 38
    ) {

        title =
            title
                .substring(
                    0,
                    38
                )
                .trim() +
            "...";
    }


    return title;
}


/* =====================================================
   GEÃ‡MÄ°ÅÄ° GÃ–STER
===================================================== */

function renderChatHistory() {

    if (
        !elements.chatHistory
    ) {

        return;
    }


    elements.chatHistory.innerHTML =
        "";


    TürkAI.chats.forEach(
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
                TürkAI.currentChatId
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

                    openChat(
                        chat.id
                    );
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

    if (
        !elements.chatContainer
    ) {

        return;
    }


    elements.chatContainer
        .querySelectorAll(
            ".message"
        )
        .forEach(
            function (message) {

                message.remove();
            }
        );


    const chat =
        TürkAI.chats.find(
            function (item) {

                return (
                    item.id ===
                    TürkAI.currentChatId
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

        if (
            elements.welcome
        ) {

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


/* =====================================================
   MESAJI EKRANA EKLE
===================================================== */

function addMessageToScreen(
    name,
    text,
    type,
    save
) {

    if (
        !elements.chatContainer
    ) {

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
    "user-avatar"
);

const userDisplayName =
    localStorage.getItem("userName") ||
    localStorage.getItem("user_name") ||
    "Sen";

avatar.textContent =
    userDisplayName
        .trim()
        .charAt(0)
        .toUpperCase();
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
            TürkAI.chats.find(
                function (item) {

                    return (
                        item.id ===
                        TürkAI.currentChatId
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
                type.includes(
                    "user"
                )
            ) {

                chat.title =
                    createTitle(
                        text
                    );
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

    if (
        TürkAI.isThinking
    ) {

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


    TürkAI.isThinking =
        true;


    hideWelcome();


    addMessage(
        "Sen",
        text,
        "user"
    );


    input.value =
        "";

    input.style.height =
        "auto";


    const thinking =
        addMessage(
            "TürkAI",
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
                                TürkAI.userId
                        })
                }
            );


        const rawText =
            await response.text();


        if (
            !response.ok
        ) {

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


        if (
            data.ok === false
        ) {

            throw new Error(
                data.reply ||
                data.error ||
                "TürkAI hata verdi."
            );
        }


        let reply =
            "";


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
                "TürkAI boÅŸ cevap gÃ¶nderdi."
            );
        }


        if (thinking) {

            thinking.message.remove();
        }


        addMessage(
            "TürkAI",
            reply,
            "ai"
        );


        /* Son cevabÄ± hafÄ±zada tut */

        TürkAI.lastAIReply =
            reply;


        console.log(
            "ERENCANAI CEVAP:",
            reply
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
            "TürkAI",
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

        TürkAI.isThinking =
            false;


        if (input) {

            input.disabled =
                false;

            input.focus();
        }


        if (
            elements.sendButton
        ) {

            elements.sendButton.disabled =
                false;
        }
    }
}


/* =====================================================
   ğŸ§  HAFIZA BUTONU
===================================================== */

async function showUserMemory() {

    if (
        TürkAI.isThinking
    ) {

        return;
    }


    hideWelcome();


    const thinking =
        addMessage(
            "TürkAI",
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
                            TürkAI.userId
                    }
                }
            );


        const rawText =
            await response.text();


        if (
            !response.ok
        ) {

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
            Array.isArray(
                data.messages
            )
                ? data.messages
                : [];


        if (thinking) {

            thinking.message.remove();
        }


        if (
            messages.length ===
            0
        ) {

            addMessage(
                "TürkAI",
                "ğŸ§  HafÄ±zam ÅŸu anda boÅŸ.",
                "ai"
            );

            return;
        }


        const recent =
            messages.slice(-20);


        let memoryText =
            "ğŸ§  HafÄ±zamda " +
            messages.length +
            " kayÄ±t bulunuyor.\n\n";


        recent.forEach(
            function (item) {

                const role =
                    item.role ===
                    "assistant"
                        ? "TürkAI"
                        : "Sen";


                const content =
                    String(
                        item.content ||
                        ""
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
            "TürkAI",
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
            "TürkAI",
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

    if (
        TürkAI.isThinking
    ) {

        return;
    }


    const input =
        elements.messageInput;


    if (!input) {

        return;
    }


    const query =
        input.value.trim();


    if (!query) {

        input.placeholder =
            "AraÅŸtÄ±rÄ±lacak konuyu yaz...";

        input.focus();

        return;
    }


   TürkAI.isThinking =
        true;


    hideWelcome();


    addMessage(
        "Sen",
        "ğŸ” " + query,
        "user"
    );


    input.value =
        "";

    input.style.height =
        "auto";


    const thinking =
        addMessage(
            "TürkAI",
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


        if (
            !response.ok
        ) {

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


        if (
            Array.isArray(
                data.sources
            ) &&
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
            "TürkAI",
            researchText,
            "ai"
        );


        TürkAI.lastAIReply =
            researchText;


    } catch (error) {

        console.error(
            "ARAÅTIRMA HATASI:",
            error
        );


        if (thinking) {

            thinking.message.remove();
        }


        addMessage(
            "TürkAI",
            "Ä°nternet araÅŸtÄ±rmasÄ± yapÄ±lamadÄ±: " +
            (
                error.message ||
                "Bilinmeyen hata"
            ),
            "error"
        );


    } finally {

        TürkAI.isThinking =
            false;


        if (input) {

            input.disabled =
                false;

            input.focus();
        }
    }
}


/* =====================================================
   ğŸŒ¤ï¸ HAVA DURUMU BUTONU
===================================================== */

function startWeather() {

    if (
        TürkAI.isThinking
    ) {

        return;
    }


    const input =
        elements.messageInput;


    if (!input) {

        return;
    }


    input.value =
        "GÃ¼ncel hava durumunu araÅŸtÄ±r ve bana bildir. Konum: ";


    input.focus();


    autoResizeInput();
}


/* =====================================================
   SOHBET TEMÄ°ZLE
===================================================== */

function clearCurrentChat() {

    const chat =
       TürkAI .chats.find(
            function (item) {

                return (
                    item.id ===
                    TürkAI.currentChatId
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


    TürkAI.lastAIReply =
        "";


    saveChats();


    renderChatHistory();

    renderCurrentChat();


    if (
        elements.messageInput
    ) {

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


    TürkAI.chats = [];


    TürkAI.currentChatId =
        null;


    TürkAI.lastAIReply =
        "";


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


    if (
        !elements.chatHistory
    ) {

        return;
    }


    elements.chatHistory.innerHTML =
        "";


    TürkAI.chats
        .filter(
            function (chat) {

                const title =
                    String(
                        chat.title ||
                        ""
                    ).toLowerCase();


                const messages =
                    JSON.stringify(
                        chat.messages ||
                        []
                    ).toLowerCase();


                return (
                    title.includes(
                        query
                    ) ||
                    messages.includes(
                        query
                    )
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
                    TürkAI.currentChatId
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

                        openChat(
                            chat.id
                        );
                    }
                );


                elements.chatHistory.appendChild(
                    button
                );
            }
        );
}


/* =====================================================
   HOÅ GELDÄ°N EKRANI
===================================================== */

function hideWelcome() {

    if (
        elements.welcome
    ) {

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

    if (
        !elements.chatArea
    ) {

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

function showToastMessage(
    text
) {

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
const proActivateButton =
    document.getElementById("proActivateButton");

const proCodeInput =
    document.getElementById("proCodeInput");

const proCodeMessage =
    document.getElementById("proCodeMessage");

if (
    proActivateButton &&
    proCodeInput &&
    proCodeMessage
) {

    proActivateButton.addEventListener(
        "click",
        async function () {

            const code =
                proCodeInput.value.trim();

            if (!code) {
                proCodeMessage.textContent =
                    "Pro kodunu gir.";
                return;
            }

            proActivateButton.disabled = true;
            proActivateButton.textContent =
                "Kontrol ediliyor...";

            try {

                const response =
                    await fetch(
                        "/api/pro/activate",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                code: code
                            })
                        }
                    );

                const data =
                    await response.json();

                if (data.ok === true) {

                    proCodeMessage.textContent =
                        "Pro başarıyla etkinleştirildi! 🚀";

                    localStorage.setItem(
                        "turkai_plan",
                        "pro"
                    );

                    proCodeInput.value = "";

                } else {

                    proCodeMessage.textContent =
                        data.message ||
                        "Geçersiz Pro kodu.";

                }

            } catch (error) {

                console.error(
                    "PRO AKTİVASYON HATASI:",
                    error
                );

                proCodeMessage.textContent =
                    "Sunucuya bağlanılamadı.";

            } finally {

                proActivateButton.disabled = false;
                proActivateButton.textContent =
                    "Pro'yu Etkinleştir";
            }
        }
    );
}
window.addEventListener("load", function () {

    if (
        typeof google === "undefined" ||
        !google.accounts ||
        !google.accounts.id
    ) {
        console.error("Google Identity Services yüklenemedi.");
        return;
    }

    const googleButton =
        document.getElementById("googleLoginButton");

    if (!googleButton) {
        return;
    }

    google.accounts.id.initialize({
        client_id: "1093913966610-21vqqf604k2liiga2ni65a07dbrph6lo.apps.googleusercontent.com",
        callback: handleGoogleLogin
    });

    google.accounts.id.renderButton(
        googleButton,
        {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 300
        }
    );
});
const googleModal =
    document.getElementById("googleLoginModal");

if (googleModal) {
    googleModal.classList.remove("open");
}
console.log("GOOGLE CALLBACK ÇALIŞTI", response);
function handleGoogleLogin(response) {

    try {

        const payload =
            JSON.parse(
                atob(
                    response.credential
                        .split(".")[1]
                        .replace(/-/g, "+")
                        .replace(/_/g, "/")
                )
            );

        const name =
            payload.name || "Google Kullanıcısı";

        const email =
            payload.email || "";

        const picture =
            payload.picture || "";

        localStorage.setItem(
            "googleUserName",
            name
        );

        localStorage.setItem(
            "googleUserEmail",
            email
        );

        localStorage.setItem(
            "googleUserPicture",
            picture
        );

        const accountAvatar =
            document.querySelector(
                ".account-avatar"
            );

        if (accountAvatar) {

            accountAvatar.textContent =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase();

        }

        const accountName =
            document.querySelector(
                ".account-info strong"
            );

        if (accountName) {
            accountName.textContent = name;
        }

        const accountStatus =
            document.querySelector(
                ".account-info small"
            );

        if (accountStatus) {
            accountStatus.textContent =
                "Google hesabı";
        }

        console.log(
            "GOOGLE GİRİŞ BAŞARILI:",
            name
        );

    } catch (error) {

        console.error(
            "GOOGLE GİRİŞ HATASI:",
            error
        );

    }
}
