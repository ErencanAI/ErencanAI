"use strict";

require("dotenv").config();

const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

/* ORTAM */
const PORT = Number(process.env.PORT) || 3000;
const TURKAI_PRO_CODE = process.env.TURKAI_PRO_CODE || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";

/* MODELLER */
const GROQ_MODEL = "openai/gpt-oss-20b";
const CEREBRAS_MODEL = "gpt-oss-120b";
const NVIDIA_MODEL = "meta/llama-3.1-405b-instruct";

/* URL'LER */
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

/* DOSYALAR */
const USER_PLANS_FILE = path.join(__dirname, "user_plans.json");
const GROQ_DAILY_USAGE_FILE = path.join(__dirname, "groq_daily_usage.json");
const DAILY_USAGE_FILE = path.join(__dirname, "daily_usage.json");
const MEMORY_FILE = path.join(__dirname, "memory.json");
const USER_MEMORY_FILE = path.join(__dirname, "users_memory.json");
const KNOWLEDGE_FILE = path.join(__dirname, "knowledge.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

/* SABİTLER */
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

/* PLAN LİMİTLERİ */
const DAILY_MESSAGE_LIMITS = {
    free: 50, pro: 100, plus: 200, ultra: 500, developer: 400
};

const PLAN_PRICES = { free: 0, pro: 250, plus: 500 };

const SUBSCRIPTION_PLANS = {
    free: { name: "Free", price: 0, currency: "TRY", period: "monthly" },
    pro: { name: "Pro", price: 100, currency: "TRY", period: "monthly" },
    plus: { name: "Plus", price: 400, currency: "TRY", period: "monthly" },
    ultra: { name: "Ultra", price: 800, currency: "TRY", period: "monthly" }
};

const ALLOWED_FILE_EXTENSIONS = [
    ".txt", ".json", ".js", ".html", ".css",
    ".py", ".cs", ".md", ".csv", ".pdf",
    ".docx", ".png", ".jpg", ".jpeg", ".webp"
];

/* UPLOADS */
try {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
} catch (e) {
    console.error("UPLOADS HATASI:", e.message);
}

/* PLAN FONKSİYONLARI */
function loadUserPlans() {
    if (!fs.existsSync(USER_PLANS_FILE)) {
        fs.writeFileSync(USER_PLANS_FILE, JSON.stringify({}, null, 2), "utf8");
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(USER_PLANS_FILE, "utf8"));
    } catch (e) { return {}; }
}

function saveUserPlans(plans) {
    try {
        fs.writeFileSync(USER_PLANS_FILE, JSON.stringify(plans, null, 2), "utf8");
        return true;
    } catch (e) { return false; }
}

function getUserPlan(userId) {
    if (!userId) return "free";
    const plans = loadUserPlans();
    if (plans[userId] && plans[userId].plan) return plans[userId].plan;
    return "free";
}

function normalizeSubscriptionPlan(plan) {
    const p = String(plan || "").toLowerCase().trim();
    if (p === "pro" || p === "plus" || p === "ultra") return p;
    return "free";
}

function isPlus(plan) {
    return normalizeSubscriptionPlan(plan) === "plus";
}

function getTodayKey() {
    return new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date());
}

function loadDailyUsage() {
    try {
        if (!fs.existsSync(DAILY_USAGE_FILE)) return {};
        const d = JSON.parse(fs.readFileSync(DAILY_USAGE_FILE, "utf8"));
        return (d && typeof d === "object") ? d : {};
    } catch (e) { return {}; }
}

function saveDailyUsage(data) {
    try {
        fs.writeFileSync(DAILY_USAGE_FILE, JSON.stringify(data, null, 2), "utf8");
        return true;
    } catch (e) { return false; }
}

function checkDailyMessageLimit(userId, plan) {
    const usage = loadDailyUsage();
    const today = getTodayKey();
    const clean = normalizeSubscriptionPlan(plan);
    const limit = DAILY_MESSAGE_LIMITS[clean];
    if (!usage[userId] || usage[userId].date !== today) {
        usage[userId] = { date: today, count: 0 };
    }
    return {
        allowed: usage[userId].count < limit,
        used: usage[userId].count,
        limit: limit
    };
}

function incrementDailyMessageUsage(userId, plan) {
    const usage = loadDailyUsage();
    const today = getTodayKey();
    if (!usage[userId] || usage[userId].date !== today) {
        usage[userId] = { date: today, count: 0 };
    }
    usage[userId].count += 1;
    saveDailyUsage(usage);
}

function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

function getCurrentDateInfo() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        dateStyle: "full", timeStyle: "long"
    });
    return {
        iso: now.toISOString(),
        turkey: formatter.format(now),
        year: Number(new Intl.DateTimeFormat("en-US", {
            timeZone: "Europe/Istanbul", year: "numeric"
        }).format(now))
    };
}

const SHORT_SYSTEM_PROMPT =
    "Sen TürkAI'sın. Kullanıcıyla doğal ve kısa konuş. " +
    "Kullanıcının dilinde cevap ver. " +
    "Güncel bilgi gerekiyorsa araştırma sonucunu kullan. " +
    "Gereksiz açıklama yapma. " +
    "Kod sorularında mevcut kodu koru ve sadece gerekli değişikliği öner. " +
    "Kod yazarken kaliteli, okunabilir ve yorumlu kod yaz. " +
    "Dosya oluştururken tam ve çalışabilir kod ver.";

function buildDatePrompt(dateInfo) {
    return `GÜNCEL TARİH: ${dateInfo.turkey}\nISO: ${dateInfo.iso}\nYıl: ${dateInfo.year}`;
}

