"use strict";

/* =========================================================
   TÜRKAI 10.0 — SUNUCU
   Parça 1/3
========================================================= */

require("dotenv").config();

const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");


/* =========================================================
   SUNUCU OLUŞTUR
========================================================= */

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


/* =========================================================
   ORTAM DEĞİŞKENLERİ
========================================================= */

const PORT = Number(process.env.PORT) || 3000;

const TURKAI_PRO_CODE = process.env.TURKAI_PRO_CODE || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";


/* =========================================================
   MODEL SABİTLERİ
========================================================= */

const GROQ_MODEL = "openai/gpt-oss-20b";
const CEREBRAS_MODEL = "gpt-oss-120b";

const GROQ_URL =
    "https://api.groq.com/openai/v1/chat/completions";

const CEREBRAS_URL =
    "https://api.cerebras.ai/v1/chat/completions";

const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";


/* =========================================================
   DOSYA YOLLARI
========================================================= */

const USER_PLANS_FILE =
    path.join(__dirname, "user_plans.json");

const GROQ_DAILY_USAGE_FILE =
    path.join(__dirname, "groq_daily_usage.json");

const DAILY_USAGE_FILE =
    path.join(__dirname, "daily_usage.json");

const MEMORY_FILE =
    path.join(__dirname, "memory.json");

const USER_MEMORY_FILE =
    path.join(__dirname, "users_memory.json");

const KNOWLEDGE_FILE =
    path.join(__dirname, "knowledge.json");

const UPLOADS_DIR =
    path.join(__dirname, "uploads");


/* =========================================================
   SABİTLER
========================================================= */

const REQUEST_TIMEOUT = 30000;
const RESEARCH_TIMEOUT = 12000;
const MAX_RETRIES = 0;

const MAX_MESSAGE_LENGTH = 12000;
const MAX_REPLY_LENGTH = 30000;
const MAX_MEMORY_MESSAGES = 400;
const MAX_USER_MEMORY_MESSAGES = 400;
const MAX_SEARCH_RESULTS = 6;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const FREE_CONTEXT_MESSAGES = 2;
const PRO_CONTEXT_MESSAGES = 5;
const PLUS_CONTEXT_MESSAGES = 15;
const ULTRA_CONTEXT_MESSAGES = 30;


/* =========================================================
   PLAN LİMİTLERİ
========================================================= */

const DAILY_MESSAGE_LIMITS = {
    free: 50,
    pro: 100,
    plus: 200,
    ultra: 500,
    developer: 400
};

const PLAN_PRICES = {
    free: 0,
    pro: 250,
    plus: 500
};

const SUBSCRIPTION_PLANS = {

    free: {
        name: "Free",
        price: 0,
        currency: "TRY",
        period: "monthly"
    },

    pro: {
        name: "Pro",
        price: 100,
        currency: "TRY",
        period: "monthly"
    },

    plus: {
        name: "Plus",
        price: 400,
        currency: "TRY",
        period: "monthly"
    },

    ultra: {
        name: "Ultra",
        price: 800,
        currency: "TRY",
        period: "monthly"
    }

};


/* =========================================================
   İZİN VERİLEN DOSYA TÜRLERİ
========================================================= */

const ALLOWED_FILE_EXTENSIONS = [
    ".txt", ".json", ".js", ".html", ".css",
    ".py", ".cs", ".md", ".csv", ".pdf",
    ".docx", ".png", ".jpg", ".jpeg", ".webp"
];


/* =========================================================
   UPLOADS KLASÖRÜ
========================================================= */

try {

    if (!fs.existsSync(UPLOADS_DIR)) {

        fs.mkdirSync(UPLOADS_DIR, {
            recursive: true
        });

    }

} catch (error) {

    console.error(
        "UPLOADS OLUŞTURULAMADI:",
        error.message
    );

}


/* =========================================================
   PLAN — OKU
========================================================= */

function loadUserPlans() {

    if (!fs.existsSync(USER_PLANS_FILE)) {

        fs.writeFileSync(
            USER_PLANS_FILE,
            JSON.stringify({}, null, 2),
            "utf8"
        );

        return {};

    }


    try {

        return JSON.parse(
            fs.readFileSync(USER_PLANS_FILE, "utf8")
        );

    } catch (error) {

        console.error(
            "PLANLAR OKUNAMADI:",
            error.message
        );

        return {};

    }

}


/* =========================================================
   PLAN — YAZ
========================================================= */

function saveUserPlans(plans) {

    try {

        fs.writeFileSync(
            USER_PLANS_FILE,
            JSON.stringify(plans, null, 2),
            "utf8"
        );

        return true;

    } catch (error) {

        console.error(
            "PLANLAR KAYDEDİLEMEDİ:",
            error.message
        );

        return false;

    }

}


/* =========================================================
   KULLANICI PLANI
========================================================= */

function getUserPlan(userId) {

    if (!userId) {
        return "free";
    }


    const plans = loadUserPlans();


    if (
        plans[userId] &&
        plans[userId].plan
    ) {
        return plans[userId].plan;
    }


    return "free";

}


/* =========================================================
   PLAN NORMALLEŞTİR
========================================================= */

function normalizeSubscriptionPlan(plan) {

    const cleanPlan =
        String(plan || "").toLowerCase().trim();


    if (
        cleanPlan === "pro" ||
        cleanPlan === "plus" ||
        cleanPlan === "ultra"
    ) {
        return cleanPlan;
    }


    return "free";

}


/* =========================================================
   ABONELİK BİLGİSİ
========================================================= */

function getSubscriptionPlan(plan) {

    const cleanPlan = normalizeSubscriptionPlan(plan);

    return SUBSCRIPTION_PLANS[cleanPlan];

}


/* =========================================================
   PLUS MI?
========================================================= */

function isPlus(plan) {

    return (
        normalizeSubscriptionPlan(plan) === "plus"
    );

}


/* =========================================================
   ULTRA MI?
========================================================= */

function isUltra(plan) {

    return (
        normalizeSubscriptionPlan(plan) === "ultra"
    );

}


/* =========================================================
   BUGÜNÜN TARİHİ
========================================================= */

function getTodayKey() {

    const now = new Date();

    return new Intl.DateTimeFormat("tr-TR", {

        timeZone: "Europe/Istanbul",

        year: "numeric",

        month: "2-digit",

        day: "2-digit"

    }).format(now);

}


/* =========================================================
   GÜNLÜK KULLANIM — OKU
========================================================= */

function loadDailyUsage() {

    try {

        if (!fs.existsSync(DAILY_USAGE_FILE)) {
            return {};
        }


        const data = JSON.parse(
            fs.readFileSync(DAILY_USAGE_FILE, "utf8")
        );


        return (
            data && typeof data === "object"
        ) ? data : {};

    } catch (error) {

        console.error(
            "GÜNLÜK OKUNAMADI:",
            error.message
        );

        return {};

    }

}


/* =========================================================
   GÜNLÜK KULLANIM — YAZ
========================================================= */

function saveDailyUsage(data) {

    try {

        fs.writeFileSync(
            DAILY_USAGE_FILE,
            JSON.stringify(data, null, 2),
            "utf8"
        );

        return true;

    } catch (error) {

        console.error(
            "GÜNLÜK KAYDEDİLEMEDİ:",
            error.message
        );

        return false;

    }

}


/* =========================================================
   GÜNLÜK LİMİT KONTROLÜ
========================================================= */

function checkDailyMessageLimit(userId, plan) {

    const usage = loadDailyUsage();
    const today = getTodayKey();

    const cleanPlan = normalizeSubscriptionPlan(plan);
    const limit = DAILY_MESSAGE_LIMITS[cleanPlan];


    if (
        !usage[userId] ||
        usage[userId].date !== today
    ) {

        usage[userId] = {
            date: today,
            count: 0
        };

    }


    return {

        allowed: usage[userId].count < limit,

        used: usage[userId].count,

        limit: limit

    };

}


/* =========================================================
   GÜNLÜK KULLANIMI ARTIR
========================================================= */