/* HAFIZA */
function loadMemory() {
    try {
        if (!fs.existsSync(MEMORY_FILE)) {
            fs.writeFileSync(MEMORY_FILE, "[]", "utf8");
            return [];
        }
        const c = fs.readFileSync(MEMORY_FILE, "utf8");
        if (!c.trim()) return [];
        const d = JSON.parse(c);
        if (!Array.isArray(d)) return [];
        return d.filter(i =>
            i && typeof i === "object" &&
            (i.role === "user" || i.role === "assistant") &&
            typeof i.content === "string"
        );
    } catch (e) { return []; }
}

function saveMemory(m) {
    try {
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(m, null, 2), "utf8");
        return true;
    } catch (e) { return false; }
}

let memory = [];

function addMemory(role, content) {
    const c = String(content || "").trim();
    if (!c) return;
    memory.push({
        role: role === "assistant" ? "assistant" : "user",
        content: c,
        time: new Date().toISOString()
    });
    if (memory.length > MAX_MEMORY_MESSAGES) {
        memory = memory.slice(-MAX_MEMORY_MESSAGES);
    }
    saveMemory(memory);
}

let userMemories = {};

function loadUserMemories() {
    try {
        if (!fs.existsSync(USER_MEMORY_FILE)) {
            fs.writeFileSync(USER_MEMORY_FILE, "{}", "utf8");
            return {};
        }
        const c = fs.readFileSync(USER_MEMORY_FILE, "utf8");
        if (!c.trim()) return {};
        const d = JSON.parse(c);
        if (!d || typeof d !== "object" || Array.isArray(d)) return {};
        return d;
    } catch (e) { return {}; }
}

function saveUserMemories() {
    try {
        fs.writeFileSync(USER_MEMORY_FILE, JSON.stringify(userMemories, null, 2), "utf8");
        return true;
    } catch (e) { return false; }
}

function cleanUserId(value) {
    let u = String(value || "").trim();
    if (!u) return "default-user";
    u = u.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
    if (!u) return "default-user";
    return u;
}

function getUserId(req) {
    const h = req.get("X-User-ID");
    const q = req.query && req.query.userId ? req.query.userId : "";
    const b = req.body && req.body.userId ? req.body.userId : "";
    return cleanUserId(h || b || q);
}

function getUserMemory(userId) {
    const id = cleanUserId(userId);
    if (!Array.isArray(userMemories[id])) userMemories[id] = [];
    return userMemories[id];
}

function addUserMemory(userId, role, content) {
    const id = cleanUserId(userId);
    const c = String(content || "").trim();
    if (!c) return;
    const um = getUserMemory(id);
    um.push({
        role: role === "assistant" ? "assistant" : "user",
        content: c,
        time: new Date().toISOString()
    });
    if (um.length > MAX_USER_MEMORY_MESSAGES) {
        userMemories[id] = um.slice(-MAX_USER_MEMORY_MESSAGES);
    }
    saveUserMemories();
}

function findUserName(text) {
    const v = String(text || "");
    const m = v.match(/(?:benim\s+adım|benim\s+ismim|adım|ismim)\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\b/i);
    return m ? m[1] : null;
}

function getUserName(userId) {
    const um = getUserMemory(userId);
    for (let i = um.length - 1; i >= 0; i--) {
        const item = um[i];
        if (!item || item.role !== "user") continue;
        const n = findUserName(item.content);
        if (n) return n;
    }
    return null;
}

function sanitizeInput(text) {
    let c = String(text || "");
    c = c.replace(/\0/g, "");
    c = c.replace(/\s{3,}/g, "  ");
    return c.trim();
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

/* BİLGİ HAFIZASI */
let knowledge = [];

function loadKnowledge() {
    try {
        if (!fs.existsSync(KNOWLEDGE_FILE)) {
            fs.writeFileSync(KNOWLEDGE_FILE, "[]", "utf8");
            return [];
        }
        const c = fs.readFileSync(KNOWLEDGE_FILE, "utf8");
        if (!c.trim()) return [];
        const d = JSON.parse(c);
        return Array.isArray(d) ? d : [];
    } catch (e) { return []; }
}

function saveKnowledge(k) {
    try {
        fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(k, null, 2), "utf8");
        return true;
    } catch (e) { return false; }
}

function saveKnowledgeItem(q, a) {
    const cq = String(q || "").trim();
    const ca = String(a || "").trim();
    if (!cq || !ca || cq.length > 300 || ca.length > 5000) return false;
    const exists = knowledge.some(i =>
        i && typeof i.question === "string" &&
        i.question.toLowerCase() === cq.toLowerCase()
    );
    if (exists) return false;
    knowledge.push({
        question: cq, answer: ca,
        source: "AI", time: new Date().toISOString()
    });
    if (knowledge.length > 8000) knowledge = knowledge.slice(-8000);
    return saveKnowledge(knowledge);
}

function findKnowledgeAnswer(q) {
    const c = String(q || "").trim().toLowerCase();
    if (!c) return null;
    const item = knowledge.find(e =>
        e && typeof e.question === "string" &&
        e.question.trim().toLowerCase() === c
    );
    if (!item) return null;
    console.log("🧠 BİLGİ HAFIZASI");
    return item.answer;
}

function similarityScore(a, b) {
    const s1 = String(a || "").toLowerCase().replace(/[^\wçğıöşü\s]/g, "").trim();
    const s2 = String(b || "").toLowerCase().replace(/[^\wçğıöşü\s]/g, "").trim();
    if (!s1 || !s2) return 0;
    if (s1 === s2) return 1;
    const w1 = s1.split(/\s+/).filter(Boolean);
    const w2 = s2.split(/\s+/).filter(Boolean);
    if (!w1.length || !w2.length) return 0;
    const set1 = new Set(w1), set2 = new Set(w2);
    let common = 0;
    for (const w of set1) if (set2.has(w)) common++;
    const union = new Set([...set1, ...set2]).size;
    return common / union;
}

function findSimilarKnowledge(q) {
    const c = String(q || "").trim();
    if (!c || !knowledge.length || c.length < 5) return null;
    let ba = null, bs = 0;
    for (const i of knowledge) {
        if (!i || typeof i.question !== "string") continue;
        const s = similarityScore(c, i.question);
        if (s > bs) { bs = s; ba = i.answer; }
    }
    if (bs >= 0.75 && ba) {
        console.log("🧠 BENZER SORU %" + Math.round(bs * 100));
        return ba;
    }
    return null;
}

/* BASİT MESAJLAR */
const SIMPLE_MESSAGES = {
    "selam": "Selam! 😎", "slm": "Aleyküm selam!",
    "merhaba": "Merhaba! 👋", "mrb": "Merhaba! 😎",
    "hey": "Hey! 👋", "hello": "Hello! 👋", "hi": "Hi! 👋",
    "nasılsın": "İyiyim knk 😎 Sen nasılsın?",
    "naber": "İyilik knk 😎 Senden naber?",
    "ne haber": "İyilik knk 😎",
    "teşekkürler": "Rica ederim! 😎",
    "teşekkür ederim": "Ne demek! 😎",
    "sağ ol": "Ne demek knk! 😎",
    "eyvallah": "Eyvallah knk 😎",
    "tamam": "Tamamdır! 👍", "ok": "Tamam! 👍",
    "olur": "Olur knk! 👍", "aynen": "Aynen 😎",
    "peki": "Peki! 😎",
    "haha": "😂", "lol": "😂", "xd": "😂",
    "süper": "Süper! 🔥", "harika": "Harika! 🔥",
    "görüşürüz": "Görüşürüz knk! 👋",
    "bye": "Görüşürüz! 👋", "bb": "Görüşürüz! 👋",
    "günaydın": "Günaydın! ☀️",
    "iyi geceler": "İyi geceler! 🌙",
    "hazır mısın": "Hazırım knk! 😎",
    "test": "Test başarılı! ✅",
    "türkai": "Buradayım! 🤖",
    "sen kimsin": "Ben TürkAI'yım. 🤖",
    "adın ne": "Ben TürkAI'yım. 🤖",
    "insan mısın": "Hayır, ben yapay zeka asistanıyım. 🤖",
    "kaç yaşındasın": "Benim gerçek bir yaşım yok. 🤖",
    "yardım": "Tabii! Ne konuda yardım istiyorsun?",
    "ne yapabilirsin": "Soru cevaplarım, kod yazarım, araştırma yaparım. 🤖",
    "iyiyim": "Süper! 😎",
    "moralim bozuk": "Üzülme, her şey geçer. 💙",
    "motivasyon ver": "Başarı, denemekten vazgeçmeyenlerindir. 💪",
    "devam": "Devam ediyoruz! 🚀"
};

function normalizeLocalText(t) {
    return String(t || "").toLocaleLowerCase("tr-TR").trim()
        .replace(/[?!.,;:]+$/g, "").replace(/\s+/g, " ");
}

function detectLocalIntent(t) {
    const c = normalizeLocalText(t);
    if (!c) return "empty";
    if (["selam", "slm", "merhaba", "mrb", "hey", "sa", "selamlar"]
        .some(w => c === w || c.startsWith(w + " "))) return "greeting";
    if (["adın ne", "sen kimsin", "ismin ne"].some(w => c.includes(w))) return "identity";
    if (["teşekkür", "sağol", "eyvallah"].some(w => c.includes(w))) return "thanks";
    if (["nasılsın", "naber", "ne haber"].some(w => c.includes(w))) return "status";
    if (["yardım eder misin", "bana yardım et"].some(w => c.includes(w))) return "help";
    return "unknown";
}

function getLocalIntentAnswer(i) {
    switch (i) {
        case "greeting": return "Selam! 😎 Sana nasıl yardımcı olabilirim?";
        case "identity": return "Ben TürkAI'yım. 🤖";
        case "thanks": return "Rica ederim knk 😎";
        case "status": return "İyiyim knk 😎 Sen nasılsın?";
        case "help": return "Tabii knk. Ne yapmak istiyorsun?";
        default: return null;
    }
}

function localMath(t) {
    const c = String(t || "").trim().toLowerCase();
    const m = c.match(/^(-?\d+(?:[.,]\d+)?)\s*([+\-*/x×])\s*(-?\d+(?:[.,]\d+)?)$/);
    if (!m) return null;
    const a = Number(m[1].replace(",", "."));
    const b = Number(m[3].replace(",", "."));
    const op = m[2];
    let r;
    if (op === "+") r = a + b;
    else if (op === "-") r = a - b;
    else if (op === "*" || op === "x" || op === "×") r = a * b;
    else if (op === "/") {
        if (b === 0) return "Sıfıra bölme yapılamaz. 😎";
        r = a / b;
    }
    if (typeof r === "number" && Number.isFinite(r)) {
        console.log("🧮 MATEMATİK");
        return String(r);
    }
    return null;
}

function localUnitConversion(t) {
    const c = normalizeLocalText(t);
    let m;
    m = c.match(/^([\d.,]+)\s*(km|kilometre)\s*(kaç|kac)?\s*(metre|m)$/i);
    if (m) { const v = parseFloat(m[1].replace(",", ".")); return `${v} km = ${v * 1000} metre`; }
    m = c.match(/^([\d.,]+)\s*(kg|kilogram)\s*(kaç|kac)?\s*(gram|g)$/i);
    if (m) { const v = parseFloat(m[1].replace(",", ".")); return `${v} kg = ${v * 1000} gram`; }
    m = c.match(/^([\d.,]+)\s*(saat)\s*(kaç|kac)?\s*(dakika)$/i);
    if (m) { const v = parseFloat(m[1].replace(",", ".")); return `${v} saat = ${v * 60} dakika`; }
    m = c.match(/^([\d.,]+)\s*(metre|m)\s*(kaç|kac)?\s*(cm|santimetre)$/i);
    if (m) { const v = parseFloat(m[1].replace(",", ".")); return `${v} metre = ${v * 100} cm`; }
    m = c.match(/^([\d.,\-]+)\s*(c|celsius)\s*(kaç|kac)?\s*(f|fahrenheit)$/i);
    if (m) { const v = parseFloat(m[1].replace(",", ".")); return `${v}°C = ${((v * 9 / 5) + 32).toFixed(2)}°F`; }
    return null;
}