function incrementDailyMessageUsage(userId, plan) {

    const usage = loadDailyUsage();
    const today = getTodayKey();

    const cleanPlan = normalizeSubscriptionPlan(plan);


    if (
        !usage[userId] ||
        usage[userId].date !== today
    ) {

        usage[userId] = {
            date: today,
            count: 0
        };

    }


    usage[userId].count += 1;

    saveDailyUsage(usage);

}


/* =========================================================
   GROQ — BUGÜN
========================================================= */

function getTodayDate() {

    return new Date().toISOString().slice(0, 10);

}


/* =========================================================
   GROQ KULLANIM — OKU
========================================================= */

function loadGroqDailyUsage() {

    try {

        if (!fs.existsSync(GROQ_DAILY_USAGE_FILE)) {

            const newData = {
                date: getTodayDate(),
                requests: 0,
                tokens: 0
            };


            fs.writeFileSync(
                GROQ_DAILY_USAGE_FILE,
                JSON.stringify(newData, null, 2),
                "utf8"
            );


            return newData;

        }


        const data = JSON.parse(
            fs.readFileSync(GROQ_DAILY_USAGE_FILE, "utf8")
        );


        if (data.date !== getTodayDate()) {

            const newData = {
                date: getTodayDate(),
                requests: 0,
                tokens: 0
            };


            fs.writeFileSync(
                GROQ_DAILY_USAGE_FILE,
                JSON.stringify(newData, null, 2),
                "utf8"
            );


            return newData;

        }


        return {

            date: data.date || getTodayDate(),

            requests: Number(data.requests) || 0,

            tokens: Number(data.tokens) || 0

        };

    } catch (error) {

        console.error(
            "GROQ KULLANIM OKUNAMADI:",
            error.message
        );

        return {
            date: getTodayDate(),
            requests: 0,
            tokens: 0
        };

    }

}


/* =========================================================
   GROQ KULLANIM — YAZ
========================================================= */

function saveGroqDailyUsage(data) {

    try {

        fs.writeFileSync(
            GROQ_DAILY_USAGE_FILE,
            JSON.stringify(data, null, 2),
            "utf8"
        );

    } catch (error) {

        console.error(
            "GROQ KAYDEDİLEMEDİ:",
            error.message
        );

    }

}


/* =========================================================
   GROQ KULLANIM EKLE
========================================================= */

function addGroqUsage(tokens = 0) {

    const usage = loadGroqDailyUsage();

    usage.requests += 1;

    usage.tokens += Number(tokens) || 0;

    saveGroqDailyUsage(usage);


    console.log(
        "GROQ GÜNLÜK İSTEK:",
        usage.requests
    );

    console.log(
        "GROQ GÜNLÜK TOKEN:",
        usage.tokens
    );

}


/* =========================================================
   GÜNCEL TARİH VE ZAMAN
========================================================= */

function getCurrentDateInfo() {

    const now = new Date();

    const formatter = new Intl.DateTimeFormat("tr-TR", {

        timeZone: "Europe/Istanbul",

        dateStyle: "full",

        timeStyle: "long"

    });


    return {

        iso: now.toISOString(),

        turkey: formatter.format(now),

        year: Number(
            new Intl.DateTimeFormat("en-US", {
                timeZone: "Europe/Istanbul",
                year: "numeric"
            }).format(now)
        )

    };

}


/* =========================================================
   KISA SİSTEM PROMPTU
========================================================= */

const SHORT_SYSTEM_PROMPT =
    "Sen TürkAI'sın. Kullanıcıyla doğal ve kısa konuş. " +
    "Kullanıcının dilinde cevap ver. " +
    "Güncel bilgi gerekiyorsa araştırma sonucunu kullan. " +
    "Gereksiz açıklama yapma. " +
    "Kod sorularında mevcut kodu koru ve sadece gerekli değişikliği öner.";


/* =========================================================
   TARİH PROMPTU
========================================================= */

function buildDatePrompt(dateInfo) {

    return `
GÜNCEL TARİH VE ZAMAN BİLGİSİ:

Türkiye tarihi ve saati:
${dateInfo.turkey}

ISO zaman:
${dateInfo.iso}

Yıl:
${dateInfo.year}

Bu bilgi mevcut zaman bilgisidir.

Tarih sorularında bu bilgiyi kullan.

Ancak bu bilgi internet erişimi sağlamaz.
`.trim();

}


/* =========================================================
   ESKİ HAFIZA — OKU
========================================================= */

function loadMemory() {

    try {

        if (!fs.existsSync(MEMORY_FILE)) {

            fs.writeFileSync(MEMORY_FILE, "[]", "utf8");

            return [];

        }


        const content = fs.readFileSync(MEMORY_FILE, "utf8");


        if (!content.trim()) {
            return [];
        }


        const data = JSON.parse(content);


        if (!Array.isArray(data)) {
            return [];
        }


        return data.filter(
            item =>
                item &&
                typeof item === "object" &&
                (
                    item.role === "user" ||
                    item.role === "assistant"
                ) &&
                typeof item.content === "string"
        );

    } catch (error) {

        console.error(
            "HAFIZA OKUNAMADI:",
            error.message
        );

        return [];

    }

}


/* =========================================================
   ESKİ HAFIZA — YAZ
========================================================= */

function saveMemory(memoryList) {

    try {

        fs.writeFileSync(
            MEMORY_FILE,
            JSON.stringify(memoryList, null, 2),
            "utf8"
        );

        return true;

    } catch (error) {

        console.error(
            "HAFIZA KAYDEDİLEMEDİ:",
            error.message
        );

        return false;

    }

}


/* =========================================================
   HAFIZA GLOBAL
========================================================= */

let memory = [];


/* =========================================================
   HAFIZAYA EKLE
========================================================= */

function addMemory(role, content) {

    const cleanContent = String(content || "").trim();


    if (!cleanContent) {
        return;
    }


    memory.push({

        role: role === "assistant" ? "assistant" : "user",

        content: cleanContent,

        time: new Date().toISOString()

    });


    if (memory.length > MAX_MEMORY_MESSAGES) {

        memory = memory.slice(-MAX_MEMORY_MESSAGES);

    }


    saveMemory(memory);

}


/* =========================================================
   KULLANICI HAFIZASI GLOBAL
========================================================= */

let userMemories = {};


/* =========================================================
   KULLANICI HAFIZASI — OKU
========================================================= */

function loadUserMemories() {

    try {

        if (!fs.existsSync(USER_MEMORY_FILE)) {

            fs.writeFileSync(
                USER_MEMORY_FILE,
                "{}",
                "utf8"
            );

            return {};

        }


        const content =
            fs.readFileSync(USER_MEMORY_FILE, "utf8");


        if (!content.trim()) {
            return {};
        }


        const data = JSON.parse(content);


        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {
            return {};
        }


        return data;

    } catch (error) {

        console.error(
            "KULLANICI HAFIZASI OKUNAMADI:",
            error.message
        );

        return {};

    }

}


/* =========================================================
   KULLANICI HAFIZASI — YAZ
========================================================= */

function saveUserMemories() {

    try {

        fs.writeFileSync(
            USER_MEMORY_FILE,
            JSON.stringify(userMemories, null, 2),
            "utf8"
        );

        return true;

    } catch (error) {

        console.error(
            "KULLANICI HAFIZASI KAYDEDİLEMEDİ:",
            error.message
        );

        return false;

    }

}


/* =========================================================
   USER ID TEMİZLE
========================================================= */

function cleanUserId(value) {

    let userId = String(value || "").trim();


    if (!userId) {
        return "default-user";
    }


    userId = userId
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 100);


    if (!userId) {
        return "default-user";
    }


    return userId;

}


/* =========================================================
   USER ID AL
========================================================= */

function getUserId(req) {

    const headerId = req.get("X-User-ID");

    const queryId =
        req.query && req.query.userId
            ? req.query.userId
            : "";

    const bodyId =
        req.body && req.body.userId
            ? req.body.userId
            : "";


    return cleanUserId(headerId || bodyId || queryId);

}