function localPercentage(t) {
    const c = normalizeLocalText(t);
    const m = c.match(/^([\d.,]+)\s*(sayısının|sayisinin)?\s*%?\s*([\d.,]+)\s*%$/);
    if (!m) return null;
    const n = parseFloat(m[1].replace(",", "."));
    const p = parseFloat(m[3].replace(",", "."));
    if (!Number.isFinite(n) || !Number.isFinite(p)) return null;
    return `${n} sayısının %${p} değeri = ${n * p / 100}`;
}

function runLocalEngine(t) {
    const ia = getLocalIntentAnswer(detectLocalIntent(t));
    if (ia) return ia;
    const ua = localUnitConversion(t);
    if (ua) return ua;
    const pa = localPercentage(t);
    if (pa) return pa;
    const ma = localMath(t);
    if (ma) return ma;
    return null;
}

function findLocalAnswer(msg) {
    const c = String(msg || "").trim().toLowerCase();
    if (!c) return null;
    const ex = findKnowledgeAnswer(c);
    if (ex) return ex;
    if (Object.prototype.hasOwnProperty.call(SIMPLE_MESSAGES, c)) {
        console.log("💬 BASİT MESAJ");
        return SIMPLE_MESSAGES[c];
    }
    const en = runLocalEngine(c);
    if (en) return en;
    if (c.length > 10) {
        const si = findSimilarKnowledge(c);
        if (si) return si;
    }
    return null;
}

/* FETCH ZAMAN AŞIMI */
async function fetchWithTimeout(url, options = {}, timeout = RESEARCH_TIMEOUT) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

/* GROQ */
async function requestGroq(messages) {
    const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + GROQ_API_KEY
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: messages,
            temperature: 0.2,
            max_tokens: 700,
            stream: false
        })
    });
    const text = await response.text();
    if (!response.ok) {
        const e = new Error("Groq HTTP " + response.status);
        e.status = response.status;
        throw e;
    }
    return JSON.parse(text);
}

/* CEREBRAS */
async function requestCerebras(messages) {
    if (!CEREBRAS_API_KEY) throw new Error("Cerebras anahtar yok.");
    const response = await fetch(CEREBRAS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + CEREBRAS_API_KEY
        },
        body: JSON.stringify({
            model: CEREBRAS_MODEL,
            messages: messages,
            temperature: 0.2,
            max_tokens: 700,
            stream: false
        })
    });
    const text = await response.text();
    if (!response.ok) {
        const e = new Error("Cerebras HTTP " + response.status);
        e.status = response.status;
        throw e;
    }
    return JSON.parse(text);
}

/* GEMINI */
async function requestGemini(messages) {
    if (!GEMINI_API_KEY) throw new Error("Gemini anahtar yok.");
    const sys = messages.filter(m => m && m.role === "system" && m.content)
        .map(m => String(m.content)).join("\n\n");
    const contents = messages.filter(m => m && m.content && m.role !== "system")
        .map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: String(m.content) }]
        }));
    if (sys) contents.unshift({
        role: "user",
        parts: [{ text: "[SİSTEM]\n\n" + sys }]
    });
    const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
            contents: contents,
            generationConfig: { maxOutputTokens: 700, temperature: 0.2 }
        })
    });
    const text = await response.text();
    if (!response.ok) {
        const e = new Error("Gemini HTTP " + response.status);
        e.status = response.status;
        throw e;
    }
    const data = JSON.parse(text);
    let rt = "";
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content)
        rt = data.candidates[0].content.parts.map(p => p.text || "").join("\n").trim();
    return { choices: [{ message: { role: "assistant", content: rt } }] };
}

/* NVIDIA — YENİ */
async function requestNvidia(messages) {
    if (!NVIDIA_API_KEY) throw new Error("NVIDIA anahtar yok.");
    const response = await fetch(NVIDIA_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + NVIDIA_API_KEY
        },
        body: JSON.stringify({
            model: NVIDIA_MODEL,
            messages: messages,
            temperature: 0.2,
            max_tokens: 1024,
            stream: false
        })
    });
    const text = await response.text();
    if (!response.ok) {
        const e = new Error("NVIDIA HTTP " + response.status);
        e.status = response.status;
        throw e;
    }
    return JSON.parse(text);
}

function cleanReply(text) {
    let r = String(text || "").trim();
    if (!r) return "";
    try {
        const p = JSON.parse(r);
        if (p && typeof p.reply === "string") r = p.reply.trim();
    } catch (e) {}
    r = r.replace(/^```(?:json|text|markdown)?\s*/i, "").replace(/\s*```$/i, "").trim();
    r = r.replace(/^(TürkAI|AI|Assistant|ChatGPT|Grok|Gemini|NVIDIA)\s*:\s*/i, "").trim();
    if (r.length > MAX_REPLY_LENGTH) r = r.slice(0, MAX_REPLY_LENGTH) + "\n[Kısaltıldı.]";
    return r;
}

/* AI ZİNCİRİ */
async function requestAI(messages) {
    const lastUser = messages.filter(m => m && m.role === "user").pop();
    let lum = "";
    if (lastUser) {
        if (typeof lastUser.content === "string") lum = lastUser.content.trim().toLowerCase();
    }

    console.log("🔍 SON:", JSON.stringify(lum));

    const la = findLocalAnswer(lum);
    if (la) {
        console.log("✅ YEREL CEVAP");
        return { choices: [{ message: { role: "assistant", content: la } }], local: true };
    }

    let ge = null, ce = null, gme = null, ne = null;

    try {
        console.log("🚀 GROQ");
        const r = await requestGroq(messages);
        if (r) return r;
    } catch (e) { ge = e; console.error("❌ GROQ:", e.message); }

    try {
        console.log("🔄 CEREBRAS");
        const r = await requestCerebras(messages);
        if (r) { console.log("✅ CEREBRAS"); return r; }
    } catch (e) { ce = e; console.error("❌ CEREBRAS:", e.message); }

    try {
        console.log("🔄 GEMINI");
        const r = await requestGemini(messages);
        if (r) { console.log("✅ GEMINI"); return r; }
    } catch (e) { gme = e; console.error("❌ GEMINI:", e.message); }

    try {
        console.log("🔄 NVIDIA");
        const r = await requestNvidia(messages);
        if (r) { console.log("✅ NVIDIA"); return r; }
    } catch (e) { ne = e; console.error("❌ NVIDIA:", e.message); }

    throw new Error(
        "Tüm AI başarısız. Groq: " + (ge?.message || "?") +
        " | Cerebras: " + (ce?.message || "?") +
        " | Gemini: " + (gme?.message || "?") +
        " | NVIDIA: " + (ne?.message || "?")
    );
}

function buildAIErrorMessage(error) {
    if (!error) return "Beklenmeyen hata.";
    const m = String(error.message || "").toLowerCase();
    if (error.name === "AbortError" || m.includes("timeout")) return "Zaman aşımı. Tekrar dene.";
    if (m.includes("fetch") || m.includes("network")) return "Bağlantı kurulamadı.";
    if (m.includes("429")) return "Çok fazla istek. Biraz bekle.";
    if (m.includes("401") || m.includes("403")) return "API anahtarı hatası.";
    if (m.includes("tüm ai")) return "Yapay zeka şu anda yanıt veremiyor.";
    return "Bir hata oluştu. Tekrar dene.";
}

/* ARAŞTIRMA */
const SEARCH_URL = "https://html.duckduckgo.com/html/";
const TCMB_TODAY_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";
const WEATHER_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

function stripHtml(html) {
    return String(html || "")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/\s+/g, " ").trim();
}

function cleanUrl(v) {
    try {
        const u = new URL(v);
        if (u.protocol !== "http:" && u.protocol !== "https:") return "";
        return u.href;
    } catch (e) { return ""; }
}

async function webSearch(query) {
    const q = String(query || "").trim();
    if (!q) return [];
    try {
        const url = SEARCH_URL + "?q=" + encodeURIComponent(q);
        const response = await fetchWithTimeout(url, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept-Language": "tr-TR,tr;q=0.9"
            }
        }, 15000);
        if (!response.ok) throw new Error("HTTP " + response.status);
        const html = await response.text();
        const results = [];
        const rp = /<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        let m;
        while ((m = rp.exec(html)) !== null && results.length < MAX_SEARCH_RESULTS) {
            let h = m[1];
            const t = stripHtml(m[2]).trim();
            if (h.includes("uddg=")) {
                try {
                    const p = new URL(h, "https://html.duckduckgo.com");
                    const ru = p.searchParams.get("uddg");
                    if (ru) h = ru;
                } catch (e) { continue; }
            }
            h = cleanUrl(h);
            if (t && h && !h.includes("duckduckgo.com")) {
                if (!results.some(i => i.url === h)) {
                    results.push({ title: t.slice(0, 300), url: h });
                }
            }
        }
        console.log("WEB:", results.length);
        return results;
    } catch (e) {
        console.error("WEB HATA:", e.message);
        throw e;
    }
}

async function getTcmbUsdRate() {
    const response = await fetchWithTimeout(TCMB_TODAY_URL, {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0" }
    }, 15000);
    if (!response.ok) throw new Error("TCMB HTTP " + response.status);
    const xml = await response.text();
    const m = xml.match(/<Currency[^>]*Kod="USD"[^>]*>[\s\S]*?<ForexBuying>(.*?)<\/ForexBuying>[\s\S]*?<ForexSelling>(.*?)<\/ForexSelling>[\s\S]*?<\/Currency>/);
    if (!m) throw new Error("USD bulunamadı.");
    return { buying: Number(m[1]), selling: Number(m[2]) };
}

async function fetchPageText(url) {
    try {
        const r = await fetchWithTimeout(url, { method: "GET", headers: { "User-Agent": "Mozilla/5.0" } }, 10000);
        if (!r.ok) return "";
        const html = await r.text();
        return stripHtml(html).slice(0, 2000);
    } catch (e) { return ""; }
}