/* =========================================================
   KULLANICI HAFIZASI AL
========================================================= */

function getUserMemory(userId) {

    const id = cleanUserId(userId);


    if (!Array.isArray(userMemories[id])) {

        userMemories[id] = [];

    }


    return userMemories[id];

}


/* =========================================================
   KULLANICI HAFIZASINA EKLE
========================================================= */

function addUserMemory(userId, role, content) {

    const id = cleanUserId(userId);

    const cleanContent = String(content || "").trim();


    if (!cleanContent) {
        return;
    }


    const userMemory = getUserMemory(id);


    userMemory.push({

        role: role === "assistant" ? "assistant" : "user",

        content: cleanContent,

        time: new Date().toISOString()

    });


    if (userMemory.length > MAX_USER_MEMORY_MESSAGES) {

        userMemories[id] =
            userMemory.slice(-MAX_USER_MEMORY_MESSAGES);

    }


    saveUserMemories();

}


/* =========================================================
   İSİM BUL
========================================================= */

function findUserName(text) {

    const value = String(text || "");


    const match = value.match(
        /(?:benim\s+adım|benim\s+ismim|adım|ismim)\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\b/i
    );


    return match ? match[1] : null;

}


/* =========================================================
   İSİM SORGU
========================================================= */

function getUserName(userId) {

    const userMemory = getUserMemory(userId);


    for (let i = userMemory.length - 1; i >= 0; i--) {

        const item = userMemory[i];


        if (!item || item.role !== "user") {
            continue;
        }


        const name = findUserName(item.content);


        if (name) {
            return name;
        }

    }


    return null;

}


/* =========================================================
   METİN TEMİZLE
========================================================= */

function sanitizeInput(text) {

    let clean = String(text || "");

    clean = clean.replace(/\0/g, "");

    clean = clean.replace(/\s{3,}/g, "  ");

    return clean.trim();

}


/* =========================================================
   RASTGELE ID
========================================================= */

function generateRandomId(prefix = "id") {

    return (
        prefix + "_" +
        Date.now() + "_" +
        Math.random().toString(36).slice(2, 10)
    );

}


/* =========================================================
   BEKLETME
========================================================= */

function sleep(ms) {

    return new Promise(
        resolve => setTimeout(resolve, ms)
    );

}


/* =========================================================
   PARÇA 1 SONU
========================================================= */
/* =========================================================
   PARÇA 2/3 — Yerel Motor + AI Zinciri + Araştırma + Hava
========================================================= */


/* =========================================================
   BİLGİ HAFIZASI GLOBAL
========================================================= */

let knowledge = [];


/* =========================================================
   BİLGİ HAFIZASI — YÜKLE
========================================================= */

function loadKnowledge() {

    try {

        if (!fs.existsSync(KNOWLEDGE_FILE)) {

            fs.writeFileSync(KNOWLEDGE_FILE, "[]", "utf8");

            return [];

        }


        const content = fs.readFileSync(KNOWLEDGE_FILE, "utf8");

        if (!content.trim()) {
            return [];
        }


        const data = JSON.parse(content);

        return Array.isArray(data) ? data : [];

    } catch (error) {

        console.error(
            "BİLGİ HAFIZASI OKUNAMADI:",
            error.message
        );

        return [];

    }

}


/* =========================================================
   BİLGİ HAFIZASI — KAYDET
========================================================= */

function saveKnowledge(knowledgeList) {

    try {

        fs.writeFileSync(
            KNOWLEDGE_FILE,
            JSON.stringify(knowledgeList, null, 2),
            "utf8"
        );

        return true;

    } catch (error) {

        console.error(
            "BİLGİ KAYDEDİLEMEDİ:",
            error.message
        );

        return false;

    }

}


/* =========================================================
   BİLGİ ÖĞESİ EKLE
========================================================= */

function saveKnowledgeItem(question, answer) {

    const cleanQuestion = String(question || "").trim();
    const cleanAnswer = String(answer || "").trim();


    if (!cleanQuestion || !cleanAnswer) {
        return false;
    }

    if (cleanQuestion.length > 300) {
        return false;
    }

    if (cleanAnswer.length > 5000) {
        return false;
    }


    const exists = knowledge.some(
        item =>
            item &&
            typeof item.question === "string" &&
            item.question.toLowerCase() ===
                cleanQuestion.toLowerCase()
    );


    if (exists) {
        return false;
    }


    knowledge.push({

        question: cleanQuestion,
        answer: cleanAnswer,
        source: "AI",
        time: new Date().toISOString()

    });


    if (knowledge.length > 8000) {
        knowledge = knowledge.slice(-8000);
    }


    return saveKnowledge(knowledge);

}


/* =========================================================
   BİLGİ HAFIZASINDAN TAM EŞLEŞME
========================================================= */

function findKnowledgeAnswer(question) {

    const clean = String(question || "").trim().toLowerCase();


    if (!clean) {
        return null;
    }


    const item = knowledge.find(
        entry =>
            entry &&
            typeof entry.question === "string" &&
            entry.question.trim().toLowerCase() === clean
    );


    if (!item) {
        return null;
    }


    console.log("🧠 BİLGİ HAFIZASINDAN CEVAP VERİLDİ");

    return item.answer;

}


/* =========================================================
   BENZERLİK SKORU
========================================================= */

function similarityScore(a, b) {

    const s1 = String(a || "")
        .toLowerCase()
        .replace(/[^\wçğıöşü\s]/g, "")
        .trim();

    const s2 = String(b || "")
        .toLowerCase()
        .replace(/[^\wçğıöşü\s]/g, "")
        .trim();


    if (!s1 || !s2) {
        return 0;
    }

    if (s1 === s2) {
        return 1;
    }


    const words1 = s1.split(/\s+/).filter(Boolean);
    const words2 = s2.split(/\s+/).filter(Boolean);


    if (!words1.length || !words2.length) {
        return 0;
    }


    const set1 = new Set(words1);
    const set2 = new Set(words2);

    let common = 0;

    for (const word of set1) {

        if (set2.has(word)) {
            common++;
        }

    }


    const union = new Set([...set1, ...set2]).size;

    return common / union;

}


/* =========================================================
   BENZER SORU ARA
========================================================= */

function findSimilarKnowledge(question) {

    const clean = String(question || "").trim();


    if (!clean || !knowledge.length || clean.length < 5) {
        return null;
    }


    let bestAnswer = null;
    let bestScore = 0;
    let bestQuestion = "";


    for (const item of knowledge) {

        if (!item || typeof item.question !== "string") {
            continue;
        }


        const score = similarityScore(clean, item.question);


        if (score > bestScore) {

            bestScore = score;
            bestAnswer = item.answer;
            bestQuestion = item.question;

        }

    }


    if (bestScore >= 0.75 && bestAnswer) {

        console.log(
            "🧠 BENZER SORU (" +
            Math.round(bestScore * 100) +
            "%): " + bestQuestion
        );

        return bestAnswer;

    }


    return null;

}


/* =========================================================
   BASİT MESAJLAR
========================================================= */

const SIMPLE_MESSAGES = {

    "selam": "Selam! 😎",
    "slm": "Aleyküm selam!",
    "selamlar": "Selamlar! 👋",
    "merhaba": "Merhaba! 👋",
    "merhabalar": "Merhabalar! 👋",
    "mrb": "Merhaba! 😎",
    "hey": "Hey! 👋",
    "hello": "Hello! 👋",
    "hi": "Hi! 👋",
    "sa": "Aleyküm selam!",

    "nasılsın": "İyiyim knk 😎 Sen nasılsın?",
    "nasilsin": "İyiyim knk 😎 Sen nasılsın?",
    "iyi misin": "İyiyim 😎 Sen nasılsın?",
    "naber": "İyilik knk 😎 Senden naber?",
    "ne haber": "İyilik knk 😎 Senden ne haber?",
    "napıyorsun": "Buradayım knk 😎 Sen ne yapıyorsun?",
    "ne yapıyorsun": "Buradayım, seni dinliyorum 😎",

    "teşekkürler": "Rica ederim! 😎",
    "tesekkurler": "Rica ederim! 😎",
    "teşekkür ederim": "Ne demek! 😎",
    "sağ ol": "Ne demek knk! 😎",
    "sag ol": "Ne demek knk! 😎",
    "eyvallah": "Eyvallah knk 😎",

    "tamam": "Tamamdır! 👍",
    "tamamdır": "Tamamdır! 👍",
    "ok": "Tamam! 👍",
    "okey": "Okey! 👍",
    "olur": "Olur knk! 👍",
    "aynen": "Aynen 😎",
    "evet": "Süper! 👍",
    "hayır": "Tamam 😄",
    "hayir": "Tamam 😄",
    "peki": "Peki! 😎",
    "anladım": "Harika! 👍",

    "haha": "😂",
    "hahaha": "😂😂",
    "lol": "😂",
    "xd": "😂",
    "vay": "Vay be! 😎",
    "wow": "Vay be! 😎",
    "çok iyi": "😎🔥",
    "süper": "Süper! 🔥",
    "harika": "Harika! 🔥",
    "mükemmel": "Mükemmel! 😎🔥",

    "görüşürüz": "Görüşürüz knk! 👋",
    "bye": "Görüşürüz! 👋",
    "bb": "Görüşürüz! 👋",
    "bay bay": "Bay bay! 👋",
    "hoşça kal": "Hoşça kal! 👋",

    "günaydın": "Günaydın! ☀️",
    "gunaydin": "Günaydın! ☀️",
    "iyi akşamlar": "İyi akşamlar! 🌆",
    "iyi geceler": "İyi geceler! 🌙",

    "hazır mısın": "Hazırım knk! 😎",
    "hazir misin": "Hazırım knk! 😎",
    "hazırım": "Ben hazırım! 😎",
    "orada mısın": "Buradayım! 👋",
    "burada mısın": "Evet, buradayım! 😎",
    "çalışıyor musun": "Evet, çalışıyorum! ⚡",

    "test": "Test başarılı! ✅",
    "türkai": "Buradayım! 🤖",
    "sen kimsin": "Ben TürkAI'yım. 🤖",
    "adın ne": "Ben TürkAI'yım. 🤖",
    "ismin ne": "Ben TürkAI'yım. 🤖",
    "insan mısın": "Hayır, ben yapay zeka asistanıyım. 🤖",
    "robot musun": "Ben fiziksel bir robot değilim; bir yapay zeka yazılımıyım. 🤖",
    "kaç yaşındasın": "Benim gerçek bir yaşım yok. 🤖",
    "nerelisin": "Ben bir yapay zekayım, belirli bir memleketim yok. 🌍",

    "yardım": "Tabii! Ne konuda yardım istiyorsun?",
    "yardim": "Tabii! Ne konuda yardım istiyorsun?",
    "yardım eder misin": "Tabii ki! 😊 Ne yapmamı istersin?",
    "bana yardım et": "Tabii! Sorununu anlat, birlikte çözelim.",
    "ne yapabilirsin": "Soru cevaplarım, kod yazarım, araştırma yaparım. 🤖",

    "iyiyim": "Süper! 😎",
    "iyi": "Harika! 😄",
    "kötüyüm": "Üzgünüm. Ne olduğunu anlatabilirsin.",
    "mutluyum": "Buna sevindim! 😄",
    "üzgünüm": "Umarım kısa zamanda daha iyi hissedersin. 💙",
    "yorgunum": "Dinlen biraz, kendine iyi bak. 😊",
    "sıkıldım": "İstersen bir şeyler anlatayım. 😊",
    "moralim bozuk": "Üzülme, her şey geçer. 💙",
    "moral ver": "Sen güçlüsün, başarabilirsin! 💪",
    "motivasyon ver": "Başarı, denemekten vazgeçmeyenlerindir. 💪",

    "devam": "Devam ediyoruz! 🚀",
    "devam et": "Tamam, devam ediyorum. 🚀",
    "bekle": "Tamam, bekliyorum. 😊",
    "dur": "Durdum. Ne oldu?",
    "başlayalım": "Hadi başlayalım! 🚀"

};


/* =========================================================
   NORMALIZE
========================================================= */

function normalizeLocalText(text) {

    return String(text || "")
        .toLocaleLowerCase("tr-TR")
        .trim()
        .replace(/[?!.,;:]+$/g, "")
        .replace(/\s+/g, " ");

}


/* =========================================================
   NİYET ALGILAMA
========================================================= */

function detectLocalIntent(text) {

    const clean = normalizeLocalText(text);


    if (!clean) {
        return "empty";
    }


    if (
        ["selam", "slm", "merhaba", "mrb", "hey", "sa", "selamlar"]
            .some(word =>
                clean === word ||
                clean.startsWith(word + " ")
            )
    ) {
        return "greeting";
    }


    if (
        ["adın ne", "adin ne", "sen kimsin", "ismin ne", "kimsin"]
            .some(word => clean.includes(word))
    ) {
        return "identity";
    }


    if (
        ["teşekkür", "tesekkur", "sağol", "sagol", "eyvallah"]
            .some(word => clean.includes(word))
    ) {
        return "thanks";
    }


    if (
        ["nasılsın", "nasilsin", "naber", "ne haber"]
            .some(word => clean.includes(word))
    ) {
        return "status";
    }


    if (
        [
            "yardım eder misin",
            "yardim eder misin",
            "bana yardım et"
        ].some(word => clean.includes(word))
    ) {
        return "help";
    }


    return "unknown";

}


/* =========================================================
   NİYET CEVAPLARI
========================================================= */

function getLocalIntentAnswer(intent) {

    switch (intent) {

        case "greeting":
            return "Selam! 😎 Sana nasıl yardımcı olabilirim?";

        case "identity":
            return "Ben TürkAI'yım. 🤖";

        case "thanks":
            return "Rica ederim knk 😎";

        case "status":
            return "İyiyim knk 😎 Sen nasılsın?";

        case "help":
            return "Tabii knk. Ne yapmak istiyorsun?";

        default:
            return null;

    }

}


/* =========================================================
   MATEMATİK
========================================================= */

function localMath(text) {

    const clean = String(text || "").trim().toLowerCase();


    const match = clean.match(
        /^(-?\d+(?:[.,]\d+)?)\s*([+\-*/x×])\s*(-?\d+(?:[.,]\d+)?)$/
    );


    if (!match) {
        return null;
    }


    const a = Number(match[1].replace(",", "."));
    const b = Number(match[3].replace(",", "."));
    const op = match[2];

    let result;


    if (op === "+") {
        result = a + b;
    } else if (op === "-") {
        result = a - b;
    } else if (op === "*" || op === "x" || op === "×") {
        result = a * b;
    } else if (op === "/") {

        if (b === 0) {
            return "Sıfıra bölme yapılamaz. 😎";
        }

        result = a / b;

    }


    if (typeof result === "number" && Number.isFinite(result)) {

        console.log("🧮 MATEMATİK → API KULLANILMADI");

        return String(result);

    }


    return null;

}


/* =========================================================
   BİRİM DÖNÜŞÜMLERİ
========================================================= */