async function researchWeb(query) {
    console.log("ARAŞTIRMA:", query);
    const lq = String(query || "").toLowerCase();

    if (["dolar", "usd", "döviz"].some(w => lq.includes(w))) {
        try {
            const usd = await getTcmbUsdRate();
            return {
                ok: true, query: query,
                text: `TCMB DÖVİZ\nTarih: ${new Date().toLocaleDateString("tr-TR")}\nUSD Alış: ${usd.buying.toFixed(4)} TL\nUSD Satış: ${usd.selling.toFixed(4)} TL`,
                sources: [{ title: "TCMB", url: TCMB_TODAY_URL }]
            };
        } catch (e) { console.error("TCMB:", e.message); }
    }

    const results = await webSearch(query);
    if (!results.length) return { ok: false, query, text: "Sonuç yok.", sources: [] };

    const trusted = ["tcmb.gov.tr", "tff.org", "resmigazete.gov.tr", "gov.tr", "edu.tr", "tuik.gov.tr"];
    function score(r) {
        try {
            const h = new URL(r.url).hostname.toLowerCase();
            if (h.endsWith(".gov.tr")) return 100;
            if (h.endsWith(".edu.tr")) return 90;
            if (trusted.some(d => h === d || h.endsWith("." + d))) return 90;
            if (r.url.startsWith("https://")) return 30;
            return 10;
        } catch (e) { return 0; }
    }

    const seen = new Set();
    const uniq = [];
    for (const r of results) {
        if (!r || !r.url) continue;
        try {
            const p = new URL(r.url);
            p.hash = "";
            const cu = p.toString();
            if (seen.has(cu)) continue;
            seen.add(cu);
            uniq.push({ ...r, url: cu });
        } catch (e) {}
    }
    uniq.sort((a, b) => score(b) - score(a));
    const sel = uniq.slice(0, 5);

    const texts = await Promise.all(sel.map(async r => ({
        title: r.title, url: r.url, text: await fetchPageText(r.url)
    })));

    let comb = "";
    for (const t of texts) {
        comb += "\n\nBAŞLIK: " + t.title + "\nURL: " + t.url;
        if (t.text) comb += "\nİÇERİK: " + t.text;
    }

    return {
        ok: true, query,
        text: comb.slice(0, 5000),
        sources: texts.map(t => ({ title: t.title, url: t.url }))
    };
}

async function geocodeLocation(loc) {
    const url = WEATHER_GEOCODING_URL + "?name=" + encodeURIComponent(loc) + "&count=1&language=tr&format=json";
    const r = await fetchWithTimeout(url, { method: "GET" }, 10000);
    if (!r.ok) throw new Error("Konum HTTP " + r.status);
    const d = await r.json();
    if (!d.results || !d.results.length) return null;
    return d.results[0];
}

async function getWeather(loc) {
    const cl = String(loc || "").trim();
    if (!cl) return { ok: false, message: "Şehir yok." };
    const p = await geocodeLocation(cl);
    if (!p) return { ok: false, message: cl + " bulunamadı." };
    const url = WEATHER_URL + "?latitude=" + p.latitude + "&longitude=" + p.longitude +
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code" +
        "&timezone=Europe%2FIstanbul&forecast_days=3";
    const r = await fetchWithTimeout(url, { method: "GET" });
    if (!r.ok) throw new Error("Hava HTTP " + r.status);
    const d = await r.json();
    return {
        ok: true,
        location: { name: p.name, country: p.country },
        current: d.current || {},
        daily: d.daily || {}
    };
}

function weatherCodeText(code) {
    const map = {
        0: "Açık", 1: "Çoğunlukla açık", 2: "Parçalı bulutlu", 3: "Kapalı",
        45: "Sisli", 51: "Hafif çiseleme", 61: "Hafif yağmur", 63: "Orta yağmur",
        65: "Şiddetli yağmur", 71: "Hafif kar", 73: "Orta kar", 75: "Yoğun kar",
        80: "Sağanak", 95: "Fırtına"
    };
    return map[code] || "Bilinmiyor";
}

function formatWeatherForAI(w) {
    if (!w || !w.ok) return "";
    const c = w.current || {};
    const l = w.location || {};
    return `[HAVA]\n${l.name}, ${l.country}\nDurum: ${weatherCodeText(c.weather_code)}\nSıcaklık: ${c.temperature_2m ?? "?"} °C\nHissedilen: ${c.apparent_temperature ?? "?"} °C\nNem: ${c.relative_humidity_2m ?? "?"} %\nRüzgar: ${c.wind_speed_10m ?? "?"} km/sa`;
}

function isWeatherQuestion(msg) {
    const t = String(msg || "").toLowerCase();
    return ["hava durumu", "hava nasıl", "hava kaç", "sıcaklık", "kaç derece",
        "yağmur yağacak", "kar yağacak", "yağış", "rüzgar", "nem oranı",
        "meteoroloji", "hava tahmini"].some(w => t.includes(w));
}

function extractWeatherLocation(msg) {
    const t = String(msg || "").toLowerCase();
    const cities = ["adana", "ankara", "antalya", "bursa", "denizli",
        "diyarbakır", "erzurum", "eskişehir", "gaziantep", "hatay",
        "istanbul", "izmir", "kayseri", "kocaeli", "konya",
        "malatya", "manisa", "mersin", "muğla", "samsun",
        "sivas", "trabzon", "van", "balıkesir", "şanlıurfa",
        "adıyaman", "afyonkarahisar", "ağrı", "amasya", "artvin",
        "aydın", "bilecik", "bingöl", "bitlis", "bolu", "burdur",
        "çanakkale", "çankırı", "çorum", "edirne", "elazığ",
        "erzincan", "giresun", "gümüşhane", "hakkari", "ısparta",
        "kars", "kastamonu", "kırklareli", "kırşehir", "kütahya",
        "mardin", "muş", "nevşehir", "niğde", "ordu", "rize",
        "sakarya", "siirt", "sinop", "tekirdağ", "tokat",
        "tunceli", "uşak", "yozgat", "zonguldak", "aksaray",
        "bayburt", "karaman", "kırıkkale", "batman", "şırnak",
        "bartın", "ardahan", "iğdır", "yalova", "karabük",
        "kilis", "osmaniye", "düzce"];
    for (const c of cities) {
        if (t.includes(c)) return c.charAt(0).toLocaleUpperCase("tr-TR") + c.slice(1);
    }
    return null;
}