function localUnitConversion(text) {

    const clean = normalizeLocalText(text);

    let match;


    match = clean.match(
        /^([\d.,]+)\s*(km|kilometre)\s*(kaç|kac)?\s*(metre|m)$/i
    );

    if (match) {
        const v = parseFloat(match[1].replace(",", "."));
        return `${v} km = ${v * 1000} metre`;
    }


    match = clean.match(
        /^([\d.,]+)\s*(metre|m)\s*(kaç|kac)?\s*(km|kilometre)$/i
    );

    if (match) {
        const v = parseFloat(match[1].replace(",", "."));
        return `${v} metre = ${v / 1000} km`;
    }


    match = clean.match(
        /^([\d.,]+)\s*(kg|kilogram)\s*(kaç|kac)?\s*(gram|g)$/i
    );

    if (match) {
        const v = parseFloat(match[1].replace(",", "."));
        return `${v} kg = ${v * 1000} gram`;
    }


    match = clean.match(
        /^([\d.,]+)\s*(gram|g)\s*(kaç|kac)?\s*(kg|kilogram)$/i
    );

    if (match) {
        const v = parseFloat(match[1].replace(",", "."));
        return `${v} gram = ${v / 1000} kg`;
    }


    match = clean.match(
        /^([\d.,]+)\s*(saat)\s*(kaç|kac)?\s*(dakika)$/i
    );

    if (match) {
        const v = parseFloat(match[1].replace(",", "."));
        return `${v} saat = ${v * 60} dakika`;
    }


    match = clean.match(
        /^([\d.,]+)\s*(dakika)\s*(kaç|kac)?\s*(saniye)$/i
    );

    if (match) {
        const v = parseFloat(match[1].replace(",", "."));
        return `${v} dakika = ${v * 60} saniye`;
    }


    match = clean.match(
        /^([\d.,]+)\s*(metre|m)\s*(kaç|kac)?\s*(cm|santimetre)$/i
    );

    if (match) {
        const v = parseFloat(match[1].replace(",", "."));
        return `${v} metre = ${v * 100} cm`;
    }


    match = clean.match(
        /^([\d.,]+)\s*(cm|santimetre)\s*(kaç|kac)?\s*(mm|milimetre)$/i
    );

    if (match) {
        const v = parseFloat(match[1].replace(",", "."));
        return `${v} cm = ${v * 10} mm`;
    }


    match = clean.match(
        /^([\d.,]+)\s*(cm|santimetre)\s*(kaç|kac)?\s*(inç|inch)$/i
    );

    if (match) {
        const v = parseFloat(match[1].replace(",", "."));
        return `${v} cm = ${(v / 2.54).toFixed(2)} inç`;
    }


    match = clean.match(
        /^([\d.,]+)\s*(km|kilometre)\s*(kaç|kac)?\s*(mil|mile)$/i
    );

    if (match) {
        const v = parseFloat(match[1].replace(",", "."));
        return `${v} km = ${(v * 0.621371).toFixed(2)} mil`;
    }


    match = clean.match(
        /^([\d.,\-]+)\s*(c|celsius|santigrat)\s*(kaç|kac)?\s*(f|fahrenheit)$/i
    );

    if (match) {
        const v = parseFloat(match[1].replace(",", "."));
        const f = (v * 9 / 5) + 32;
        return `${v}°C = ${f.toFixed(2)}°F`;
    }


    match = clean.match(
        /^([\d.,\-]+)\s*(f|fahrenheit)\s*(kaç|kac)?\s*(c|celsius|santigrat)$/i
    );

    if (match) {
        const v = parseFloat(match[1].replace(",", "."));
        const c = (v - 32) * 5 / 9;
        return `${v}°F = ${c.toFixed(2)}°C`;
    }


    return null;

}


/* =========================================================
   YÜZDE
========================================================= */

function localPercentage(text) {

    const clean = normalizeLocalText(text);


    const match = clean.match(
        /^([\d.,]+)\s*(sayısının|sayisinin)?\s*%?\s*([\d.,]+)\s*%$/
    );


    if (!match) {
        return null;
    }


    const number = parseFloat(match[1].replace(",", "."));
    const percent = parseFloat(match[3].replace(",", "."));


    if (
        !Number.isFinite(number) ||
        !Number.isFinite(percent)
    ) {
        return null;
    }


    return `${number} sayısının %${percent} değeri = ${number * percent / 100}`;

}


/* =========================================================
   YEREL MOTOR
========================================================= */

function runLocalEngine(text) {

    const intentAnswer =
        getLocalIntentAnswer(detectLocalIntent(text));

    if (intentAnswer) {
        return intentAnswer;
    }


    const unitAnswer = localUnitConversion(text);

    if (unitAnswer) {
        console.log("📏 BİRİM → API KULLANILMADI");
        return unitAnswer;
    }


    const percentAnswer = localPercentage(text);

    if (percentAnswer) {
        console.log("📊 YÜZDE → API KULLANILMADI");
        return percentAnswer;
    }


    const mathAnswer = localMath(text);

    if (mathAnswer) {
        return mathAnswer;
    }


    return null;

}


/* =========================================================
   YEREL CEVAP — TEK GİRİŞ
========================================================= */

function findLocalAnswer(message) {

    const clean = String(message || "").trim().toLowerCase();


    if (!clean) {
        return null;
    }


    const exact = findKnowledgeAnswer(clean);

    if (exact) {
        return exact;
    }


    if (
        Object.prototype.hasOwnProperty.call(
            SIMPLE_MESSAGES,
            clean
        )
    ) {

        console.log("💬 BASİT MESAJ → API KULLANILMADI");

        return SIMPLE_MESSAGES[clean];

    }


    const engine = runLocalEngine(clean);

    if (engine) {
        return engine;
    }


    if (clean.length > 10) {

        const similar = findSimilarKnowledge(clean);

        if (similar) {
            return similar;
        }

    }


    return null;

}


/* =========================================================
   FETCH ZAMAN AŞIMI
========================================================= */

async function fetchWithTimeout(
    url,
    options = {},
    timeout = RESEARCH_TIMEOUT
) {

    const controller = new AbortController();


    const timer = setTimeout(
        function () {
            controller.abort();
        },
        timeout
    );


    try {

        return await fetch(url, {
            ...options,
            signal: controller.signal
        });

    } finally {

        clearTimeout(timer);

    }

}


/* =========================================================
   GROQ İSTEĞİ
========================================================= */

async function requestGroq(messages) {

    let lastError = null;


    for (
        let attempt = 1;
        attempt <= MAX_RETRIES + 1;
        attempt++
    ) {

        const controller = new AbortController();

        const timeout = setTimeout(
            function () {
                controller.abort();
            },
            REQUEST_TIMEOUT
        );


        try {

            const response = await fetch(
                GROQ_URL,
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",

                        "Authorization":
                            "Bearer " + GROQ_API_KEY
                    },

                    body: JSON.stringify({

                        model: GROQ_MODEL,

                        messages: messages,

                        temperature: 0.20,

                        max_tokens: 700,

                        reasoning_effort: "low",

                        include_reasoning: false,

                        stream: false,

                        tools: [],

                        tool_choice: "none"

                    }),

                    signal: controller.signal

                }
            );


            console.log(
                "GROQ KALAN:",
                response.headers.get(
                    "x-ratelimit-remaining-requests"
                )
            );


            clearTimeout(timeout);


            const responseText = await response.text();


            if (!response.ok) {

                const error = new Error(
                    "Groq HTTP " +
                    response.status +
                    (
                        responseText
                            ? " - " + responseText.slice(0, 500)
                            : ""
                    )
                );

                error.status = response.status;
                error.body = responseText;

                throw error;

            }


            let data;

            try {
                data = JSON.parse(responseText);
            } catch (error) {
                throw new Error("Groq geçersiz JSON.");
            }


            const usedTokens = data?.usage?.total_tokens || 0;

            addGroqUsage(usedTokens);

            return data;

        } catch (error) {

            clearTimeout(timeout);

            lastError = error;

            if (error.status === 429) {
                throw error;
            }


            console.error(
                "GROQ DENEME " + attempt + ":",
                error.message
            );


            if (
                error.status === 401 ||
                error.status === 403 ||
                error.status === 400
            ) {
                break;
            }


            if (attempt <= MAX_RETRIES) {
                await sleep(500 * attempt);
            }

        }

    }


    throw (lastError || new Error("Groq bağlantısı kurulamadı."));

}


/* =========================================================
   CEREBRAS İSTEĞİ
========================================================= */

async function requestCerebras(messages) {

    if (!CEREBRAS_API_KEY) {
        throw new Error("Cerebras API anahtarı yok.");
    }


    const response = await fetch(
        CEREBRAS_URL,
        {

            method: "POST",

            headers: {
                "Content-Type": "application/json",

                "Authorization":
                    "Bearer " + CEREBRAS_API_KEY
            },

            body: JSON.stringify({

                model: CEREBRAS_MODEL,

                messages: messages,

                temperature: 0.20,

                max_tokens: 700,

                stream: false

            })

        }
    );


    const responseText = await response.text();


    if (!response.ok) {

        const error = new Error(
            "Cerebras HTTP " +
            response.status +
            (responseText ? " - " + responseText.slice(0, 500) : "")
        );

        error.status = response.status;

        throw error;

    }


    try {
        return JSON.parse(responseText);
    } catch (error) {
        throw new Error("Cerebras geçersiz JSON.");
    }

}


/* =========================================================
   GEMINI İSTEĞİ
========================================================= */

async function requestGemini(messages) {

    if (!GEMINI_API_KEY) {
        throw new Error("Gemini API anahtarı yok.");
    }


    const systemParts = messages
        .filter(item => item && item.role === "system" && item.content)
        .map(item => String(item.content))
        .join("\n\n");


    const contents = messages
        .filter(
            item =>
                item &&
                item.content &&
                item.role !== "system"
        )
        .map(item => ({

            role: item.role === "assistant" ? "model" : "user",

            parts: [{ text: String(item.content) }]

        }));


    if (systemParts) {

        contents.unshift({

            role: "user",

            parts: [{
                text: "[SİSTEM TALİMATLARI]\n\n" + systemParts
            }]

        });

    }


    const response = await fetch(
        GEMINI_URL,
        {

            method: "POST",

            headers: {
                "Content-Type": "application/json",

                "x-goog-api-key": GEMINI_API_KEY
            },

            body: JSON.stringify({

                contents: contents,

                generationConfig: {
                    maxOutputTokens: 700,
                    temperature: 0.20
                }

            })

        }
    );


    const responseText = await response.text();


    if (!response.ok) {

        const error = new Error(
            "Gemini HTTP " +
            response.status +
            " - " + responseText.slice(0, 500)
        );

        error.status = response.status;

        throw error;

    }


    let data;

    try {
        data = JSON.parse(responseText);
    } catch (error) {
        throw new Error("Gemini geçersiz JSON.");
    }


    let replyText = "";


    if (
        data &&
        Array.isArray(data.candidates) &&
        data.candidates.length
    ) {

        const candidate = data.candidates[0];


        if (
            candidate &&
            candidate.content &&
            Array.isArray(candidate.content.parts)
        ) {

            replyText = candidate.content.parts
                .map(p => p.text || "")
                .join("\n")
                .trim();

        }

    }


    return {

        choices: [{
            message: {
                role: "assistant",
                content: replyText || ""
            }
        }],

        provider: "gemini"

    };

}


/* =========================================================
   CEVAP TEMİZLE
========================================================= */