function shouldResearch(msg) {
    const t = String(msg || "").toLowerCase().trim();
    if (!t) return false;

    const simple = ["slm", "selam", "merhaba", "mrb", "sa", "nasılsın", "naber",
        "tamam", "ok", "peki", "anladım", "teşekkürler", "sağ ol",
        "görüşürüz", "bye", "haha", "lol", "hazır mısın", "test",
        "orada mısın", "çalışıyor musun"];
    if (simple.includes(t)) return false;

    const live = ["dolar kaç", "dolar ne kadar", "euro kaç", "gram altın kaç",
        "bitcoin kaç", "hava nasıl", "hava durumu", "sıcaklık kaç",
        "maç kaç kaç", "skor kaç", "son haberler", "son dakika",
        "bugün ne oldu", "gündemde ne var", "okullar ne zaman",
        "sınav tarihi", "film hangi platformda", "telefon fiyatı",
        "yeni iphone", "dolar kuru", "altın fiyatı", "kripto"];
    if (live.some(w => t.includes(w))) return true;

    const explicit = ["internetten araştır", "internetten ara", "internetten bak",
        "webden araştır", "araştır bunu", "kaynak bul",
        "güncel bilgi", "internet araştırması yap"];
    if (explicit.some(w => t.includes(w))) return true;

    const current = ["bugün", "şu an", "güncel", "en son", "son durum", "2026", "2025"];
    const liveW = ["fiyat", "kaç tl", "ne kadar", "dolar", "euro", "hava", "maç", "haber"];
    if (current.some(w => t.includes(w)) && liveW.some(w => t.includes(w))) return true;

    return false;
}

/* EXPRESS */
app.use(express.json({ limit: "15mb" }));
app.use(express.static(__dirname));

app.use((req, res, next) => {
    const cookies = String(req.headers.cookie || "").split(";").reduce((r, i) => {
        const p = i.trim().split("=");
        const k = p.shift();
        const v = p.join("=");
        if (k) r[k] = decodeURIComponent(v || "");
        return r;
    }, {});
    let uid = cookies.erencan_user_id;
    if (!uid) uid = crypto.randomUUID();
    uid = cleanUserId(uid);
    res.setHeader("Set-Cookie", "erencan_user_id=" + encodeURIComponent(uid) + "; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax");
    req.erencanUserId = uid;
    next();
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/pro/activate", express.json(), (req, res) => {
    const code = String(req.body?.code || "").trim();
    const userId = String(req.body?.userId || "").trim();
    if (!code || !TURKAI_PRO_CODE || code !== TURKAI_PRO_CODE) {
        return res.status(403).json({ ok: false, message: "Geçersiz kod." });
    }
    if (!userId) return res.status(400).json({ ok: false, message: "Kullanıcı yok." });
    const plans = loadUserPlans();
    plans[userId] = { plan: "pro", activatedAt: Date.now() };
    saveUserPlans(plans);
    return res.json({ ok: true, plan: "pro", message: "Pro aktif! 🚀" });
});

app.get("/api/test", (req, res) => {
    const d = getCurrentDateInfo();
    return res.json({
        ok: true, ai: "Groq → Cerebras → Gemini → NVIDIA",
        groq: GROQ_API_KEY ? "VAR" : "YOK",
        cerebras: CEREBRAS_API_KEY ? "VAR" : "YOK",
        gemini: GEMINI_API_KEY ? "VAR" : "YOK",
        nvidia: NVIDIA_API_KEY ? "VAR" : "YOK",
        memory: memory.length,
        users: Object.keys(userMemories).length,
        knowledge: knowledge.length,
        currentDate: d.turkey
    });
});

app.get("/api/health", (req, res) => {
    return res.json({ ok: true, service: "TürkAI", uptime: Math.floor(process.uptime()) });
});

app.post("/api/research", async (req, res) => {
    try {
        const query = String(req.body?.query || "").trim();
        if (!query) return res.status(400).json({ ok: false, reply: "Sorgu yok." });
        const result = await researchWeb(query);
        return res.json(result);
    } catch (e) {
        return res.status(500).json({ ok: false, reply: "Araştırma hatası." });
    }
});

app.get("/api/weather", async (req, res) => {
    try {
        const loc = String(req.query?.location || "").trim();
        if (!loc) return res.status(400).json({ ok: false, reply: "Konum yok." });
        const w = await getWeather(loc);
        if (!w.ok) return res.status(404).json(w);
        return res.json(w);
    } catch (e) {
        return res.status(500).json({ ok: false, reply: "Hava hatası." });
    }
});

app.get("/api/user-memory", (req, res) => {
    const userId = getUserId(req);
    const um = getUserMemory(userId);
    return res.json({ ok: true, count: um.length, messages: um });
});

/* ANA CHAT */
app.post("/api/chat", async (req, res) => {
    const start = Date.now();
    try {
        const userId = getUserId(req);
        const userPlan = getUserPlan(userId);
        const limit = checkDailyMessageLimit(userId, userPlan);

        if (!limit.allowed) {
            return res.status(429).json({
                ok: false,
                reply: `Günlük limit doldu (${limit.limit}). Plan: ${userPlan.toUpperCase()}`
            });
        }

        const ctx = isPlus(userPlan) ? PLUS_CONTEXT_MESSAGES :
            userPlan === "pro" ? PRO_CONTEXT_MESSAGES : FREE_CONTEXT_MESSAGES;

        const message = sanitizeInput(req.body?.message || "");
        if (!message) return res.status(400).json({ ok: false, reply: "Mesaj yok." });
        if (message.length > MAX_MESSAGE_LENGTH) return res.status(400).json({ ok: false, reply: "Çok uzun." });

        incrementDailyMessageUsage(userId, userPlan);

        const dateInfo = getCurrentDateInfo();
        addUserMemory(userId, "user", message);
        const um = getUserMemory(userId);

        const newName = findUserName(message);
        const askingName = /(?:benim\s+adım|ismim|adım)\s+ne(?:ydi)?/i.test(message);

        if (newName && !askingName) {
            const reply = "Tamam, adını " + newName + " olarak hatırlayacağım.";
            addUserMemory(userId, "assistant", reply);
            return res.json({ ok: true, reply, userMemory: true });
        }

        let recent = [];
        const isCasual = /^(slm|selam|merhaba|mrb|sa|hey|nas[ı i]ls[ı i]n|naber|nbr)$/i.test(message.trim());
        if (!isCasual) recent = um.slice(-ctx);

        const cleanRecent = recent.filter(i =>
            !(i && i.role === "assistant" && typeof i.content === "string" &&
              i.content.includes("[İNTERNET"))
        );

        let researchCtx = "", researchSrc = [], researchUsed = false;

        if (shouldResearch(message)) {
            try {
                if (isWeatherQuestion(message)) {
                    let loc = extractWeatherLocation(message) || "Konya";
                    const w = await getWeather(loc);
                    if (w && w.ok) {
                        researchCtx = formatWeatherForAI(w);
                        researchUsed = true;
                    }
                } else {
                    const r = await researchWeb(message);
                    if (r && r.ok) {
                        researchCtx = "[ARAŞTIRMA]\n" + r.text;
                        researchSrc = r.sources || [];
                        researchUsed = true;
                    }
                }
            } catch (e) { console.error("Araştırma:", e.message); }
        }

        const messages = [
            { role: "system", content: SHORT_SYSTEM_PROMPT },
            { role: "system", content: buildDatePrompt(dateInfo) }
        ];

        for (const item of cleanRecent.slice(-ctx)) {
            if (!item || !item.content || typeof item.content !== "string") continue;
            messages.push({
                role: item.role === "assistant" ? "assistant" : "user",
                content: String(item.content)
            });
        }

        if (researchCtx) {
            messages.push({ role: "system", content: researchCtx });
        }

        const data = await requestAI(messages);

        let reply = "";
        if (data && Array.isArray(data.choices) && data.choices[0]?.message?.content) {
            reply = data.choices[0].message.content.trim();
        }
        reply = cleanReply(reply);

        if (reply && !data.local && !researchUsed) {
            saveKnowledgeItem(message, reply);
        }

        if (!reply) return res.status(500).json({ ok: false, reply: "Boş cevap." });

        addUserMemory(userId, "assistant", reply);
        addMemory("user", message);
        addMemory("assistant", reply);

        const elapsed = Date.now() - start;
        console.log("✅ CEVAP", elapsed + "ms");

        return res.json({
            ok: true, reply,
            timeMs: elapsed,
            model: "multi",
            currentDate: dateInfo.turkey,
            userMemory: true, userId,
            researchUsed, sources: researchSrc
        });

    } catch (error) {
        const elapsed = Date.now() - start;
        console.error("❌ CHAT HATA:", error.message);
        return res.status(500).json({
            ok: false,
            reply: buildAIErrorMessage(error),
            timeMs: elapsed
        });
    }
});

/* 404 */
app.use((req, res) => {
    return res.status(404).json({ ok: false, error: "Bulunamadı." });
});

/* HATA */
app.use((error, req, res, next) => {
    console.error("EXPRESS:", error.message);
    if (res.headersSent) return next(error);
    return res.status(500).json({ ok: false, reply: "Sunucu hatası." });
});

/* WEBRTC */
const videoRooms = new Map();
io.on("connection", (socket) => {
    console.log("[VIDEO]", socket.id);
    socket.on("video:join", (roomId) => {
        const room = String(roomId || "").trim();
        if (!room) return;
        if (!videoRooms.has(room)) videoRooms.set(room, new Set());
        const users = videoRooms.get(room);
        if (users.size >= 2) { socket.emit("video:room-full"); return; }
        users.add(socket.id);
        socket.join(room);
        socket.data.videoRoom = room;
        socket.emit("video:joined", { roomId: room, initiator: users.size <= 1 });
        socket.to(room).emit("video:user-joined");
    });
    socket.on("video:offer", (d) => { const r = socket.data.videoRoom; if (r) socket.to(r).emit("video:offer", d); });
    socket.on("video:answer", (d) => { const r = socket.data.videoRoom; if (r) socket.to(r).emit("video:answer", d); });
    socket.on("video:ice-candidate", (d) => { const r = socket.data.videoRoom; if (r) socket.to(r).emit("video:ice-candidate", d); });
    socket.on("video:end", () => { const r = socket.data.videoRoom; if (r) socket.to(r).emit("video:ended"); });
    socket.on("disconnect", () => {
        const r = socket.data.videoRoom;
        if (!r) return;
        const u = videoRooms.get(r);
        if (u) {
            u.delete(socket.id);
            socket.to(r).emit("video:user-left");
            if (u.size === 0) videoRooms.delete(r);
        }
    });
});

/* YÜKLE */
memory = loadMemory();
userMemories = loadUserMemories();
knowledge = loadKnowledge();

console.log("HAFIZA:", memory.length);
console.log("KULLANICILAR:", Object.keys(userMemories).length);
console.log("BİLGİ:", knowledge.length);

/* BAŞLAT */
httpServer.listen(PORT, "0.0.0.0", () => {
    const d = getCurrentDateInfo();
    console.log("=================================");
    console.log("        TÜRKAI 10.0");
    console.log("=================================");
    console.log("Web: http://localhost:" + PORT);
    console.log("AI: Groq → Cerebras → Gemini → NVIDIA");
    console.log("Groq:", GROQ_API_KEY ? "✅" : "❌");
    console.log("Cerebras:", CEREBRAS_API_KEY ? "✅" : "❌");
    console.log("Gemini:", GEMINI_API_KEY ? "✅" : "❌");
    console.log("NVIDIA:", NVIDIA_API_KEY ? "✅" : "❌");
    console.log("Tarih:", d.turkey);
    console.log("=================================");
});