function cleanReply(text) {

    let reply = String(text || "").trim();


    if (!reply) {
        return "";
    }


    try {

        const parsed = JSON.parse(reply);

        if (
            parsed &&
            typeof parsed.reply === "string"
        ) {
            reply = parsed.reply.trim();
        }

    } catch (error) {}


    reply = reply
        .replace(/^```(?:json|text|markdown)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();


    reply = reply
        .replace(
            /^(TürkAI|AI|Assistant|ChatGPT|Grok|Gemini)\s*:\s*/i,
            ""
        )
        .trim();


    if (reply.length > MAX_REPLY_LENGTH) {

        reply =
            reply.slice(0, MAX_REPLY_LENGTH) +
            "\n\n[Yanıt çok uzundu ve kısaltıldı.]";

    }


    return reply;

}


/* =========================================================
   AI İSTEĞİ — YEDEKLİ ZİNCİR
========================================================= */

async function requestAI(messages) {

    const lastUser =
        messages.filter(m => m && m.role === "user").pop();


    let lastUserMessage = "";


    if (lastUser) {

        if (typeof lastUser.content === "string") {

            lastUserMessage =
                lastUser.content.trim().toLowerCase();

        } else if (Array.isArray(lastUser.content)) {

            lastUserMessage = lastUser.content
                .map(item =>
                    typeof item === "string"
                        ? item
                        : item?.text || ""
                )
                .join(" ")
                .trim()
                .toLowerCase();

        }

    }


    console.log("🔍 SON MESAJ:", JSON.stringify(lastUserMessage));


    /* YEREL CEVAP ÖNCE */

    const localAnswer = findLocalAnswer(lastUserMessage);


    if (localAnswer) {

        console.log("✅ YEREL CEVAP — 0 API TOKEN");

        return {

            choices: [{
                message: {
                    role: "assistant",
                    content: localAnswer
                }
            }],

            local: true

        };

    }


    let groqError = null;
    let cerebrasError = null;
    let geminiError = null;


    try {

        console.log("🚀 AI: GROQ");

        const result = await requestGroq(messages);

        if (result) {
            return result;
        }

    } catch (error) {

        groqError = error;

        console.error("❌ GROQ:", error.message);

    }


    try {

        console.log("🔄 AI: CEREBRAS");

        const result = await requestCerebras(messages);

        if (result) {
            console.log("✅ CEREBRAS CEVAP VERDİ");
            return result;
        }

    } catch (error) {

        cerebrasError = error;

        console.error("❌ CEREBRAS:", error.message);

    }


    try {

        console.log("🔄 AI: GEMINI");

        const result = await requestGemini(messages);

        if (result) {
            console.log("✅ GEMINI CEVAP VERDİ");
            return result;
        }

    } catch (error) {

        geminiError = error;

        console.error("❌ GEMINI:", error.message);

    }


    throw new Error(
        "Tüm AI sağlayıcıları başarısız oldu. " +
        "Groq: " + (groqError?.message || "?") +
        " | Cerebras: " + (cerebrasError?.message || "?") +
        " | Gemini: " + (geminiError?.message || "?")
    );

}


/* =========================================================
   AI HATA MESAJI
========================================================= */

function buildAIErrorMessage(error) {

    if (!error) {
        return "Beklenmeyen bir hata oluştu.";
    }


    const msg = String(error.message || "").toLowerCase();


    if (
        error.name === "AbortError" ||
        msg.includes("timeout")
    ) {
        return "AI yanıtı zaman aşımına uğradı. Tekrar dene.";
    }


    if (msg.includes("fetch") || msg.includes("network")) {
        return "İnternet bağlantısı kurulamadı.";
    }


    if (msg.includes("429") || msg.includes("rate")) {
        return "Çok fazla istek var. Biraz bekle.";
    }


    if (
        msg.includes("401") ||
        msg.includes("403") ||
        msg.includes("api key")
    ) {
        return "Sunucu yapılandırma hatası.";
    }


    if (msg.includes("tüm ai")) {
        return "Yapay zeka şu anda yanıt veremiyor.";
    }


    return "Bir hata oluştu. Lütfen tekrar dene.";

}


/* =========================================================
   PARÇA 2 SONU
========================================================= */
/* =========================================================
   PARÇA 3/3 — Araştırma + Hava + API + /api/chat + WebRTC
========================================================= */


/* =========================================================
   ARAMA SABİTLERİ
========================================================= */

const SEARCH_URL = "https://html.duckduckgo.com/html/";
const TCMB_TODAY_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";
const WEATHER_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";


/* =========================================================
   HTML TEMİZLE
========================================================= */

function stripHtml(html) {

    return String(html || "")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();

}


function cleanUrl(value) {

    try {

        const url = new URL(value);

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {
            return "";
        }

        return url.href;

    } catch (error) {
        return "";
    }

}


/* =========================================================
   WEB ARAMA
========================================================= */

async function webSearch(query) {

    const cleanQuery = String(query || "").trim();

    if (!cleanQuery) {
        return [];
    }


    try {

        const url =
            SEARCH_URL + "?q=" + encodeURIComponent(cleanQuery);


        const response = await fetchWithTimeout(
            url,
            {
                method: "GET",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36",
                    "Accept":
                        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language":
                        "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
                }
            },
            15000
        );


        if (!response.ok) {
            throw new Error("Web arama HTTP " + response.status);
        }


        const html = await response.text();


        if (!html || html.length < 100) {
            throw new Error("Boş sonuç.");
        }


        const results = [];

        const resultPattern =
            /<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;


        let match;


        while (
            (match = resultPattern.exec(html)) !== null &&
            results.length < MAX_SEARCH_RESULTS
        ) {

            let href = match[1];
            const title = stripHtml(match[2]).trim();


            if (href.includes("uddg=")) {

                try {
                    const parsed = new URL(
                        href,
                        "https://html.duckduckgo.com"
                    );

                    const realUrl =
                        parsed.searchParams.get("uddg");

                    if (realUrl) {
                        href = realUrl;
                    }

                } catch (error) {
                    continue;
                }

            }


            href = cleanUrl(href);


            if (
                title &&
                href &&
                !href.includes("duckduckgo.com")
            ) {

                const exists = results.some(
                    item => item.url === href
                );


                if (!exists) {

                    results.push({

                        title: title.slice(0, 300),

                        url: href

                    });

                }

            }

        }


        console.log("WEB ARAMA:", results.length, "sonuç");

        return results;

    } catch (error) {

        console.error("WEB ARAMA HATASI:", error.message);

        throw error;

    }

}


/* =========================================================
   TCMB USD KURU
========================================================= */

async function getTcmbUsdRate() {

    const response = await fetchWithTimeout(
        TCMB_TODAY_URL,
        {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/xml,text/xml,*/*"
            }
        },
        15000
    );


    if (!response.ok) {
        throw new Error("TCMB HTTP " + response.status);
    }


    const xml = await response.text();


    if (!xml || xml.length < 100) {
        throw new Error("TCMB boş veri.");
    }


    const usdMatch = xml.match(
        /<Currency[^>]*Kod="USD"[^>]*>[\s\S]*?<ForexBuying>(.*?)<\/ForexBuying>[\s\S]*?<ForexSelling>(.*?)<\/ForexSelling>[\s\S]*?<\/Currency>/
    );


    if (!usdMatch) {
        throw new Error("TCMB USD bulunamadı.");
    }


    const buying = Number(usdMatch[1]);
    const selling = Number(usdMatch[2]);


    if (
        !Number.isFinite(buying) ||
        !Number.isFinite(selling)
    ) {
        throw new Error("TCMB USD geçersiz.");
    }


    console.log("TCMB USD:", buying, selling);

    return { buying, selling };

}


/* =========================================================
   SAYFA METNİ
========================================================= */

async function fetchPageText(url) {

    try {

        const response = await fetchWithTimeout(
            url,
            {
                method: "GET",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36"
                }
            },
            10000
        );


        if (!response.ok) {
            return "";
        }


        const html = await response.text();

        return stripHtml(html).slice(0, 2000);

    } catch (error) {

        return "";

    }

}


/* =========================================================
   ARAŞTIRMA
========================================================= */

async function researchWeb(query) {

    console.log("ARAŞTIRMA:", query);


    const lowerQuery = String(query || "").toLowerCase();


    /* DÖVİZ ÖZEL */

    const currencyKeywords = [
        "dolar", "usd", "döviz kuru", "doviz kuru"
    ];


    if (
        currencyKeywords.some(
            word => lowerQuery.includes(word)
        )
    ) {

        try {

            const usd = await getTcmbUsdRate();


            return {

                ok: true,

                query: query,

                text: `
TCMB GÜNCEL DÖVİZ KURU

Tarih:
${new Date().toLocaleDateString("tr-TR")}

ABD DOLARI (USD):

Forex alış:
${usd.buying.toFixed(4)} TL

Forex satış:
${usd.selling.toFixed(4)} TL

Kaynak: TCMB
`.trim(),

                sources: [{
                    title: "TCMB - Güncel Döviz Kurları",
                    url: TCMB_TODAY_URL
                }]

            };

        } catch (error) {

            console.error("TCMB HATA:", error.message);

        }

    }


    /* NORMAL ARAMA */

    const results = await webSearch(query);


    if (!results.length) {

        return {

            ok: false,

            query: query,

            text: "İnternette sonuç bulunamadı.",

            sources: []

        };

    }


    /* PUANLAMA */

    const trustedDomains = [
        "tcmb.gov.tr",
        "tff.org",
        "resmigazete.gov.tr",
        "gov.tr",
        "tuik.gov.tr",
        "mgm.gov.tr",
        "nasa.gov",
        "who.int"
    ];


    function scoreResult(result) {

        try {

            const hostname =
                new URL(result.url).hostname.toLowerCase();


            if (
                hostname === "tcmb.gov.tr" ||
                hostname.endsWith(".tcmb.gov.tr")
            ) {
                return 100;
            }

            if (hostname.endsWith(".gov.tr")) {
                return 95;
            }

            if (hostname.endsWith(".edu.tr")) {
                return 90;
            }

            if (
                trustedDomains.some(
                    domain =>
                        hostname === domain ||
                        hostname.endsWith("." + domain)
                )
            ) {
                return 90;
            }

            if (result.url.startsWith("https://")) {
                return 30;
            }

            return 10;

        } catch (error) {
            return 0;
        }

    }


    /* TEKRARLARI KALDIR */

    const uniqueResults = [];
    const seenUrls = new Set();


    for (const result of results) {

        if (!result || !result.url) {
            continue;
        }


        try {

            const parsedUrl = new URL(result.url);

            parsedUrl.hash = "";

            const cleanUrlStr = parsedUrl.toString();


            if (seenUrls.has(cleanUrlStr)) {
                continue;
            }


            seenUrls.add(cleanUrlStr);


            uniqueResults.push({
                ...result,
                url: cleanUrlStr
            });

        } catch (error) {}

    }


    uniqueResults.sort(
        (a, b) => scoreResult(b) - scoreResult(a)
    );


    const selectedResults = uniqueResults.slice(0, 5);


    /* SAYFALARI ÇEK */

    const sourceTexts = await Promise.all(
        selectedResults.map(
            async result => {

                const pageText = await fetchPageText(result.url);

                return {

                    title: result.title,

                    url: result.url,

                    text: pageText

                };

            }
        )
    );


    let combined = "";


    for (const item of sourceTexts) {

        combined +=
            "\n\nBAŞLIK: " + item.title +
            "\nURL: " + item.url;


        if (item.text) {
            combined += "\nİÇERİK: " + item.text;
        }

    }


    combined = combined.slice(0, 5000);


    return {

        ok: true,

        query: query,

        text: combined,

        sources: sourceTexts.map(
            item => ({
                title: item.title,
                url: item.url
            })
        )

    };

}


/* =========================================================
   HAVA — KONUM BUL
========================================================= */

async function geocodeLocation(location) {

    const url =
        WEATHER_GEOCODING_URL +
        "?name=" + encodeURIComponent(location) +
        "&count=1&language=tr&format=json";


    const response = await fetchWithTimeout(
        url,
        {
            method: "GET",
            headers: {
                "User-Agent": "TurkAI/10.0"
            }
        },
        10000
    );


    if (!response.ok) {
        throw new Error("Konum HTTP " + response.status);
    }


    const data = await response.json();


    if (!data.results || !data.results.length) {
        return null;
    }


    return data.results[0];

}


/* =========================================================
   HAVA DURUMU AL
========================================================= */

async function getWeather(location) {

    const cleanLocation = String(location || "").trim();


    if (!cleanLocation) {

        return {

            ok: false,

            message: "Şehir belirtilmedi."

        };

    }


    console.log("HAVA KONUMU:", cleanLocation);


    const place = await geocodeLocation(cleanLocation);


    if (!place) {

        return {

            ok: false,

            message: cleanLocation + " bulunamadı."

        };

    }


    const url =
        WEATHER_URL +
        "?latitude=" + encodeURIComponent(place.latitude) +
        "&longitude=" + encodeURIComponent(place.longitude) +
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m" +
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code" +
        "&timezone=Europe%2FIstanbul" +
        "&forecast_days=3";


    const response = await fetchWithTimeout(
        url,
        {
            method: "GET",
            headers: {
                "User-Agent": "TürkAI/10.0"
            }
        }
    );


    if (!response.ok) {
        throw new Error("Hava HTTP " + response.status);
    }


    const data = await response.json();


    return {

        ok: true,

        location: {
            name: place.name,
            country: place.country,
            latitude: place.latitude,
            longitude: place.longitude
        },

        current: data.current || {},

        daily: data.daily || {},

        timezone: data.timezone || "Europe/Istanbul"

    };

}


/* =========================================================
   HAVA KODU
========================================================= */

function weatherCodeText(code) {

    const map = {

        0: "Açık",
        1: "Çoğunlukla açık",
        2: "Parçalı bulutlu",
        3: "Kapalı",
        45: "Sisli",
        48: "Kırağılı sis",
        51: "Hafif çiseleme",
        53: "Orta çiseleme",
        55: "Yoğun çiseleme",
        61: "Hafif yağmur",
        63: "Orta yağmur",
        65: "Şiddetli yağmur",
        71: "Hafif kar",
        73: "Orta kar",
        75: "Yoğun kar",
        80: "Hafif sağanak",
        81: "Orta sağanak",
        82: "Şiddetli sağanak",
        95: "Gök gürültülü fırtına",
        96: "Dolu fırtına",
        99: "Şiddetli dolu fırtına"

    };


    return map[code] || "Bilinmiyor";

}


/* =========================================================
   HAVA METNİ
========================================================= */

function formatWeatherForAI(weather) {

    if (!weather || !weather.ok) {
        return "";
    }


    const current = weather.current || {};
    const daily = weather.daily || {};
    const location = weather.location || {};


    let text = `
[GÜNCEL HAVA DURUMU]

Konum:
${location.name || ""}, ${location.country || ""}

Şu an:
${weatherCodeText(current.weather_code)}

Sıcaklık:
${current.temperature_2m ?? "?"} °C

Hissedilen:
${current.apparent_temperature ?? "?"} °C

Nem:
${current.relative_humidity_2m ?? "?"} %

Yağış:
${current.precipitation ?? "?"} mm

Rüzgar:
${current.wind_speed_10m ?? "?"} km/sa

Günlük tahmin:
`;


    if (Array.isArray(daily.time)) {

        for (
            let i = 0;
            i < Math.min(daily.time.length, 3);
            i++
        ) {

            text += `
${daily.time[i]}: Min ${daily.temperature_2m_min?.[i] ?? "?"} °C, Max ${daily.temperature_2m_max?.[i] ?? "?"} °C, Yağış ${daily.precipitation_probability_max?.[i] ?? "?"}%`;

        }

    }


    return text.trim();

}


/* =========================================================
   HAVA SORUSU MU?
========================================================= */

function isWeatherQuestion(message) {

    const text = String(message || "").toLowerCase().trim();


    if (!text) {
        return false;
    }


    const weatherWords = [
        "hava durumu", "hava nasıl", "hava nasil",
        "hava kaç", "bugün hava", "bugun hava",
        "şu an hava", "sıcaklık", "sicaklik",
        "kaç derece", "kac derece",
        "yağmur yağacak", "yagmur yagacak",
        "kar yağacak", "yağış", "rüzgar",
        "nem oranı", "meteoroloji",
        "hava tahmini", "yarın hava"
    ];


    return weatherWords.some(word => text.includes(word));

}


/* =========================================================
   HAVA ŞEHİR ÇIKAR
========================================================= */

function extractWeatherLocation(message) {

    const text = String(message || "").trim();


    if (!text) {
        return null;
    }


    const cities = [
        "adana", "adiyaman", "afyonkarahisar",
        "ağrı", "amasya", "ankara", "antalya",
        "artvin", "aydın", "balıkesir", "bilecik",
        "bingöl", "bitlis", "bolu", "burdur",
        "bursa", "çanakkale", "çankırı", "çorum",
        "denizli", "diyarbakır", "edirne",
        "elazığ", "erzincan", "erzurum",
        "eskişehir", "gaziantep", "giresun",
        "gümüşhane", "hakkari", "hatay",
        "ısparta", "mersin", "istanbul",
        "izmir", "kars", "kastamonu",
        "kayseri", "kırklareli", "kırşehir",
        "kocaeli", "konya", "kütahya",
        "malatya", "manisa", "mardin",
        "muğla", "muş", "nevşehir",
        "niğde", "ordu", "rize",
        "sakarya", "samsun", "siirt",
        "sinop", "sivas", "tekirdağ",
        "tokat", "trabzon", "tunceli",
        "uşak", "van", "yozgat",
        "zonguldak", "aksaray", "bayburt",
        "karaman", "kırıkkale", "batman",
        "şırnak", "bartın", "ardahan",
        "iğdır", "yalova", "karabük",
        "kilis", "osmaniye", "düzce"
    ];


    const lowerText = text.toLowerCase();


    for (const city of cities) {

        if (lowerText.includes(city)) {

            return city
                .charAt(0)
                .toLocaleUpperCase("tr-TR") +
                city.slice(1);

        }

    }


    return null;

}


/* =========================================================
   ARAŞTIRMA GEREKLİ Mİ?
========================================================= */

function shouldResearch(message) {

    const text = String(message || "").toLowerCase().trim();


    if (!text) {
        return false;
    }


    /* Basit mesajlar → araştırma yok */

    const simpleMessages = [
        "slm", "selam", "merhaba", "mrb", "sa",
        "nasılsın", "naber", "ne haber",
        "tamam", "ok", "peki", "anladım",
        "teşekkürler", "sağ ol",
        "görüşürüz", "bye", "hoşça kal",
        "haha", "lol", "vay", "wow",
        "hazır mısın", "çalışıyor musun",
        "orada mısın", "test"
    ];


    if (simpleMessages.includes(text)) {
        return false;
    }


    /* Canlı veri */

    const liveQuestions = [
        "dolar kaç", "dolar ne kadar",
        "euro kaç", "euro ne kadar",
        "sterlin kaç", "sterlin ne kadar",
        "gram altın kaç", "çeyrek altın kaç",
        "bitcoin kaç", "bitcoin ne kadar",
        "hava nasıl", "hava durumu",
        "sıcaklık kaç", "maç kaç kaç",
        "skor kaç", "puan durumu",
        "son haberler", "son dakika",
        "bugün ne oldu", "gündemde ne var",
        "yeni iphone", "telefon fiyatı",
        "okullar ne zaman açılıyor",
        "sınav tarihi", "film hangi platformda"
    ];


    if (liveQuestions.some(q => text.includes(q))) {
        return true;
    }


    /* Açık araştırma isteği */

    const explicitResearch = [
        "internetten araştır",
        "internetten ara",
        "internetten bak",
        "webden araştır",
        "araştır",
        "kaynak bul",
        "güncel bilgi",
        "internet araştırması yap"
    ];


    if (explicitResearch.some(phrase => text.includes(phrase))) {
        return true;
    }


    /* Güncellik + canlı veri */

    const currentWords = [
        "bugün", "bu gün", "şu an", "şu anda",
        "güncel", "en son", "son durum",
        "2025", "2026", "bu yıl", "bu ay"
    ];


    const liveWords = [
        "fiyat", "kaç tl", "ne kadar",
        "dolar", "euro", "kur", "hava",
        "maç", "skor", "haber", "transfer"
    ];


    const hasCurrent = currentWords.some(w => text.includes(w));
    const hasLive = liveWords.some(w => text.includes(w));


    if (hasCurrent && hasLive) {
        return true;
    }


    return false;

}


/* =========================================================
   PARÇA 3 SONU
========================================================= */
