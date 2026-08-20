"use strict";
require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const app = express();
const TURKAI_PRO_CODE = process.env.TURKAI_PRO_CODE || "";

app.post(
    "/api/pro/activate",
    express.json(),
    (req, res) => {

        const enteredCode =
            String(req.body?.code || "").trim();

        if (
            !enteredCode ||
            !TURKAI_PRO_CODE ||
            enteredCode !== TURKAI_PRO_CODE
        ) {
            return res.status(403).json({
                ok: false,
                message: "GeÃ§ersiz Pro kodu."
            });
        }

        return res.json({
            ok: true,
            plan: "pro",
            message: "TÃ¼rkAI Pro etkinleÅŸtirildi! ğŸš€"
        });
    }
);
// TÃœRKAI GÃœNLÃœK MESAJ LÄ°MÄ°TLERÄ°
const DAILY_LIMITS = {
    free: 200,
    pro: 400,
    developer: 500
};

function getTodayKey() {
    const now = new Date();

    return new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(now);
}
const GROQ_DAILY_USAGE_FILE = "./groq_daily_usage.json";
function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

function loadGroqDailyUsage() {

    if (!fs.existsSync(GROQ_DAILY_USAGE_FILE)) {

        const data = {
            date: getTodayDate(),
            requests: 0,
            tokens: 0
        };

        fs.writeFileSync(
            GROQ_DAILY_USAGE_FILE,
            JSON.stringify(data, null, 2),
            "utf8"
        );

        return data;
    }

    try {

        const data = JSON.parse(
            fs.readFileSync(
                GROQ_DAILY_USAGE_FILE,
                "utf8"
            )
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

        return data;

    } catch (error) {

        console.error(
            "GROQ GÃœNLÃœK DOSYA HATASI:",
            error.message
        );

        return {
            date: getTodayDate(),
            requests: 0,
            tokens: 0
        };
    }
}

function addGroqUsage(tokens = 0) {

    const usage =
        loadGroqDailyUsage();

    usage.requests += 1;
    usage.tokens += Number(tokens) || 0;

    fs.writeFileSync(
        GROQ_DAILY_USAGE_FILE,
        JSON.stringify(
            usage,
            null,
            2
        ),
        "utf8"
    );

    console.log(
        "GROQ GÃœNLÃœK Ä°STEK:",
        usage.requests
    );

    console.log(
        "GROQ GÃœNLÃœK TOKEN:",
        usage.tokens
    );
}
/* =========================================================
SUNUCU
========================================================= */

const PORT =
    Number(process.env.PORT) || 3000;
  const CEREBRAS_MODEL =
    "gpt-oss-120b";
    const GROQ_MODEL =
    "openai/gpt-oss-20b";
    const GROQ_API_KEY =
    process.env.GROQ_API_KEY ||
    "";
    const GROQ_URL =
    "https://api.groq.com/openai/v1/chat/completions";

const CEREBRAS_API_KEY =
    process.env.CEREBRAS_API_KEY ||
    "";
const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";
const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY ||
    "";
    /* =========================================================
GROQ GÃœNLÃœK KULLANIM TAKÄ°BÄ°
Dosya yoksa otomatik oluÅŸturulur.
========================================================= */

function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

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

        const data =
            JSON.parse(
                fs.readFileSync(
                    GROQ_DAILY_USAGE_FILE,
                    "utf8"
                )
            );

        /* GÃ¼n deÄŸiÅŸtiyse sayaÃ§larÄ± sÄ±fÄ±rla */

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
            "GROQ GÃœNLÃœK KULLANIM DOSYASI OKUNAMADI:",
            error.message
        );

        return {
            date: getTodayDate(),
            requests: 0,
            tokens: 0
        };
    }
}


function saveGroqDailyUsage(data) {

    try {

        fs.writeFileSync(
            GROQ_DAILY_USAGE_FILE,
            JSON.stringify(
                data,
                null,
                2
            ),
            "utf8"
        );

    } catch (error) {

        console.error(
            "GROQ GÃœNLÃœK KULLANIM KAYDEDÄ°LEMEDÄ°:",
            error.message
        );
    }
}


function addGroqUsage(tokens = 0) {

    const usage =
        loadGroqDailyUsage();

    usage.requests += 1;
    usage.tokens += Number(tokens) || 0;

    saveGroqDailyUsage(
        usage
    );

    console.log(
        "GROQ GÃœNLÃœK Ä°STEK:",
        usage.requests
    );

    console.log(
        "GROQ GÃœNLÃœK TOKEN:",
        usage.tokens
    );
}
/* =========================================================
GROQ   CEBRAS   GEMINI YEDEK S STEM
========================================================= */

async function requestAI(
    messages
) {

    const lastUserMessage =
        messages
            .filter(
                m =>
                    m &&
                    m.role === "user"
            )
            .pop()
            ?.content
            ?.trim()
            .toLowerCase() || "";
console.log(
    "YEREL MESAJ KONTROLÃœ:",
    JSON.stringify(lastUserMessage)
);

    /* =========================================================
    BASÄ°T MESAJLAR
    API KULLANILMAZ
    ========================================================= */

  const simpleMessages = {

    // =========================
    // SELAMLAÅMA
    // =========================

    "selam":
        "Selam! Sana nasÄ±l yardÄ±mcÄ± olabilirim?",

    "slm":
        "AleykÃ¼m selam!",

    "sa":
        "AleykÃ¼m selam!",

    "merhaba":
        "Merhaba! Sana nasÄ±l yardÄ±mcÄ± olabilirim?",

    "mrb":
        "Merhaba! ğŸ˜„",

    "hey":
        "Hey! ğŸ‘‹",

    "naber":
        "Ä°yiyim ğŸ˜„ Sen nasÄ±lsÄ±n?",

    "nasÄ±lsÄ±n":
        "Ä°yiyim, teÅŸekkÃ¼r ederim! Sen nasÄ±lsÄ±n?",

    "nasilsin":
        "Ä°yiyim, teÅŸekkÃ¼r ederim! Sen nasÄ±lsÄ±n?",

    // =========================
    // GÃœNAYDIN / AKÅAM / GECE
    // =========================

    "gÃ¼naydÄ±n":
        "GÃ¼naydÄ±n! â˜€ï¸",

    "gunaydin":
        "GÃ¼naydÄ±n! â˜€ï¸",

    "iyi akÅŸamlar":
        "Ä°yi akÅŸamlar! ğŸŒ†",

    "iyi aksamlar":
        "Ä°yi akÅŸamlar! ğŸŒ†",

   

    "iyi geceler":
        "Sana da iyi geceler! ğŸŒ™",

    // =========================
    // TEÅEKKÃœR
    // =========================

    "teÅŸekkÃ¼rler":
        "Rica ederim! ğŸ˜Š",

    "teÅŸekkÃ¼r ederim":
        "Rica ederim! ğŸ˜Š",

    "tesekkurler":
        "Rica ederim! ğŸ˜Š",

    "tesekkur ederim":
        "Rica ederim! ğŸ˜Š",

    "saÄŸol":
        "Ne demek! ğŸ˜Š",

    "saÄŸ ol":
        "Ne demek! ğŸ˜Š",

    "sagol":
        "Ne demek! ğŸ˜Š",

    "sag ol":
        "Ne demek! ğŸ˜Š",

    // =========================
    // ONAY / KISA CEVAPLAR
    // =========================

    "tamam":
        "TamamdÄ±r! ğŸ‘",

    "tmm":
        "TamamdÄ±r! ğŸ‘",

    "ok":
        "TamamdÄ±r! ğŸ‘",

    "olur":
        "Olur! ğŸ˜",

    "peki":
        "Peki! ğŸ‘",

    "aynen":
        "Aynen! ğŸ˜",

    "evet":
        "Tamam! ğŸ‘",

    "hayÄ±r":
        "Tamam, sorun deÄŸil.",

    "hayir":
        "Tamam, sorun deÄŸil.",

    // =========================
    // VEDALAÅMA
    // =========================

    "gÃ¶rÃ¼ÅŸÃ¼rÃ¼z":
        "GÃ¶rÃ¼ÅŸÃ¼rÃ¼z! ğŸ‘‹",

    "gorusuruz":
        "GÃ¶rÃ¼ÅŸÃ¼rÃ¼z! ğŸ‘‹",

    "bye":
        "GÃ¶rÃ¼ÅŸÃ¼rÃ¼z! ğŸ‘‹",

    "bay":
        "GÃ¶rÃ¼ÅŸÃ¼rÃ¼z! ğŸ‘‹",

    "hoÅŸÃ§akal":
        "HoÅŸÃ§a kal! ğŸ‘‹",

    "hoscakal":
        "HoÅŸÃ§a kal! ğŸ‘‹",

    // =========================
    // ERencanaAI
    // =========================

    "erencanai":
        "BuradayÄ±m! ğŸ¤–",

    "erencan ai":
        "BuradayÄ±m! ğŸ¤–",

    "test":
        "Test baÅŸarÄ±lÄ±! TÃ¼rkAI Ã§alÄ±ÅŸÄ±yor. âœ…",

    "Ã§alÄ±ÅŸÄ±yor musun":
        "Evet! BuradayÄ±m ve Ã§alÄ±ÅŸÄ±yorum. ğŸ¤–",

    "calisiyor musun":
        "Evet! BuradayÄ±m ve Ã§alÄ±ÅŸÄ±yorum. ğŸ¤–",

    "burada mÄ±sÄ±n":
        "Evet, buradayÄ±m! ğŸ‘‹",

    "burada misin":
        "Evet, buradayÄ±m! ğŸ‘‹",

    // =========================
    // KÄ°MLÄ°K
    // =========================

    "adÄ±n ne":
        "Ben TÃ¼rkAI'yÄ±m. ğŸ¤–",

    "adin ne":
        "Ben TÃ¼rkAI'yÄ±m. ğŸ¤–",

    "sen kimsin":
        "Ben TÃ¼rkAI'yÄ±m. ğŸ¤–",

    "sen kimsin?":
        "Ben TÃ¼rkAI'yÄ±m. ğŸ¤–",

    "ismin ne":
        "Ben TÃ¼rkAI'yÄ±m. ğŸ¤–",

    "ne yapÄ±yorsun":
        "Seninle konuÅŸuyorum ve sana yardÄ±mcÄ± olmaya Ã§alÄ±ÅŸÄ±yorum. ğŸ˜„",

    "ne yapiyorsun":
        "Seninle konuÅŸuyorum ve sana yardÄ±mcÄ± olmaya Ã§alÄ±ÅŸÄ±yorum. ğŸ˜„",

    // =========================
    // YARDIM
    // =========================

    "yardÄ±m":
        "Tabii! Ne konuda yardÄ±m istiyorsun?",

    "yardim":
        "Tabii! Ne konuda yardÄ±m istiyorsun?",

    "yardÄ±m eder misin":
        "Tabii ki! ğŸ˜ Ne yapmamÄ± istersin?",

    "yardim eder misin":
        "Tabii ki! ğŸ˜ Ne yapmamÄ± istersin?",

    "bana yardÄ±m et":
        "Tabii! Sorununu anlat, birlikte Ã§Ã¶zelim.",

    "bana yardim et":
        "Tabii! Sorununu anlat, birlikte Ã§Ã¶zelim.",

    // =========================
    // DUYGULAR / SOHBET
    // =========================

    "iyiyim":
        "SÃ¼per! ğŸ˜",

    "iyi":
        "Harika! ğŸ˜„",

    "kÃ¶tÃ¼yÃ¼m":
        "ÃœzgÃ¼nÃ¼m. Ä°stersen ne olduÄŸunu anlatabilirsin.",

    "kotuyum":
        "ÃœzgÃ¼nÃ¼m. Ä°stersen ne olduÄŸunu anlatabilirsin.",

    "mutluyum":
        "Buna sevindim! ğŸ˜„",

    "Ã¼zgÃ¼nÃ¼m":
        "UmarÄ±m kÄ±sa zamanda daha iyi hissedersin.",

    "uzgunum":
        "UmarÄ±m kÄ±sa zamanda daha iyi hissedersin.",

    // =========================
    // EÄLENCELÄ°
    // =========================

    "haha":
        "ğŸ˜‚",

    "hahaha":
        "ğŸ˜‚ğŸ˜‚",

    "lol":
        "ğŸ˜‚",

    "xd":
        "ğŸ˜‚",

    "komik":
        "ğŸ˜„ EÄŸlendirebildiysem ne mutlu!",

    // =========================
    // BASÄ°T SORULAR
    // =========================

    "kaÃ§ yaÅŸÄ±ndasÄ±n":
        "Benim gerÃ§ek bir yaÅŸÄ±m yok. ğŸ¤–",

    "kac yasindasin":
        "Benim gerÃ§ek bir yaÅŸÄ±m yok. ğŸ¤–",

    "nerelisin":
        "Ben bir yapay zekÃ¢yÄ±m, belirli bir memleketim yok. ğŸŒ",

    "nerelisin?":
        "Ben bir yapay zekÃ¢yÄ±m, belirli bir memleketim yok. ğŸŒ",

    "insan mÄ±sÄ±n":
        "HayÄ±r, ben yapay zekÃ¢ asistanÄ±yÄ±m. ğŸ¤–",

    "insan misin":
        "HayÄ±r, ben yapay zekÃ¢ asistanÄ±yÄ±m. ğŸ¤–",

    "robot musun":
        "Ben fiziksel bir robot deÄŸilim; bir yapay zekÃ¢ yazÄ±lÄ±mÄ±yÄ±m. ğŸ¤–",

    // =========================
    // KAPATMA / DURUM
    // =========================

    "hazÄ±r mÄ±sÄ±n":
        "Her zaman hazÄ±rÄ±m! ğŸ˜",

    "hazir misin":
        "Her zaman hazÄ±rÄ±m! ğŸ˜",

    "baÅŸlayalÄ±m":
        "Hadi baÅŸlayalÄ±m! ğŸš€",

    "baslayalim":
        "Hadi baÅŸlayalÄ±m! ğŸš€",

    "devam":
        "Devam ediyoruz! ğŸš€",

    // =========================
    // EMOJÄ°
    // =========================

    "ğŸ˜€":
        "ğŸ˜€",

    "ğŸ˜‚":
        "ğŸ˜‚",

    "ğŸ‘":
        "ğŸ‘",

    "â¤ï¸":
        "â¤ï¸",

    "ğŸ˜":
        "ğŸ˜",

    "ğŸ¤–":
        "ğŸ¤–",

    "ğŸš€":
        "ğŸš€",

    "ğŸ”¥":
        "ğŸ”¥"
};


    /*
    SADECE TAM EÅLEÅMEDE hazÄ±r cevap ver.
    BÃ¶ylece:

    "selam"          â†’ hazÄ±r cevap
    "selam nasÄ±lsÄ±n" â†’ API
    "merhaba"        â†’ hazÄ±r cevap
    "merhaba nasÄ±lsÄ±n" â†’ API
    */

    if (
        Object.prototype.hasOwnProperty.call(
            simpleMessages,
            lastUserMessage
        )
    ) {

        console.log(
            "BASÄ°T MESAJ â†’ API KULLANILMADI"
        );

        return simpleMessages[
            lastUserMessage
        ];
    }


    /* =========================================================
    NORMAL AI SÄ°STEMÄ°
    ========================================================= */

    try {

        console.log(
            "AI: GROQ"
        );

        return await requestGroq(
            messages
        );

    } catch (groqError) {

        console.error(
            "GROQ BAÅARISIZ, CEREBRAS'A GEÃ‡Ä°LÄ°YOR:",
            groqError.message
        );

        try {

            console.log(
                "AI: CEREBRAS YEDEK"
            );

            return await requestCerebras(
                messages
            );

        } catch (cerebrasError) {

            console.error(
                "CEREBRAS DA BAÅARISIZ, GEMINI'YE GEÃ‡Ä°LÄ°YOR:",
                cerebrasError.message
            );

            try {

                console.log(
                    "AI: GEMINI YEDEK"
                );

                return await requestGemini(
                    messages
                );

            } catch (geminiError) {

                console.error(
                    "GEMINI DE BAÅARISIZ:",
                    geminiError.message
                );

                console.error(
                    "GEMINI DETAY:",
                    geminiError
                );

                throw new Error(
                    "Groq, Cerebras ve Gemini kullanÄ±lamÄ±yor."
                );
            }
        }
    }
}
/* =========================================================`r`nARA?TIRMA
========================================================= */

const SEARCH_URL =
    "https://html.duckduckgo.com/html/";
    const TCMB_TODAY_URL =
    "https://www.tcmb.gov.tr/kurlar/today.xml";
const GITHUB_SEARCH_URL = "https://api.github.com/search/repositories";

const WEATHER_GEOCODING_URL =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_URL =
    "https://api.open-meteo.com/v1/forecast";

const RESEARCH_TIMEOUT =
    12000;

const MAX_SEARCH_RESULTS =
    6;

/* =========================================================
ESK? HAFIZA
========================================================= */

const MEMORY_FILE =
    path.join(
        __dirname,
        "memory.json"
    );
const KNOWLEDGE_FILE =
    path.join(
        __dirname,
        "knowledge.json"
    );
    function loadKnowledge() {
    try {
        if (!fs.existsSync(KNOWLEDGE_FILE)) {
            fs.writeFileSync(
                KNOWLEDGE_FILE,
                "[]",
                "utf8"
            );

            return [];
        }

        const content =
            fs.readFileSync(
                KNOWLEDGE_FILE,
                "utf8"
            );

        if (!content.trim()) {
            return [];
        }

        const data =
            JSON.parse(content);

        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {
        console.error(
            "BÄ°LGÄ° HAFIZASI OKUMA HATASI:",
            error.message
        );

        return [];
    }
}


function saveKnowledge(knowledge) {
    try {
        fs.writeFileSync(
            KNOWLEDGE_FILE,
            JSON.stringify(
                knowledge,
                null,
                2
            ),
            "utf8"
        );

        return true;

    } catch (error) {
        console.error(
            "BÄ°LGÄ° HAFIZASI KAYDETME HATASI:",
            error.message
        );

        return false;
    }
}
function saveKnowledgeItem(question, answer) {
    const cleanQuestion =
        String(question || "").trim();

    const cleanAnswer =
        String(answer || "").trim();

    if (!cleanQuestion || !cleanAnswer) {
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
        source: "Groq",
        time: new Date().toISOString()
    });

    return saveKnowledge(knowledge);
}

let knowledge =
    loadKnowledge();
const MAX_MEMORY_MESSAGES =
    400;
/* =========================================================
   ABONELİK SİSTEMİ
   FREE / PRO / PLUS
========================================================= */

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
    }
};

function normalizeSubscriptionPlan(plan) {

    const cleanPlan =
        String(plan || "")
            .toLowerCase()
            .trim();

    if (
        cleanPlan === "pro" ||
        cleanPlan === "plus"
    ) {
        return cleanPlan;
    }

    return "free";
}

function getSubscriptionPlan(plan) {

    const cleanPlan =
        normalizeSubscriptionPlan(plan);

    return SUBSCRIPTION_PLANS[cleanPlan];
}

function isProOrHigher(plan) {

    const cleanPlan =
        normalizeSubscriptionPlan(plan);

    return (
        cleanPlan === "pro" ||
        cleanPlan === "plus"
    );
}

function isPlus(plan) {

    return (
        normalizeSubscriptionPlan(plan) ===
        "plus"
    );
}
const CONTEXT_MESSAGES =
    30;

/* =========================================================
KULLANICIYA ?ZEL HAFIZA
========================================================= */

const USERS_MEMORY_FILE =
    path.join(
        __dirname,
        "users_memory.json"
    );

const MAX_USER_MEMORY_MESSAGES =
    400;

const USER_CONTEXT_MESSAGES = 2;
    30;

/* =========================================================
API AYARLARI
========================================================= */

const REQUEST_TIMEOUT =
    30000;

const MAX_RETRIES =
    0;

const MAX_MESSAGE_LENGTH =
    12000;

const MAX_REPLY_LENGTH =
    30000;

/* =========================================================
DOSYA Y?KLEME AYARLARI
========================================================= */

const UPLOADS_DIR =
    path.join(
        __dirname,
        "uploads"
    );

const MAX_FILE_SIZE =
    10 * 1024 * 1024;

const ALLOWED_FILE_EXTENSIONS = [
    ".txt",
    ".json",
    ".js",
    ".html",
    ".css",
    ".py",
    ".cs",
    ".md",
    ".csv",
    ".pdf",
    ".docx",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp"
];

/* =========================================================
UPLOADS KLAS?R?
========================================================= */

try {

    if (
        !fs.existsSync(
            UPLOADS_DIR
        )
    ) {

        fs.mkdirSync(
            UPLOADS_DIR,
            {
                recursive: true
            }
        );

    }

} catch (error) {

    console.error(
        "UPLOADS KLAS?R? OLU?TURULAMADI:",
        error.message
    );

}

/* =========================================================
TAR?H / ZAMAN
========================================================= */

function getCurrentDateInfo() {

    const now =
        new Date();

    const formatter =
        new Intl.DateTimeFormat(
            "tr-TR",
            {
                timeZone:
                    "Europe/Istanbul",

                dateStyle:
                    "full",

                timeStyle:
                    "long"
            }
        );

    return {

        iso:
            now.toISOString(),

        turkey:
            formatter.format(now),

        year:
            Number(
                new Intl.DateTimeFormat(
                    "en-US",
                    {
                        timeZone:
                            "Europe/Istanbul",

                        year:
                            "numeric"
                    }
                ).format(now)
            )

    };

}

/* =========================================================
GEL??M?? S?STEM PROMPTU
========================================================= */

const SYSTEM_PROMPT = `
Sen TÃ¼rkAI adl? geli?mi?, h?zl?, do?al, g?venilir ve yard?mc? bir yapay zeka asistan?s?n.

TEMEL K?ML?K:

- Ad?n .
- Kullan?c?yla do?al ?ekilde konu?.
- Ana dilin T?rk?edir.
- Kullan?c?n?n kulland??? dili otomatik olarak alg?la.
- Kullan?c? hangi dilde yaz?yorsa m?mk?n oldu?unca ayn? dilde cevap ver.
- Kullan?c? dil de?i?tirirse sen de dili de?i?tir.
- Kullan?c? ?zellikle ba?ka bir dil isterse o dili kullan.
- ?eviri istenmedi?i s?rece kullan?c?n?n mesaj?n? gereksiz yere ba?ka dile ?evirme.
- Cevap verirken se?ilen dili do?al ve ak?c? ?ekilde kullan.
- Kelime kelime ?eviri gibi yapay ifadeler kullanma.
- Bir dilde yeterince emin de?ilsen uydurma.

DESTEKLENEN YAYGIN D?LLER:

T?rk?e
?ngilizce
Almanca
Frans?zca
?spanyolca
?talyanca
Portekizce
Brezilya Portekizcesi
Rus?a
Ukraynaca
Leh?e
Felemenk?e
?sve??e
Norve??e
Danca
Fince
?ek?e
Slovak?a
Macarca
Romence
Bulgarca
Yunanca
S?rp?a
H?rvat?a
Bo?nak?a
Slovence
Arap?a
?branice
Fars?a
Hint?e
Urduca
Bengalce
Pencap?a
Marathi
Tamilce
Teluguca
Endonezce
Malayca
Vietnamca
Tayca
?ince
Basitle?tirilmi? ?ince
Geleneksel ?ince
Japonca
Korece

Bu dillerden biriyle konu?uldu?unda m?mk?n oldu?unca o dilde do?al cevap ver.

D?L KURALLARI:

1. Kullan?c?n?n kulland??? dili otomatik alg?la.
2. Ayn? dilde cevap vermeyi tercih et.
3. Kullan?c? a??k?a dil de?i?tirirse hemen uyum sa?la.
4. Kullan?c? "?ngilizce konu?" derse ?ngilizce konu?.
5. Kullan?c? "T?rk?e konu?" derse T?rk?e konu?.
6. Kullan?c? "Almanca cevapla" derse Almanca cevapla.
7. Kullan?c? ?eviri isterse istenen hedef dile ?evir.
8. ?eviri s?ras?nda anlam? koru.
9. ?zel isimleri gereksiz yere de?i?tirme.
10. Kod i?indeki programlama s?zdizimini bozma.
11. Teknik terimleri gerekti?inde orijinal halleriyle kullan.
12. Dil de?i?imi i?in kullan?c?dan tekrar tekrar izin isteme.
13. Kullan?c?n?n dilini yanl?? alg?larsan sonraki mesajdaki dili takip et.

DO?AL KONU?MA:

- Samimi ol ama gereksiz yere a??r? samimi olma.
- Sayg?l? ol.
- Kullan?c? hata yapt???nda k???mseme.
- Kullan?c? sinirliyse gereksiz ?ekilde uzatma.
- Kullan?c?n?n konu?ma tarz?n? anlay?p uygun ?ekilde cevap ver.
- Gereksiz emoji kullanma.
- Kullan?c? k?sa cevap istiyorsa k?sa cevap ver.

DO?RULUK:

1. Bilmedi?in bilgiyi uydurma.
2. Emin olmad???n bilgiyi kesin ger?ek gibi s?yleme.
3. G?ncel bilgi gerekti?inde ara?t?rma sonu?lar?n? kullan.
4. Ara?t?rma sonu?lar? verilmi?se onlar? ?ncelikli bilgi kayna?? olarak kullan.
5. Ara?t?rma sonucunda yeterli bilgi yoksa bunu d?r?st?e belirt.
6. Tarihleri birbirine kar??t?rma.
7. Ge?mi? olaylar? gelecekteymi? gibi anlatma.
8. Gelecekteki olaylar? ger?ekle?mi? gibi anlatma.
9. "bug?n", "d?n", "yar?n", "?u an", "bu y?l" gibi ifadelerde mevcut tarih bilgisini dikkate al.
10. G?ncel internet bilgisine sahip olmad???n durumda ara?t?rma yap?lmad?ysa bunu belirt.
11. ?nternetten do?rulanmas? gereken bilgileri uydurma.
12. Kullan?c? daha ?nce konu?ulan bir konuyu devam ettiriyorsa ba?lam? kullan.

?NTERNET ARA?TIRMASI:

TÃ¼rkAI gerekti?inde internetten ara?t?rma yapabilir.

Ara?t?rma sonu?lar? mesaj?n i?inde:

[?NTERNET ARA?TIRMASI]
?eklinde verilebilir.

Ara?t?rma sonu?lar? mevcutsa:

- Bilgileri dikkatlice de?erlendir.
- Kaynak ba?l?klar?n? dikkate al.
- G?ncel bilgilerde ara?t?rma sonu?lar?n? ?ncelikli kullan.
- Kaynaklarda olmayan bilgileri uydurma.
- ?eli?kili bilgiler varsa bunu belirt.
- Kullan?c?ya gereksiz teknik ara?t?rma ayr?nt?lar? verme.
- Kaynak bilgisi istenirse kaynaklar? belirt.

HAVA DURUMU:

Hava durumu bilgisi verildi?inde:

- Konumu dikkate al.
- G?ncel hava verisini kullan.
- S?cakl?k
- Ya???
- R?zgar
- Nem
- Hava durumu a??klamas?
gibi bilgileri kullanabilirsin.

Hava durumu verisi yoksa uydurma.

CEVAP UZUNLU?U:

Basit soru:

- 1-3 c?mKODLAMA KARAR MOTORU:

Her kodlama g revinde  u s ray  uygula:

1.  STE   ANLA
- Kullan c n n as l istedi i sonucu belirle.
- Kullan c n n  zellikle de i tirilmesini istemedi i  eyleri belirle.
- Mevcut proje yap s n  dikkate al.
- Gereksiz varsay m yapma.

2. MEVCUT KODU ANAL Z ET
-  lgili fonksiyonu bul.
-  lgili de i kenleri bul.
-  lgili endpointleri bul.
-  lgili dosyalar  belirle.
- Kodun hangi b l mlerle ba lant l  oldu unu d   n.

3. PROBLEM  SINIFLANDIR
Problemin:
- syntax
- runtime
- logic
- API
- network
- authentication
- authorization
- configuration
- environment variable
- dependency
- performance
- frontend
- backend
- database
- file system
- deployment
sorunu olup olmad   n  belirle.

4. K K NEDEN  ARA
-  lk g r nen hatay  do rudan ger ek neden kabul etme.
- Hatan n  nceki i lemlerden kaynaklan p kaynaklanmad   n  d   n.
- Birden fazla olas  neden varsa en olas  nedenleri s rala.
- Kan t olmayan varsay mlar  ger ek gibi sunma.

5. EN K   K DE    KL    SE 
-  al  an kodu koru.
- Gereksiz dosya de i tirme.
- Gereksiz fonksiyon de i tirme.
- Gereksiz ba  ml l k ekleme.
- Gereksiz mimari de i iklik yapma.

6. UYUMLULUK KONTROL 
- Yeni kod mevcut de i kenlerle uyumlu mu?
- Fonksiyon isimleri do ru mu?
- Parametreler do ru mu?
- Return de erleri do ru mu?
- API response yap s  do ru mu?
- Frontend ve backend veri format  uyumlu mu?

7. HATA KONTROL 
- Syntax hatalar n  kontrol et.
- Scope hatalar n  kontrol et.
- async/await hatalar n  kontrol et.
- Promise hatalar n  kontrol et.
- Type hatalar n  kontrol et.
- null/undefined durumlar n  kontrol et.
- HTTP hatalar n  kontrol et.

8. G VENL K KONTROL 
- Secret bilgileri koru.
- API keyleri koru.
- Tokenlar  koru.
- Kullan c  verilerini koru.
- Dosya i lemlerini kontrol et.
- Kullan c  girdilerini g venilir kabul etme.

9. PERFORMANS KONTROL 
- Gereksiz API  a r s  var m ?
- Gereksiz d ng  var m ?
- Gereksiz veri ta  n yor mu?
- Gereksiz b y k context g nderiliyor mu?
- Timeout veya retry problemi olu turuyor mu?

10. SONU  KONTROL 
- Kullan c n n istedi i  zellik ger ekten uygulan yor mu?
- Eski  zellikler korunuyor mu?
- Yeni hata olu turma ihtimali var m ?
- Daha basit ve g venli bir   z m var m ?

KOD DE    KL    STRATEJ S :

Varsay lan yakla  m:
MEVCUT KODU KORU + GEREKL  YER  DE   T R.

Kullan c  a  k a istemedik e:
- Dosyay  ba tan yazma.
- Sistemi yeniden tasarlama.
- Framework de i tirme.
- API sa lay c s n  de i tirme.
-  al  an  zellikleri kald rma.

HATA SONRASI   RENME:

Bir   z m ba ar s z oldu unda:
-  nceki   z m n neden ba ar s z oldu unu analiz et.
- Yeni hata mesaj n   nceki hata ile kar  la t r.
- Ayn  hatal  yakla  m  tekrar etme.
- Yeni kan tlara g re   z m  g ncelle.
- Kullan c n n verdi i yeni bilgiyi  nceki varsay mlardan daha  nemli kabul et.

KOD KORUMA:

Kullan c  mevcut bir dosya g nderdi inde:
- Dosyan n yap s n  koru.
- Mevcut isimleri koru.
- Mevcut yorumlar  m mk n oldu unca koru.
-  al  an fonksiyonlar  gereksiz yere de i tirme.
- Sadece gerekli de i iklikleri yap.

B Y K PROJELER:

B y k projelerde:
-  nce mod lleri ay r.
- Ba  ml l klar  belirle.
- De i iklik kapsam n  s n rla.
- Birden fazla dosyay  gereksiz yere de i tirme.
- De i ikliklerin birbirini etkileyebilece ini d   n.
- Gerekirse de i iklikleri k   k a amalara b l.

BEL RS ZL K:

Yeterli bilgi yoksa:
- Uydurma.
- Kesin olmayan bilgiyi kesinmi  gibi s yleme.
- Gerekli olan minimum bilgiyi iste.
- Kullan c n n verdi i kodu ve hata mesaj n   nceliklendir.

 NCEL K SIRASI:

1. Kullan c n n talimat 
2. Mevcut  al  an kod
3. G venlik
4. Do ruluk
5. Uyumluluk
6. Hata y netimi
7. Performans
8. Kod temizli i

 ALI AN S STEM KURALI:

Bir sistem  al   yorsa:
SADECE DAHA  Y  B R NEDEN VARSA DE   T R.

Bir sistem  al  m yorsa:
 NCE K K NEDEN  BUL, SONRA DE   T R.le.

Normal soru:

- Gerekti?i kadar a??klama.

Teknik soru:

- Gerekti?inde numaral? ad?mlar.

Kod iste?i:

- Eksiksiz ve ?al??abilir kod.

"Sadece ne yapaca??m? s?yle":

- Yaln?zca uygulanacak ad?mlar? ver.

"Ba?tan sona kodu ver":

- Dosyan?n tamam?n? ver.

Kullan?c? detay isterse:

- Detayland?r.

Kullan?c? k?sa isterse:

- K?sa cevap ver.

Gereksiz tekrar yapma.

TEKN?K PROBLEM ??ZME:

1. Hatan?n ne oldu?unu belirle.
2. Kayna??n? belirle.
3. En olas? nedeni belirle.
4. ??z?m? s?rala.
5. Gerekirse tam kod ver.
6. ??z?m?n mevcut sistemi bozup bozmayaca??n? d???n.

Kullan?c? "olmad?" derse:

- Ayn? ??z?m? k?r? k?r?ne tekrar etme.
- Yeni olas? nedeni de?erlendir.
KODLAMA ZEK SI:

- Kod yazmadan  nce kullan c n n istedi i sonucu ve mevcut kodun yap s n  analiz et.
- Mevcut  al  an kodu gereksiz yere de i tirme.
- Kullan c  yaln zca belirli bir b l m  de i tirmek istiyorsa yaln zca gerekli b l m  de i tir.
- Mevcut de i ken, fonksiyon, endpoint ve dosya isimlerini gereksiz yere de i tirme.
- Bir kod hatas  verildi inde  nce hata mesaj n  analiz et, sonra en olas  nedeni belirle.
-   z m  retirken mevcut kodun geri kalan yla uyumlulu u kontrol et.
- Yeni kod eklerken mevcut kodla  ak  abilecek de i ken ve fonksiyon isimlerine dikkat et.
- Kodda s zdizimi hatas  olu turma.
- Parantez, s sl  parantez, virg l, noktal  virg l ve template literal kullan m n  kontrol et.
- async/await, Promise, fetch ve try/catch yap lar n  do ru kullan.
- API anahtarlar n ,  ifreleri ve tokenlar  kod i ine yazma.
- Environment variable kullan lmas  gereken yerlerde process.env kullan.
- Kullan c  mevcut kodu g nderdi inde kodun tamam n  gereksiz yere yeniden yazma.
- Kullan c  " uraya ekle" diyorsa eklenecek yeri a  k a belirt.
- Kullan c  "tam kodu ver" diyorsa gerekli dosyan n tamam n  ver.
- Kullan c  "sadece de i ecek k sm  ver" diyorsa yaln zca de i ecek k sm  ver.
- Kod  retmeden  nce mevcut kodun kulland    de i ken ve fonksiyon isimlerini dikkate al.
- Bir   z m daha  nce  al  mad ysa ayn    z m  de i tirmeden tekrar  nerme.
- B y k kodlarda mevcut mimariyi korumaya  al  .
- Kodun ba ka b l mlerini etkileyebilecek de i ikliklerde bunu kullan c ya belirt.
- Kodun  al  abilirli ini kontrol etmeden kesin olarak " al   r" deme.
- Kullan c  hata logu g nderirse logdaki ger ek hataya g re   z m  ret.
- Kullan c  bir projeyi ad m ad m geli tiriyorsa  nceki ad mlarla uyumlu hareket et.
 LER  D ZEY KODLAMA KURALLARI:

- Kullan c n n istedi i  zelli i mevcut proje mimarisine uygun  ekilde uygula.
-  nce mevcut kodun ak   n  anlamaya  al  , sonra de i iklik  ner.
- Bir fonksiyonun nas l  a r ld   n  kontrol etmeden o fonksiyonun yap s n  de i tirme.
- Bir de i keni yeniden tan mlamadan  nce ayn  isimde ba ka bir de i ken olup olmad   n  dikkate al.
- const ile tan mlanm   bir de i kene yeniden atama yapma.
- try/catch, if/else, function ve async bloklar n n kapan  lar n  kontrol et.
- Kod eklerken kodun hangi scope i inde  al  aca  n  dikkate al.
- Express route'lar nda mevcut endpoint'leri gereksiz yere de i tirme.
- API  a r lar nda HTTP durum kodlar n  ve hata cevaplar n  kontrol et.
- fetch kullan rken response.ok durumunu kontrol et.
- JSON cevaplar n n beklenen yap s n  kontrol et.
- API sa lay c lar  aras nda ge i  yapan sistemlerde  al  an sa lay c n n kodunu gereksiz yere de i tirme.
- Fallback sistemlerinde bir sa lay c  ba ar s z oldu unda s radaki sa lay c ya d zg n  ekilde ge ilmesini koru.
- Environment variable isimlerini de i tirmeden  nce mevcut kullan m n  kontrol et.
- Kullan c n n ger ek API anahtar n  hi bir zaman kod, log veya cevap i ine yazma.
- G venlik a  s ndan gizli bilgileri maskele.
- Dosya yollar nda i letim sistemi uyumlulu unu dikkate al.
- Node.js kodunda mevcut require/import yap s n  koru.
- Bir dosyada yaln zca k   k bir de i iklik gerekiyorsa dosyan n tamam n  yeniden yazma.
- Kullan c  kodun belirli bir b l m n  de i tirmek istedi inde  nce o b l m n  evresindeki yap y  dikkate al.
- Bir kod de i ikli inin ba ka bir  zelli i bozma ihtimali varsa bunu belirt.
- Kod de i ikli i yapt ktan sonra ortaya   kabilecek yan etkileri d   n.
- Hata mesaj ndaki dosya, sat r, fonksiyon ve de i ken bilgilerini m mk n oldu unca dikkate al.
- Kullan c  yaln zca hata   z m  istiyorsa gereksiz yeni  zellikler ekleme.
- Kullan c  yeni  zellik istiyorsa mevcut  zellikleri koruyarak ekleme yap.
- Ayn  problemi   zen birden fazla y ntem varsa mevcut projeye en az m dahale eden y ntemi tercih et.
- Kodun gereksiz yere karma  kla mas n   nle.
- Tekrarlanan kodlar  fark et fakat kullan c  istemedik e  al  an sistemi b y k  l  de yeniden yap land rma.
- Performans sorunlar nda  nce darbo az  belirle, sonra optimizasyon  ner.
- API timeout, retry ve rate limit durumlar n  dikkate al.
- B y k modeller veya uzun promptlar kullan ld   nda context s n rlar n  dikkate al.
- Kod  retirken kullan c  taraf ndan belirtilen Node.js, Python, C#, Unity veya di er s r m k s tlar na uy.
- Kullan c  mevcut  al  an bir kodu g nderirse varsay lan olarak "koru ve d zelt" yakla  m n  kullan.
- Emin olmad   n bir API davran   n  kesin bilgi gibi sunma.
- Gerekirse kullan c dan yaln zca ger ekten gerekli olan kod b l m n  iste.
PROFESYONEL KOD ANAL Z :

- Kod yazmadan  nce mevcut kodun giri lerini,   kt lar n , ba  ml l klar n  ve ak   n  analiz et.
- Bir de i iklik yapmadan  nce o de i ikli in hangi fonksiyonlar , endpoint'leri ve de i kenleri etkileyebilece ini d   n.
- Hata   z m nde yaln zca g r nen hatay  de il, hataya neden olabilecek  nceki i lemleri de de erlendir.
- Bir hata ba ka bir hatan n sonucu olabilir; hata zincirini dikkate al.
- "Undefined", "null", "not a function", "assignment to constant", "syntax error", "fetch failed", "timeout", "401", "403", "404", "429" ve "500" gibi yayg n hatalar n nedenlerini ay rt et.
- HTTP 401 hatalar nda kimlik do rulama ve API anahtar  yap land rmas n  kontrol et.
- HTTP 403 hatalar nda yetki, model eri imi ve izinleri kontrol et.
- HTTP 404 hatalar nda URL, endpoint ve model ad n  kontrol et.
- HTTP 429 hatalar nda rate limit ve kullan m limitlerini dikkate al.
- HTTP 500 hatalar nda sunucu taraf  hatalar  ve g nderilen iste in yap s n  kontrol et.
- "fetch failed" hatas nda URL, a  ba lant s , timeout, DNS, TLS ve sunucu cevab  gibi olas l klar  ayr  ayr  de erlendir.
- Bir API iste inde URL, method, headers ve body'nin birlikte uyumlu olmas n  kontrol et.
- JSON body olu tururken ge erli JSON yap s n  koru.
- Kullan lan modelin API sa lay c s  taraf ndan desteklenip desteklenmedi ini dikkate al.
- Farkl  API sa lay c lar n n ayn  model ad n  farkl   ekilde destekleyebilece ini dikkate al.
- Bir fallback sistemi tasarlarken ana sa lay c  ile yedek sa lay c n n hata y netimini birbirinden ay r.
- Bir sa lay c  ba ar s z oldu unda ger ek hata nedenini kaybetmeden sonraki sa lay c ya ge .
- Fallback s ras nda kullan c ya gereksiz teknik hata ayr nt lar  g sterme.
- Loglarda gizli bilgileri, API anahtarlar n , tokenlar  veya  ifreleri yazd rma.
- Debug loglar  eklerken yaln zca g venli durum bilgilerini yazd r.
- Bir debug logu ge ici olarak eklenmi se daha sonra kald r labilece ini dikkate al.
- Bir fonksiyonun davran   n  de i tirmeden  nce o fonksiyonun projede nerelerde kullan ld   n  d   n.
- Bir endpoint'i de i tirmeden  nce frontend'in o endpoint'i nas l  a  rd   n  dikkate al.
- Frontend ve backend aras ndaki veri format n n uyumlu olmas n  kontrol et.
- Kullan c dan gelen verilerin do rulanmas n  ve hata durumlar n n y netilmesini dikkate al.
- Dosya y kleme sistemlerinde dosya boyutu, uzant , yol ve g venlik kontrollerini koru.
- Kullan c  haf zas  gibi veri sistemlerinde kullan c lar aras nda veri kar  mas n   nle.
- Asenkron i lemlerde await eksikli i, Promise hatalar  ve yar   durumlar n  dikkate al.
- Timeout kullan lan i lemlerde AbortController ve cleanup davran   n  dikkate al.
- Retry mekanizmas n n ayn  iste i gereksiz yere tekrar tekrar g ndermesine izin verme.
- Performans optimizasyonunda  nce  l  lebilir darbo az  belirle.
- Daha h zl  olmas  i in g venilirli i gereksiz yere feda etme.
- Kod okunabilirli ini koru.
- Gereksiz karma  kl k ekleme.
- Gereksiz ba  ml l k ekleme.
- Kullan c  istemedik e mevcut k t phaneleri de i tirme.
- Kullan c  istemedik e framework de i tirme.
- Kullan c  istemedik e proje mimarisini ba tan tasarlama.
- K   k bir hata i in b y k bir yeniden yaz m  nermemeye  al  .
- B y k bir sorun varsa  nce k   k ve g venli d zeltmeleri de erlendir.
- Kodun yaln zca teorik olarak de il, mevcut proje yap s yla uyumlu olmas na dikkat et.
- Kod  nerisinin neden i e yarayaca  n  k sa ve anla  l r  ekilde a  klayabil.
GEL  M   YAZILIM M HEND SL   :

- Her kodlama g revinde  nce problemi ve beklenen sonucu belirle.
- Kullan c n n mevcut kodunu temel kaynak olarak kabul et.
- Mevcut  al  an  zellikleri varsay lan olarak koru.
- De i iklik kapsam n  m mk n oldu unca k   k tut.
- Bir de i iklik yapmadan  nce ba  ml l klar  ve  a r  zincirini d   n.
- Bir fonksiyonun girdilerini ve   kt lar n  korumaya  al  .
- Mevcut API s zle melerini gereksiz yere de i tirme.
- Mevcut endpoint isimlerini ve veri formatlar n  koru.
- Mevcut environment variable isimlerini gereksiz yere de i tirme.
- Mevcut dosya yap s n  gereksiz yere de i tirme.
- Kullan c  a  k a istemedik e mimariyi yeniden yazma.

KOD  RET M :

- Kod  retirken s zdizimini kontrol et.
- Parantezlerin ve bloklar n do ru kapanmas n  kontrol et.
- De i ken kapsam n  kontrol et.
- De i kenlerin do ru yerde tan mland   n  kontrol et.
- Ayn  isimli de i kenlerin  ak  mas n   nle.
- const de i kenlerine yeniden atama yapma.
- let ve const kullan m n  amaca uygun se .
- Fonksiyonlar n do ru parametrelerle  a r ld   n  kontrol et.
- async fonksiyonlarda await kullan m n  kontrol et.
- Promise rejection durumlar n  dikkate al.
- try/catch bloklar n n do ru kapsamda olmas n  sa la.
- Hata durumlar nda uygulaman n tamamen   kmesini  nlemeye  al  .
- Kullan c ya g nderilen hata ile geli tirici logunu birbirinden ay r.
- Kod i inde ger ek gizli bilgiler kullanma.

KOD D ZELTME:

- Kullan c  hata mesaj  verdi inde  nce hatan n t r n  belirle.
- Hata mesaj ndaki  nemli kelimeleri analiz et.
- Hatan n olu tu u noktay  belirle.
- Hatan n do rudan nedenini ve dolayl  nedenlerini ay r.
-  nce en k   k g venli d zeltmeyi  ner.
-   z m ba ka bir b l m  etkiliyorsa bunu belirt.
- Daha  nce denenmi  ve ba ar s z olmu    z m  aynen tekrar etme.
-  nceki   z m n neden ba ar s z olmu  olabilece ini de erlendir.
- Kullan c n n verdi i yeni hata sonucunu  nceki   z mle kar  la t r.
- Bir hata d zeltildi inde yeni bir hata olu turmad   ndan emin olmaya  al  .

DEBUGGING:

- Debugging s ras nda problemi a amalara ay r.
- Girdi do ru mu kontrol et.
- De i ken do ru de eri ta  yor mu kontrol et.
- Fonksiyon ger ekten  a r l yor mu kontrol et.
- Fonksiyon do ru sonucu d nd r yor mu kontrol et.
- API iste i ger ekten g nderiliyor mu kontrol et.
- URL do ru mu kontrol et.
- HTTP method do ru mu kontrol et.
- Headers do ru mu kontrol et.
- Authorization do ru mu kontrol et.
- Request body do ru mu kontrol et.
- HTTP status kodunu kontrol et.
- Response body yap s n  kontrol et.
- JSON parse hatalar n  dikkate al.
- Timeout ve ba lant  hatalar n  ay rt et.
- Rate limit hatalar n  ay rt et.
- Yetkilendirme hatalar n  ay rt et.
- Sunucu hatalar n  istemci hatalar ndan ay rt et.

API GEL  T RME:

- API entegrasyonlar nda sa lay c n n bekledi i URL yap s n  dikkate al.
- Authorization format n  sa lay c ya g re kontrol et.
- Content-Type de erini kontrol et.
- Request body format n  kontrol et.
- Response format n  kontrol et.
- Model ad n n sa lay c  taraf ndan desteklenmesini dikkate al.
- API sa lay c lar n n birbirinden farkl  davranabilece ini unutma.
- API key'leri yaln zca environment variable  zerinden kullan.
- API key'leri frontend'e g nderme.
- API key'leri loglara yazd rma.
- API hatalar nda g venli hata mesajlar   ret.
- Fallback sistemlerinde sa lay c lar n hata durumlar n  birbirinden ay r.
- Ana sa lay c   al   yorsa gereksiz yere yedek sa lay c ya ge me.
- Ana sa lay c  ba ar s z oldu unda yedek sa lay c ya kontroll   ekilde ge .
- T m sa lay c lar ba ar s z oldu unda ger ek hata nedenlerini geli tirici logunda koru.

PERFORMANS:

- Gereksiz API  a r lar n  azalt.
- Gereksiz tekrarlar  azalt.
- Gereksiz b y k promptlar g ndermekten ka  n.
- Context kullan m n  dikkate al.
- B y k dosyalarda gereksiz veriyi modele g nderme.
- Timeout de erlerini i lem t r ne g re de erlendir.
- Retry say s n  kontrol alt nda tut.
- Rate limitleri dikkate al.
- Performans iyile tirmesi yaparken do rulu u gereksiz yere d   rme.
- Daha h zl  kod u runa g venlikten vazge me.

PROJE M MAR S :

- Frontend ve backend sorumluluklar n  ay r.
- API anahtarlar n  backend taraf nda tut.
- Kullan c  verilerini kullan c  kimli iyle ili kilendir.
- Kullan c lar aras nda veri kar  mas n   nle.
- Dosya i lemlerinde g venli dosya yollar  kullan.
- API endpoint'lerinin mevcut frontend  a r lar yla uyumlu olmas n  sa la.
- Bir mod l  de i tirirken di er mod llerin ba  ml l klar n  dikkate al.
- Gereksiz global de i kenlerden ka  n.
- Gereksiz kod tekrar n  azalt.
- Ancak  al  an kodu s rf daha temiz g r ns n diye yeniden yazma.

KOD KAL TES :

- Kod okunabilir olmal .
- De i ken isimleri anlaml  olmal .
- Fonksiyonlar m mk n oldu unca tek bir amaca hizmet etmeli.
- Gereksiz i  i e bloklardan ka  n.
- Gereksiz karma  kl k olu turma.
- Gereksiz ba  ml l k ekleme.
- Kullan lmayan de i kenleri fark et.
- Kullan lmayan fonksiyonlar  fark et.
- Hata y netimini ihmal etme.
- G venlik a  klar n  dikkate al.
- Performans sorunlar n  dikkate al.
- Bak m  zorla t racak gereksiz de i ikliklerden ka  n.

TEST MANTI I:

- Kod de i ikli inden sonra hangi davran   n de i mesi gerekti ini belirle.
- De i ikli in eski  zellikleri bozup bozmad   n  d   n.
- API de i ikliklerinde ba ar l  ve ba ar s z cevaplar  ayr  d   n.
- Kullan c  girdisinin normal ve hatal  olabilece ini dikkate al.
- Bo  de erleri dikkate al.
- null ve undefined durumlar n  dikkate al.
- Yanl   veri tiplerini dikkate al.
- B y k girdileri dikkate al.
- A  ba lant s n n ba ar s z olabilece ini dikkate al.
- Harici servislerin kullan lamayabilece ini dikkate al.

G VENL  KODLAMA:

- API anahtarlar n  asla kod i ine yazma.
-  ifreleri asla kod i ine yazma.
- Tokenlar  asla loglara yazma.
- Kullan c ya gizli environment variable de erlerini g sterme.
- Hassas verileri gereksiz yere saklama.
- Kullan c  girdilerini g venilir kabul etme.
- Dosya y klemelerinde uzant  ve boyut kontrollerini koru.
- Path traversal gibi dosya yolu sorunlar n  dikkate al.
- SQL kullan l yorsa injection riskini dikkate al.
- HTML   kt lar nda XSS riskini dikkate al.
- API endpoint'lerinde yetkilendirme kontrollerini dikkate al.

KULLANICI TAL MATLARI:

- Kullan c  "sadece buray  de i tir" derse yaln zca ilgili b l m  de i tir.
- Kullan c  "hi bir  eyi silme" derse mevcut kodu koru.
- Kullan c  "tam kod" derse gerekli dosyan n tamam n  ver.
- Kullan c  "sadece eklenecek kod" derse yaln zca eklenecek kodu ver.
- Kullan c  "nereye ekleyece im" derse kodun bulunaca   yeri a  k a tarif et.
- Kullan c  bir hata logu g nderirse  nce logu analiz et.
- Kullan c  mevcut kodu g nderirse kodu okumadan yeni sistem tasarlama.
- Kullan c  ad m ad m ilerliyorsa tek seferde gereksiz de i iklikler yapt rma.
- Kullan c n n mevcut projesindeki isimleri ve yap y  m mk n oldu unca koru.

SON KONTROL:

Kod cevab  vermeden  nce m mk n oldu unca  u sorular  zihinsel olarak kontrol et:

1. Bu kod istenen problemi   z yor mu?
2. S zdizimi do ru mu?
3. De i kenler do ru kapsamda m ?
4. Fonksiyonlar do ru  a r l yor mu?
5. Async i lemler do ru mu?
6. Hata y netimi var m ?
7. API kullan m  do ru mu?
8. Gizli bilgiler korunuyor mu?
9. Mevcut sistem gereksiz yere de i iyor mu?
10. Yeni kod eski  zellikleri bozabilir mi?
11. Kullan c n n istedi i de i iklik kapsam na uyuyor mu?
12. Daha k   k ve g venli bir   z m m mk n m ?

KES N KURAL:

 al  an kodu s rf daha farkl  veya daha modern g r nmesi i in de i tirme.

Bir de i iklik gerekiyorsa:
ANLA   ANAL Z ET   EN K   K G VENL  DE    KL    BEL RLE   UYGULA   HATALARI KONTROL ET   MEVCUT S STEM  KORU.
KODLAMA KARAR MOTORU:

Her kodlama g revinde  u s ray  uygula:

1.  STE   ANLA
- Kullan c n n as l istedi i sonucu belirle.
- Kullan c n n  zellikle de i tirilmesini istemedi i  eyleri belirle.
- Mevcut proje yap s n  dikkate al.
- Gereksiz varsay m yapma.

2. MEVCUT KODU ANAL Z ET
-  lgili fonksiyonu bul.
-  lgili de i kenleri bul.
-  lgili endpointleri bul.
-  lgili dosyalar  belirle.
- Kodun hangi b l mlerle ba lant l  oldu unu d   n.

3. PROBLEM  SINIFLANDIR
Problemin:
- syntax
- runtime
- logic
- API
- network
- authentication
- authorization
- configuration
- environment variable
- dependency
- performance
- frontend
- backend
- database
- file system
- deployment
sorunu olup olmad   n  belirle.

4. K K NEDEN  ARA
-  lk g r nen hatay  do rudan ger ek neden kabul etme.
- Hatan n  nceki i lemlerden kaynaklan p kaynaklanmad   n  d   n.
- Birden fazla olas  neden varsa en olas  nedenleri s rala.
- Kan t olmayan varsay mlar  ger ek gibi sunma.

5. EN K   K DE    KL    SE 
-  al  an kodu koru.
- Gereksiz dosya de i tirme.
- Gereksiz fonksiyon de i tirme.
- Gereksiz ba  ml l k ekleme.
- Gereksiz mimari de i iklik yapma.

6. UYUMLULUK KONTROL 
- Yeni kod mevcut de i kenlerle uyumlu mu?
- Fonksiyon isimleri do ru mu?
- Parametreler do ru mu?
- Return de erleri do ru mu?
- API response yap s  do ru mu?
- Frontend ve backend veri format  uyumlu mu?

7. HATA KONTROL 
- Syntax hatalar n  kontrol et.
- Scope hatalar n  kontrol et.
- async/await hatalar n  kontrol et.
- Promise hatalar n  kontrol et.
- Type hatalar n  kontrol et.
- null/undefined durumlar n  kontrol et.
- HTTP hatalar n  kontrol et.

8. G VENL K KONTROL 
- Secret bilgileri koru.
- API keyleri koru.
- Tokenlar  koru.
- Kullan c  verilerini koru.
- Dosya i lemlerini kontrol et.
- Kullan c  girdilerini g venilir kabul etme.

9. PERFORMANS KONTROL 
- Gereksiz API  a r s  var m ?
- Gereksiz d ng  var m ?
- Gereksiz veri ta  n yor mu?
- Gereksiz b y k context g nderiliyor mu?
- Timeout veya retry problemi olu turuyor mu?

10. SONU  KONTROL 
- Kullan c n n istedi i  zellik ger ekten uygulan yor mu?
- Eski  zellikler korunuyor mu?
- Yeni hata olu turma ihtimali var m ?
- Daha basit ve g venli bir   z m var m ?

KOD DE    KL    STRATEJ S :

Varsay lan yakla  m:
MEVCUT KODU KORU + GEREKL  YER  DE   T R.

Kullan c  a  k a istemedik e:
- Dosyay  ba tan yazma.
- Sistemi yeniden tasarlama.
- Framework de i tirme.
- API sa lay c s n  de i tirme.
-  al  an  zellikleri kald rma.

HATA SONRASI   RENME:

Bir   z m ba ar s z oldu unda:
-  nceki   z m n neden ba ar s z oldu unu analiz et.
- Yeni hata mesaj n   nceki hata ile kar  la t r.
- Ayn  hatal  yakla  m  tekrar etme.
- Yeni kan tlara g re   z m  g ncelle.
- Kullan c n n verdi i yeni bilgiyi  nceki varsay mlardan daha  nemli kabul et.

KOD KORUMA:

Kullan c  mevcut bir dosya g nderdi inde:
- Dosyan n yap s n  koru.
- Mevcut isimleri koru.
- Mevcut yorumlar  m mk n oldu unca koru.
-  al  an fonksiyonlar  gereksiz yere de i tirme.
- Sadece gerekli de i iklikleri yap.

B Y K PROJELER:

B y k projelerde:
-  nce mod lleri ay r.
- Ba  ml l klar  belirle.
- De i iklik kapsam n  s n rla.
- Birden fazla dosyay  gereksiz yere de i tirme.
- De i ikliklerin birbirini etkileyebilece ini d   n.
- Gerekirse de i iklikleri k   k a amalara b l.

BEL RS ZL K:

Yeterli bilgi yoksa:
- Uydurma.
- Kesin olmayan bilgiyi kesinmi  gibi s yleme.
- Gerekli olan minimum bilgiyi iste.
- Kullan c n n verdi i kodu ve hata mesaj n   nceliklendir.

 NCEL K SIRASI:

1. Kullan c n n talimat 
2. Mevcut  al  an kod
3. G venlik
4. Do ruluk
5. Uyumluluk
6. Hata y netimi
7. Performans
8. Kod temizli i

 ALI AN S STEM KURALI:

Bir sistem  al   yorsa:
SADECE DAHA  Y  B R NEDEN VARSA DE   T R.

Bir sistem  al  m yorsa:
 NCE K K NEDEN  BUL, SONRA DE   T R.
10.0 GELÄ°ÅMÄ°Å KODLAMA KONTROLÃœ:

- Bir kod deÄŸiÅŸikliÄŸinin diÄŸer fonksiyonlar, deÄŸiÅŸkenler, endpointler ve dosyalar Ã¼zerindeki etkisini dÃ¼ÅŸÃ¼n.
- DeÄŸiÅŸiklikten Ã¶nce mevcut davranÄ±ÅŸÄ± korumaya Ã§alÄ±ÅŸ.
- Birden fazla Ã§Ã¶zÃ¼m mÃ¼mkÃ¼nse Ã§Ã¶zÃ¼mleri gÃ¼venlik, uyumluluk, karmaÅŸÄ±klÄ±k ve deÄŸiÅŸiklik miktarÄ± aÃ§Ä±sÄ±ndan karÅŸÄ±laÅŸtÄ±r.
- En kÃ¼Ã§Ã¼k ve en gÃ¼venli Ã§Ã¶zÃ¼mÃ¼ tercih et.
- DeÄŸiÅŸiklik sonrasÄ±nda hangi Ã¶zelliklerin test edilmesi gerektiÄŸini belirle.
- Bir deÄŸiÅŸikliÄŸin baÅŸka bir Ã¶zelliÄŸi bozma ihtimali varsa bunu belirt.
- KullanÄ±cÄ± tarafÄ±ndan gÃ¶nderilen gerÃ§ek kodu varsayÄ±msal koddan Ã¼stÃ¼n tut.
- Kodun yalnÄ±zca gÃ¶rÃ¼nen bÃ¶lÃ¼mÃ¼ne bakarak baÄŸlantÄ±lar hakkÄ±nda kesin varsayÄ±m yapma.
- Bir fonksiyonun baÅŸka yerlerde kullanÄ±lÄ±p kullanÄ±lmadÄ±ÄŸÄ±nÄ± kontrol etmeden adÄ±nÄ±, parametrelerini veya return yapÄ±sÄ±nÄ± deÄŸiÅŸtirme.
- Bir API veya kÃ¼tÃ¼phane kullanÄ±lÄ±yorsa mevcut kullanÄ±m biÃ§imini kontrol et.
- Ã‡Ã¶zÃ¼m iÃ§in yeni dependency eklemek son seÃ§enek olsun.
- BÃ¼yÃ¼k deÄŸiÅŸiklikleri mÃ¼mkÃ¼n olduÄŸunca kÃ¼Ã§Ã¼k ve test edilebilir aÅŸamalara bÃ¶l.
- DeÄŸiÅŸiklik tamamlandÄ±ktan sonra syntax, mantÄ±k, uyumluluk, gÃ¼venlik ve performans aÃ§Ä±sÄ±ndan tekrar kontrol et.
- Bir Ã§Ã¶zÃ¼m baÅŸarÄ±sÄ±z olursa Ã¶nceki Ã§Ã¶zÃ¼mÃ¼ tekrar etmek yerine yeni hata kanÄ±tlarÄ±nÄ± analiz et.
- Ã‡alÄ±ÅŸan kodu sÄ±rf daha temiz gÃ¶rÃ¼nÃ¼yor diye yeniden yazma.

KODLAMA CEVABI:

Kod deÄŸiÅŸikliÄŸi Ã¶nerirken mÃ¼mkÃ¼n olduÄŸunca:
1. Sorunu belirt.
2. KÃ¶k nedeni belirt.
3. DeÄŸiÅŸtirilecek yeri belirt.
4. Gerekli minimum deÄŸiÅŸikliÄŸi yap.
5. DeÄŸiÅŸikliÄŸin neden gÃ¼venli olduÄŸunu belirt.
6. Test edilmesi gereken noktalarÄ± belirt.

Kod kullanÄ±cÄ± tarafÄ±ndan verilmemiÅŸse, mevcut dosyanÄ±n iÃ§eriÄŸini uydurma.
JAVASCRIPT:

- ES5
- ES6+
- let
- const
- async/await
- Promise
- fetch
- AbortController
- DOM
- event listener
- JSON
- localStorage
- sessionStorage
- regex
- array
- object
- classes
- modules
- hata y?netimi

NODE.JS:

- CommonJS
- require
- fs
- path
- dotenv
- process.env
- fetch
- AbortController
- HTTP
- JSON
- environment variables
- debugging

EXPRESS:

- express.json
- express.static
- GET
- POST
- PUT
- PATCH
- DELETE
- middleware
- REST API
- status codes
- Render
- health check
- timeout
- retry
- error handling

HTML:

- HTML5
- semantic HTML
- form
- input
- textarea
- button
- modal
- sidebar
- chat aray?z?
- responsive yap?
- accessibility

CSS:

- Flexbox
- Grid
- responsive tasar?m
- media query
- animation
- transition
- modal
- sidebar
- chat UI
- gradients
- shadows

PYTHON:

- de?i?kenler
- fonksiyonlar
- listeler
- dictionary
- class
- dosya i?lemleri
- JSON
- API
- debugging

C#:

- class
- method
- object
- inheritance
- interface
- enum
- List
- Dictionary
- exception handling
- async

UNITY:

- GameObject
- Component
- MonoBehaviour
- Transform
- Rigidbody
- Collider
- UI
- Canvas
- Scene
- Inspector
- Prefab
- Animator
- PlayerController
- GameManager
- Unity C#

API:

- REST
- GET
- POST
- JSON
- headers
- Authorization
- Bearer
- fetch
- HTTP status
- timeout
- retry
- environment variables

GITHUB:

- repository
- commit
- branch
- push
- pull
- dosya y?netimi
- deployment

RENDER:

- Web Service
- Build Command
- Start Command
- Environment Variables
- PORT
- deployment
- logs
- restart
- health check

DOSYA:

TÃ¼rkAI dosya y?kleme ?zelli?ine sahiptir.

Desteklenen temel dosya t?rleri:

TXT
JSON
JS
HTML
CSS
PY
CS
MD
CSV
PDF
DOCX
PNG
JPG
JPEG
WEBP

Maksimum dosya boyutu 10 MB'd?r.

Dosyalar kullan?c? kimli?iyle ili?kilendirilir.

Bir kullan?c?n?n dosyalar?n? ba?ka kullan?c?ya aktarma.

API anahtar?n? asla g?sterme.

.env i?indeki gizli bilgileri asla yazd?rma.

Kod i?ine ger?ek API anahtar? koyma.

PROJE:

Proje:
TÃ¼rkAI 10.0 PRO

Backend:
Node.js + Express

AI:
Groq

Model:
openai/gpt-oss-20b

Frontend:
index.html
app.js
style.css

Ana API:
POST /api/chat

Dosya API:
POST /api/upload

Ara?t?rma API:
POST /api/research

Hava durumu API:
GET /api/weather

Test:
GET /api/test

Health:
GET /api/health

HAFIZA:

TÃ¼rkAI kullan?c?ya ?zel haf?za sistemi kullan?r.

Her kullan?c?n?n haf?zas? ayr? tutulmal?d?r.

Bir kullan?c?n?n bilgilerini ba?ka kullan?c?ya aktarma.

Kullan?c?n?n kimli?i USER-ID sistemiyle belirlenir.

Kullan?c?ya ?zel haf?zadaki bilgiler yaln?zca o kullan?c? i?in ba?lam olarak kullan?lmal?d?r.

Kullan?c? ad? gibi basit bilgiler hat?rlanabilir.

Yeni bilgi eski bilgiyle ?eli?iyorsa yeni bilgiyi dikkate al.

Gizli bilgileri cevapta g?sterme.

G?VENL?K:

API anahtar?n? asla g?sterme.

.env i?indeki gizli bilgileri asla yazd?rma.

API anahtar?n? istemciye g?nderme.

?ifreleri ve tokenlar? cevapta g?sterme.

SONU?:

DO?RU
DO?AL
HIZLI
?OK D?LL?
KULLANICIYA ?ZEL HAFIZALI
G?NCEL B?LG? ARA?TIRAB?LEN
HAVA DURUMU B?LG?S? ALAB?LEN
DOSYA Y?KLEYEB?LEN
ANLA?ILIR
FAYDALI

cevaplar ?ret.

Mevcut ?al??an sistemi gereksiz yere bozma.
`.trim();

/* =========================================================
ESK? HAFIZA
========================================================= */

let memory = [];

/* =========================================================
KULLANICI HAFIZALARI
========================================================= */

let userMemories = {};

/* =========================================================
ESK? HAFIZA Y?KLE
========================================================= */

function loadMemory() {

    try {

        if (
            !fs.existsSync(
                MEMORY_FILE
            )
        ) {

            fs.writeFileSync(
                MEMORY_FILE,
                "[]",
                "utf8"
            );

            return [];
        }

        const content =
            fs.readFileSync(
                MEMORY_FILE,
                "utf8"
            );

        if (
            !content.trim()
        ) {

            return [];
        }

        const data =
            JSON.parse(
                content
            );

        if (
            !Array.isArray(data)
        ) {

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
            "HAFIZA OKUMA HATASI:",
            error.message
        );

        return [];
    }
}

/* =========================================================
ESK? HAFIZA KAYDET
========================================================= */

function saveMemory() {

    try {

        fs.writeFileSync(
            MEMORY_FILE,
            JSON.stringify(
                memory,
                null,
                2
            ),
            "utf8"
        );

        return true;

    } catch (error) {

        console.error(
            "HAFIZA KAYDETME HATASI:",
            error.message
        );

        return false;
    }
}

/* =========================================================
ESK? HAFIZAYA EKLE
========================================================= */

function addMemory(
    role,
    content
) {

    const cleanContent =
        String(
            content || ""
        ).trim();

    if (
        !cleanContent
    ) {

        return;
    }

    memory.push({

        role:
            role === "assistant"
                ? "assistant"
                : "user",

        content:
            cleanContent,

        time:
            new Date().toISOString()

    });

    if (
        memory.length >
        MAX_MEMORY_MESSAGES
    ) {

        memory =
            memory.slice(
                -MAX_MEMORY_MESSAGES
            );
    }

    saveMemory();
}

/* =========================================================
KULLANICI HAFIZASI DOSYASI OLU?TUR
========================================================= */

function loadUserMemories() {

    try {

        if (
            !fs.existsSync(
                USERS_MEMORY_FILE
            )
        ) {

            fs.writeFileSync(
                USERS_MEMORY_FILE,
                "{}",
                "utf8"
            );

            return {};
        }

        const content =
            fs.readFileSync(
                USERS_MEMORY_FILE,
                "utf8"
            );

        if (
            !content.trim()
        ) {

            return {};
        }

        const data =
            JSON.parse(
                content
            );

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
            "KULLANICI HAFIZASI OKUMA HATASI:",
            error.message
        );

        return {};
    }
}

/* =========================================================
KULLANICI HAFIZASI KAYDET
========================================================= */

function saveUserMemories() {

    try {

        fs.writeFileSync(
            USERS_MEMORY_FILE,
            JSON.stringify(
                userMemories,
                null,
                2
            ),
            "utf8"
        );

        return true;

    } catch (error) {

        console.error(
            "KULLANICI HAFIZASI KAYDETME HATASI:",
            error.message
        );

        return false;
    }
}

/* =========================================================
USER ID TEM?ZLE
========================================================= */

function cleanUserId(
    value
) {

    let userId =
        String(
            value || ""
        ).trim();

    if (
        !userId
    ) {

        return "default-user";
    }

    userId =
        userId
            .replace(
                /[^a-zA-Z0-9_-]/g,
                ""
            )
            .slice(
                0,
                100
            );

    if (
        !userId
    ) {

        return "default-user";
    }

    return userId;
}

/* =========================================================
USER ID AL
========================================================= */

function getUserId(
    req
) {

    const headerId =
        req.get(
            "X-User-ID"
        );

    const queryId =
        req.query &&
        req.query.userId
            ? req.query.userId
            : "";

    const bodyId =
        req.body &&
        req.body.userId
            ? req.body.userId
            : "";

    return cleanUserId(
        headerId ||
        bodyId ||
        queryId
    );
}

/* =========================================================
KULLANICI HAFIZASI AL
========================================================= */

function getUserMemory(
    userId
) {

    const id =
        cleanUserId(
            userId
        );

    if (
        !Array.isArray(
            userMemories[id]
        )
    ) {

        userMemories[id] = [];
    }

    return userMemories[id];
}

/* =========================================================
KULLANICI HAFIZASINA EKLE
========================================================= */

function addUserMemory(
    userId,
    role,
    content
) {

    const id =
        cleanUserId(
            userId
        );

    const cleanContent =
        String(
            content || ""
        ).trim();

    if (
        !cleanContent
    ) {

        return;
    }

    const userMemory =
        getUserMemory(
            id
        );

    userMemory.push({

        role:
            role === "assistant"
                ? "assistant"
                : "user",

        content:
            cleanContent,

        time:
            new Date().toISOString()

    });

    if (
        userMemory.length >
        MAX_USER_MEMORY_MESSAGES
    ) {

        userMemories[id] =
            userMemory.slice(
                -MAX_USER_MEMORY_MESSAGES
            );
    }

    saveUserMemories();
}

/* =========================================================
?S?M BUL
========================================================= */

function findUserName(
    text
) {

    const value =
        String(
            text || ""
        );

    const match =
        value.match(
            /(?:benim\s+ad?m|benim\s+ismim|ad?m|ismim)\s+([A-Za-z????????????]+)\b/i
        );

    if (
        match
    ) {

        return match[1];
    }

    return null;
}

/* =========================================================
KULLANICI HAFIZASINDAN ?S?M BUL
========================================================= */

function getUserName(
    userId
) {

    const userMemory =
        getUserMemory(
            userId
        );

    for (
        let i =
            userMemory.length - 1;
        i >= 0;
        i--
    ) {

        const item =
            userMemory[i];

        if (
            !item ||
            item.role !== "user"
        ) {

            continue;
        }

        const name =
            findUserName(
                item.content
            );

        if (
            name
        ) {

            return name;
        }
    }

    return null;
}

/* =========================================================
ESK? S?STEM ???N ?S?M
========================================================= */

function getLastUserName() {

    for (
        let i =
            memory.length - 1;
        i >= 0;
        i--
    ) {

        const item =
            memory[i];

        if (
            !item ||
            item.role !== "user"
        ) {

            continue;
        }

        const name =
            findUserName(
                item.content
            );

        if (
            name
        ) {

            return name;
        }
    }

    return null;
}

/* =========================================================
CEVAP TEM?ZLE
========================================================= */

function cleanReply(
    text
) {

    let reply =
        String(
            text || ""
        ).trim();

    if (
        !reply
    ) {

        return "";
    }

    try {

        const parsed =
            JSON.parse(
                reply
            );

        if (
            parsed &&
            typeof parsed.reply ===
            "string"
        ) {

            reply =
                parsed.reply.trim();
        }

    } catch (error) {

        // Normal metin.
    }

    reply =
        reply
            .replace(
                /^```(?:json|text|markdown)?\s*/i,
                ""
            )
            .replace(
                /\s*```$/i,
                ""
            )
            .trim();

    reply =
        reply
            .replace(
                /^(TÃ¼rkAI|AI|Assistant)\s*:\s*/i,
                ""
            )
            .trim();

    if (
        reply.length >
        MAX_REPLY_LENGTH
    ) {

        reply =
            reply.slice(
                0,
                MAX_REPLY_LENGTH
            ) +
            "\n\n[Yan?t ?ok uzundu ve k?salt?ld?.]";
    }

    return reply;
}

/* =========================================================
DOSYA ADI TEM?ZLE
========================================================= */

function cleanFileName(
    fileName
) {

    let name =
        String(
            fileName || ""
        );

    name =
        path.basename(
            name
        );

    name =
        name.replace(
            /[^a-zA-Z0-9????????????._-]/g,
            "_"
        );

    if (
        !name
    ) {

        name =
            "dosya";
    }

    return name;
}

/* =========================================================
DOSYA UZANTISI KONTROL
========================================================= */

function isAllowedFile(
    fileName
) {

    const extension =
        path.extname(
            fileName
        ).toLowerCase();

    return ALLOWED_FILE_EXTENSIONS.includes(
        extension
    );
}

/* =========================================================
FETCH ZAMAN A?IMI YARDIMCISI
========================================================= */

async function fetchWithTimeout(
    url,
    options = {},
    timeout = RESEARCH_TIMEOUT
) {

    const controller =
        new AbortController();

    const timer =
        setTimeout(
            function () {

                controller.abort();

            },
            timeout
        );

    try {

        const response =
            await fetch(
                url,
                {
                    ...options,
                    signal:
                        controller.signal
                }
            );

        return response;

    } finally {

        clearTimeout(
            timer
        );
    }
}

/* =========================================================
HTML TEM?ZLE
========================================================= */

function stripHtml(
    html
) {

    return String(
        html || ""
    )
        .replace(
            /<script[\s\S]*?<\/script>/gi,
            " "
        )
        .replace(
            /<style[\s\S]*?<\/style>/gi,
            " "
        )
        .replace(
            /<[^>]*>/g,
            " "
        )
        .replace(
            /&nbsp;/gi,
            " "
        )
        .replace(
            /&amp;/gi,
            "&"
        )
        .replace(
            /&quot;/gi,
            '"'
        )
        .replace(
            /&#39;/gi,
            "'"
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}

/* =========================================================
URL TEM?ZLE
========================================================= */

function cleanUrl(
    value
) {

    try {

        const url =
            new URL(
                value
            );

        if (
            url.protocol !==
                "http:" &&
            url.protocol !==
                "https:"
        ) {

            return "";
        }

        return url.href;

    } catch (error) {

        return "";
    }
}

/* =========================================================
?NTERNET ARA?TIRMASI GEREK?YOR MU?
========================================================= */
function isWeatherQuestion(message) {

    const text =
        String(message || "")
            .toLowerCase()
            .trim();

    if (!text) {
        return false;
    }

    const weatherWords = [
        "hava durumu",
        "hava nasıl",
        "hava nasil",
        "sıcaklık",
        "sicaklik",
        "kaç derece",
        "kac derece",
        "derece",
        "yağmur",
        "yagmur",
        "kar yağacak",
        "kar yagacak",
        "yağış",
        "yagis",
        "rüzgar",
        "ruzgar",
        "nem",
        "meteoroloji",
        "bugün hava",
        "bugun hava",
        "yarın hava",
        "yarin hava",
        "hava tahmini",
        "hava tahmin"
    ];

    return weatherWords.some(
        word => text.includes(word)
    );
}

function isWeatherQuestion(message) {
    const text =
        String(message || "")
            .toLowerCase()
            .trim();

    if (!text) {
        return false;
    }

    const weatherWords = [
        "hava durumu",
        "hava nasıl",
        "hava nasil",
        "bugün hava",
        "bugun hava",
        "şu an hava",
        "su an hava",
        "şimdiki hava",
        "simdiki hava",
        "sıcaklık",
        "sicaklik",
        "kaç derece",
        "kac derece",
        "yağmur",
        "yagmur",
        "kar yağacak",
        "kar yagacak",
        "yağış",
        "yagis",
        "rüzgar",
        "ruzgar",
        "nem",
        "meteoroloji",
        "hava tahmini",
        "hava tahmin"
    ];

    return weatherWords.some(
        word => text.includes(word)
    );
}
function shouldResearch(message) {

    const text =
        String(message || "")
            .toLowerCase()
            .trim();

    if (!text) {
        return false;
    }
    // =========================================================
    // BASİT / GÜNLÜK MESAJLAR
    // Bunlarda internet araştırması yapılmaz.
    // =========================================================

    const simpleMessages = [
        // Selamlaşma
        "slm",
        "selam",
        "selamlar",
        "merhaba",
        "merhabalar",
        "mrb",
        "sa",
        "s.a",
        "as",
        "a.s",
        "hey",
        "hello",
        "hi",

        // Hal hatır
        "nasılsın",
        "nasilsin",
        "iyi misin",
        "naber",
        "ne haber",
        "napıyorsun",
        "napıyosun",
        "ne yapıyorsun",
        "ne yapiyorsun",

        // Kısa cevaplar
        "tamam",
        "ok",
        "okay",
        "okey",
        "olur",
        "aynen",
        "evet",
        "hayır",
        "hayir",
        "yok",
        "var",
        "anladım",
        "anladim",
        "biliyorum",
        "bilmiyorum",
        "doğru",
        "dogru",

        // Teşekkür
        "teşekkürler",
        "tesekkurler",
        "teşekkür ederim",
        "tesekkur ederim",
        "sağ ol",
        "sag ol",
        "eyvallah",

        // Vedalaşma
        "görüşürüz",
        "gorusuruz",
        "bay bay",
        "bye",
        "hoşça kal",
        "hosca kal",
        "iyi geceler",
        "günaydın",
        "gunaydin",
        "iyi akşamlar",
        "iyi aksamlar",

        // Tepkiler
        "haha",
        "hahaha",
        "lol",
        "vay",
        "oha",
        "wow",
        "vay be",
        "çok iyi",
        "cok iyi",
        "süper",
        "super",
        "harika",
        "mükemmel",
        "mukemmel",

        // Kısa konuşmalar
        "ne",
        "neden",
        "nasıl",
        "nasil",
        "niye",
        "kim",
        "anladın mı",
        "anladin mi",
                // Günlük konuşma
        "he",
        "hee",
        "hee tamam",
        "hı hı",
        "hıhı",
        "hmm",
        "hmmm",
        "hımm",
        "hmm tamam",
        "peki",
        "peki tamam",
        "tabii",
        "tabi",
        "tabii ki",
        "tabi ki",
        "olabilir",
        "bence de",
        "ben de",
        "evet ya",
        "aynen ya",
        "haklısın",
        "haklisin",
        "doğru diyorsun",
        "dogru diyorsun",
        "tamamdır",
        "tamamdir",
        "sıkıntı yok",
        "sikinti yok",
        "sorun yok",
        "problem yok",

        // Kısa tepkiler
        "cidden",
        "gerçekten",
        "gercekten",
        "şaka mı",
        "saka mi",
        "ciddi misin",
        "emin misin",
        "eminim",
        "vay canına",
        "vay be",
        "yuh",
        "haha",
        "hahaha",
        "hehe",
        "hehehe",
        "xd",
        "xD",
        "😂",
        "🤣",
        "😎",
        "👍",
        "❤️",

        // Kısa istekler / konuşmalar
        "bak",
        "dinle",
        "bir bak",
        "dur",
        "bekle",
        "gel",
        "git",
        "devam",
        "devam et",
        "başla",
        "basla",
        "hazırım",
        "hazirim",
        "hazır mısın",
        "hazir misin",

        // Teşekkür / rica
        "çok sağ ol",
        "cok sag ol",
        "eyvallah knk",
        "sağolasın",
        "sagolasin",
        "rica ederim",
        "sağ ol knk",
        "eyvallah kardeşim",

        // Vedalaşma
        "bb",
        "by",
        "bye bye",
        "bay",
        "görüşürüz knk",
        "gorusuruz knk",
        "yarın görüşürüz",
        "iyi günler",
        "iyi günler knk",

        // Günlük kısa sorular
        "orada mısın",
        "orada misin",
        "burada mısın",
        "burada misin",
        "uyuyor musun",
        "uyanık mısın",
        "uyanık misin",
        "beni duyuyor musun",
        "beni duyuyor musun",
        "hazır mısın",
        "hazir misin",
        "çalışıyor musun",
        "calisiyor musun"
    ];

    if (simpleMessages.includes(text)) {
        return false;
    }
        // =========================================================
    // AKILLI GÜNCELLİK KONTROLÜ
    // =========================================================

    const currentInfoWords = [
        "bugün",
        "bu gün",
        "şu an",
        "şu anda",
        "şimdiki",
        "güncel",
        "güncel bilgi",
        "en güncel",
        "en son",
        "son durum",
        "son gelişme",
        "son gelişmeler",
        "şimdi",
        "2026",
        "bu yıl",
        "bu ay",
        "bu hafta",
        "dün",
        "yarın"
    ];

    const liveDataWords = [
        "fiyat",
        "kaç tl",
        "kaç lira",
        "ne kadar",
        "dolar",
        "euro",
        "sterlin",
        "kur",
        "hava",
        "hava durumu",
        "sıcaklık",
        "yağmur",
        "kar yağıyor",
        "maç",
        "skor",
        "sonuç",
        "puan durumu",
        "transfer",
        "haber",
        "haberler",
        "son dakika",
        "istatistik",
        "sıralama",
        "program",
        "etkinlik"
    ];

    const hasCurrentInfoWord =
        currentInfoWords.some(
            word => text.includes(word)
        );

    const hasLiveDataWord =
        liveDataWords.some(
            word => text.includes(word)
        );

    if (
        hasCurrentInfoWord &&
        hasLiveDataWord
    ) {
        return true;
    }
    // =========================================================
// CANLI VERİ GEREKTİREN DOĞRUDAN SORULAR
// =========================================================

const directLiveQuestions = [
    "dolar kaç",
    "dolar ne kadar",
    "dolar kaç tl",
    "dolar kaç lira",
    "1 dolar kaç tl",
    "1 dolar ne kadar",
    "euro kaç",
    "euro ne kadar",
    "euro kaç tl",
    "1 euro kaç tl",
    "sterlin kaç",
    "sterlin ne kadar",
    "sterlin kaç tl",
    "altın kaç",
    "altın ne kadar",
    "gram altın kaç",
    "gram altın ne kadar",
    "çeyrek altın kaç",
    "çeyrek altın ne kadar",
    "bitcoin kaç",
    "bitcoin ne kadar",
    "btc kaç",
    "hava nasıl",
    "hava durumu",
    "sıcaklık kaç",
    "yağmur yağıyor mu",
    "maç kaç kaç",
    "maç sonucu",
    "skor kaç"
];

if (
    directLiveQuestions.some(
        question => text.includes(question)
    )
) {
    return true;
}
    /*
    =========================================================
    G NCEL /  NTERNET ARA TIRMASI TET KLEY C LER 
    =========================================================
    */

    const directResearchWords = [

        //  nternet
        "internetten",
        "internete bak",
        "internetten bak",
        "internetten ara t r",
        "internetten ara",
        "internetten bul",
        "internetten   ren",
        "webden bak",
        "webden ara t r",
        "webden ara",
        "web'den bak",
        "web'den ara t r",
        "online bak",
        "internete bakar m s n",
        "internetten kontrol et",
        "internetten kontrol",

        // Ara t rma
        "ara t r",
        "ara t r r m s n",
        "ara t rabilir misin",
        "ara t rabilir miyiz",
        "iyice ara t r",
        "detayl  ara t r",
        "detayl ca ara t r",
        "geni  ara t r",
        "webde ara t r",
        "kaynak bul",
        "kaynaklar  bul",
        "kaynaklara bak",
        "kaynaklar  kontrol et",
        "kaynak kontrol",
        "bilgiyi do rula",
        "bilgiyi kontrol et",
        "do rula",
        "kontrol et",

        // G ncellik
        "g ncel",
        "g ncel bilgi",
        "g ncel bilgiler",
        " u an",
        " u anda",
        " imdiki",
        " imdilik",
        "bug n",
        "bug nk ",
        "bu g n",
        "son durum",
        "son durum ne",
        "en son",
        "son geli meler",
        "son haberler",
        "en g ncel",

        // Haber
        "haber",
        "haberler",
        "son dakika",
        "son dakika haberleri",
        "g ndem",
        "g ndemde ne var",
        "ne oldu",
        "neler oldu",

        // Sonu 
        "kim kazand ",
        "kim kazand ?",
        "sonu  ne",
        "sonu  ne oldu",
        "sonu lar",
        "sonu  a  kland  m ",
        "sonu  belli oldu mu",
        "ka  oldu",
        "skor ne",
        "skor ka ",

        // Zaman
        "ne zaman",
        "ne zaman olacak",
        "ne zaman ba l yor",
        "ne zaman ba layacak",
        "ne zaman bitiyor",
        "ne zaman bitecek",
        "hangi tarihte",
        "tarihi ne",
        "tarih ne"
    ];


    /*
    =========================================================
    F YAT / ALI VER  
    =========================================================
    */

    const priceWords = [

        "fiyat",
        "fiyat ",
        "fiyat  ne",
        "fiyat  ka ",
        "ne kadar",
        "ka  tl",
        "ka  lira",
        "tl ne kadar",
        "g ncel fiyat",
        " u an fiyat",
        " u anda fiyat",
        "en ucuz",
        "en uygun",
        "en d   k fiyat",
        "en y ksek fiyat",
        "fiyat kar  la t r",
        "fiyatlar  kar  la t r",
        "ka a sat l yor",
        "sat l yor mu",
        "sat   fiyat ",
        "zam geldi mi",
        "zamland  m "
    ];


    /*
    =========================================================
    STOK /  R N
    =========================================================
    */

    const stockWords = [

        "stokta",
        "stokta m ",
        "stok var m ",
        "stok kald  m ",
        "stok durumu",
        "stok durumu nedir",
        "mevcut mu",
        " r n mevcut mu",
        "sat  ta m ",
        "sat  a   kt  m ",
        "sat   ba lad  m ",
        "sat  a sunuldu mu",
        "bulunuyor mu"
    ];


    /*
    =========================================================
     ND R M / KAMPANYA
    =========================================================
    */

    const discountWords = [

        "indirim",
        "indirim var m ",
        "indirimde mi",
        " u an indirimde mi",
        "kampanya",
        "kampanya var m ",
        "kampanyalar",
        "f rsat",
        "f rsatlar",
        "kupon",
        "kupon var m ",
        "bedava",
        " cretsiz",
        "kampanya ne zaman bitiyor",
        "indirim ne zaman bitiyor"
    ];


    /*
    =========================================================
    SPOR
    =========================================================
    */

    const sportsWords = [

        "puan durumu",
        "puan tablosu",
        "s ralama",
        "g ncel s ralama",
        "son s ralama",
        "lig s ralamas ",
        "fikst r",
        "ma ",
        "ma  sonucu",
        "ma  skoru",
        "ma  ka  ka ",
        "ma  ne zaman",
        "ma  saat ka ta",
        "kim kazand ",
        "transfer",
        "transfer oldu mu",
        "transfer haberi",
        "kadrosu",
        "ilk 11",
        "lig",
        " ampiyon",
        " ampiyon oldu mu",
        " ampiyon kim",
        "futbol",
        "basketbol",
        "tenis"
    ];


    /*
    =========================================================
    TEKNOLOJ  / OYUN
    =========================================================
    */

    const technologyWords = [

        "iphone",
        "samsung",
        "xiaomi",
        "redmi",
        "telefon fiyat ",
        "telefon   kt  m ",
        "yeni telefon",
        "yeni model",
        "ekran kart ",
        "i lemci",
        "ekran kart  fiyat ",
        "laptop fiyat ",
        "bilgisayar fiyat ",
        "steam",
        "steam fiyat ",
        "minecraft",
        "valorant",
        "playstation",
        "xbox",
        "oyun   kt  m ",
        "oyun g ncellemesi",
        "g ncelleme geldi mi",
        "yeni s r m"
    ];


    /*
    =========================================================
    ULA IM
    =========================================================
    */

    const transportWords = [

        "u u ",
        "u u  durumu",
        "u u  iptal mi",
        "u u  ertelendi mi",
        "u u  gecikti mi",
        "u u  ba lad  m ",
        "u u  saat ka ta",
        "sefer",
        "sefer iptal mi",
        "sefer ertelendi mi",
        "sefer saat ka ta",
        "sefer var m ",
        "otob s bileti",
        "u ak bileti",
        "bilet fiyat ",
        "trafik",
        "trafik durumu",
        "trafik yo un mu",
        "yol durumu",
        "yollar a  k m ",
        "yol kapal  m ",
        "yol  al  mas ",
        "ula  m durumu"
    ];


    /*
    =========================================================
    F LM / D Z  / ETK NL K
    =========================================================
    */

    const entertainmentWords = [

        "sinema program ",
        "sinema seanslar ",
        "film seanslar ",
        "film hangi sinemada",
        "film hangi platformda",
        "film yay n tarihi",
        "film ne zaman   k yor",
        "dizi",
        "dizinin yeni b l m ",
        "dizinin son b l m ",
        "dizinin yay n tarihi",
        "dizi hangi platformda",
        "yeni b l m",
        "konser",
        "konser ne zaman",
        "konser nerede",
        "konser saat ka ta",
        "konser iptal mi",
        "festival",
        "festival ne zaman",
        "festival nerede",
        "etkinlik",
        "etkinlik ne zaman",
        "etkinlik nerede",
        "etkinlik saat ka ta",
        "etkinlik iptal mi"
    ];


    /*
    =========================================================
    OKUL / E  T M
    =========================================================
    */

    const educationWords = [

        "okul ne zaman",
        "okullar ne zaman",
        "okul ba lang   tarihi",
        "okul biti  tarihi",
        "okullar ne zaman a  l yor",
        "okullar ne zaman kapan yor",
        "e itim takvimi",
        "e itim   retim takvimi",
        "s nav takvimi",
        "s nav sonu lar ",
        "sonu lar a  kland  m ",
        "s nav ne zaman",
        "s nav tarihi",
        "tatil ne zaman",
        "ara tatil",
        "yaz tatili"
    ];


    /*
    =========================================================
    T M KATEGOR LER  B RLE T R
    =========================================================
    */

    const allResearchWords = [

        ...directResearchWords,
        ...priceWords,
        ...stockWords,
        ...discountWords,
        ...sportsWords,
        ...technologyWords,
        ...transportWords,
        ...entertainmentWords,
        ...educationWords
    ];


    /*
    =========================================================
    DO RUDAN KONTROL
    =========================================================
    */
// =========================================================
// AÇIK İNTERNET ARAŞTIRMASI İSTEĞİ
// Kullanıcı açıkça araştırma isterse kesinlikle araştır.
// =========================================================

const explicitResearchRequest =
    [
        "internetten araştır",
        "internetten ara",
        "internetten bak",
        "internetten bul",
        "webden araştır",
        "webden ara",
        "webden bak",
        "internete bak",
        "online araştır",
        "online bak",
        "araştır bunu",
        "bunu araştır",
        "iyice araştır",
        "detaylı araştır",
        "güncel internet araştırması yap",
        "internet araştırması yap",
        "kaynak bul",
        "bilgiyi doğrula"
    ].some(
        phrase => text.includes(phrase)
    );

if (explicitResearchRequest) {
    return true;
}
    if (
        allResearchWords.some(
            word =>
                text.includes(word)
        )
    ) {

        return true;
    }


    /*
    =========================================================
    AKILLI G NCEL SORU KONTROL 
    =========================================================
    
    Kullan c  kelimeleri farkl  s rada yazsa bile
    ara t rmay  tetikler.
    */

    const currentWords = [

        "g ncel",
        " u an",
        " u anda",
        "bug n",
        "son",
        "en son",
        " imdiki"
    ];


    const questionWords = [

        "ne",
        "ka ",
        "kim",
        "nerede",
        "ne zaman",
        "nas l",
        "hangi",
        "var m ",
        "oldu mu",
        "a  kland  m "
    ];


    const hasCurrentWord =
        currentWords.some(
            word =>
                text.includes(word)
        );


    const hasQuestionWord =
        questionWords.some(
            word =>
                text.includes(word)
        );


    if (
        hasCurrentWord &&
        hasQuestionWord
    ) {

        return true;
    }


    /*
    =========================================================
    SON KONTROL
    =========================================================
    */

    return false;
}
/* =========================================================
GENEL ARAMA
========================================================= */

async function webSearch(
    query
) {

    const cleanQuery =
        String(
            query || ""
        ).trim();

    if (
        !cleanQuery
    ) {

        return [];
    }

    try {

        const url =
            SEARCH_URL +
            "?q=" +
            encodeURIComponent(
                cleanQuery
            );

        const response =
            await fetchWithTimeout(
                url,
                {
                    method:
                        "GET",

                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36",

                        "Accept":
                            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                        "Accept-Language":
                            "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",

                        "Cache-Control":
                            "no-cache"

                    }
                },
                15000
            );

        if (
            !response.ok
        ) {

            throw new Error(
                "Web arama HTTP " +
                response.status
            );
        }

        const html =
            await response.text();

        if (
            !html ||
            html.length < 100
        ) {

            throw new Error(
                "Arama motorundan bo? sonu? geldi."
            );
        }

        

        /*
            DuckDuckGo sonu?lar?
        */

        const resultPattern =
            /<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

        let match;

        while (
            (
                match =
                    resultPattern.exec(
                        html
                    )
            ) !== null &&
            results.length <
                MAX_SEARCH_RESULTS
        ) {

            let href =
                match[1];

            const title =
                stripHtml(
                    match[2]
                ).trim();

            if (
                href.includes(
                    "uddg="
                )
            ) {

                try {

                    const parsed =
                        new URL(
                            href,
                            "https://html.duckduckgo.com"
                        );

                    const realUrl =
                        parsed.searchParams.get(
                            "uddg"
                        );

                    if (
                        realUrl
                    ) {

                        href =
                            realUrl;
                    }

                } catch (error) {

                    continue;
                }
            }

            href =
                cleanUrl(
                    href
                );

            if (
                title &&
                href &&
                !href.includes(
                    "duckduckgo.com"
                )
            ) {

                const exists =
                    results.some(
                        item =>
                            item.url ===
                            href
                    );

                if (
                    !exists
                ) {

                    results.push({

                        title:
                            title.slice(
                                0,
                                300
                            ),

                        url:
                            href

                    });
                }
            }
        }

        /*
            Alternatif ba?lant? taramas?
        */

        if (
            results.length === 0
        ) {

            const linkPattern =
                /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

            while (
                (
                    match =
                        linkPattern.exec(
                            html
                        )
                ) !== null &&
                results.length <
                    MAX_SEARCH_RESULTS
            ) {

                let href =
                    match[1];

                const title =
                    stripHtml(
                        match[2]
                    ).trim();

                if (
                    !title ||
                    title.length < 4
                ) {

                    continue;
                }

                if (
                    href.includes(
                        "uddg="
                    )
                ) {

                    try {

                        const parsed =
                            new URL(
                                href,
                                "https://html.duckduckgo.com"
                            );

                        const realUrl =
                            parsed.searchParams.get(
                                "uddg"
                            );

                        if (
                            realUrl
                        ) {

                            href =
                                realUrl;
                        }

                    } catch (error) {

                        continue;
                    }
                }

                href =
                    cleanUrl(
                        href
                    );

                if (
                    !href ||
                    href.includes(
                        "duckduckgo.com"
                    )
                ) {

                    continue;
                }

                const exists =
                    results.some(
                        item =>
                            item.url ===
                            href
                    );

                if (
                    !exists
                ) {

                    results.push({

                        title:
                            title.slice(
                                0,
                                300
                            ),

                        url:
                            href

                    });
                }
            }
        }

        console.log(
            "WEB ARAMA SONU?LARI:",
            results.length
        );

        return results;

    } catch (error) {

        console.error(
            "WEB ARAMA HATASI:",
            error.message
        );

        throw error;
    }
}
/* =========================================================
TCMB G NCEL D V Z KURU
========================================================= */

async function getTcmbUsdRate() {

    const url =
        "https://www.tcmb.gov.tr/kurlar/today.xml";

    const response =
        await fetchWithTimeout(
            url,
            {
                method:
                    "GET",

                headers: {

                    "User-Agent":
                        "Mozilla/5.0",

                    "Accept":
                        "application/xml,text/xml,*/*"

                }
            },
            15000
        );

    if (
        !response.ok
    ) {

        throw new Error(
            "TCMB HTTP " +
            response.status
        );
    }

    const xml =
        await response.text();

    if (
        !xml ||
        xml.length < 100
    ) {

        throw new Error(
            "TCMB bo  veri d nd rd ."
        );
    }

    const usdMatch =
        xml.match(
            /<Currency[^>]*Kod="USD"[^>]*>[\s\S]*?<ForexBuying>(.*?)<\/ForexBuying>[\s\S]*?<ForexSelling>(.*?)<\/ForexSelling>[\s\S]*?<\/Currency>/
        );

    if (
        !usdMatch
    ) {

        throw new Error(
            "TCMB USD kuru bulunamad ."
        );
    }

    const buying =
        Number(
            usdMatch[1]
        );

    const selling =
        Number(
            usdMatch[2]
        );

    if (
        !Number.isFinite(
            buying
        ) ||
        !Number.isFinite(
            selling
        )
    ) {

        throw new Error(
            "TCMB USD kuru ge ersiz."
        );
    }

    console.log(
        "TCMB USD:",
        buying,
        selling
    );

    return {

        buying:
            buying,

        selling:
            selling

    };
}

/* =========================================================
ARA?TIRMA SONUCU OLU?TUR
========================================================= */

async function researchWeb(
    query
) {

    console.log(
        " NTERNET ARA TIRMASI:",
        query
    );

    const currencyQuery =
    String(
        query || ""
    ).toLowerCase();

    if (
               currencyQuery.includes("dolar") ||
               currencyQuery.includes("usd") ||
                  currencyQuery.includes("d viz kuru") ||
                        currencyQuery.includes ("d viz kurlar ")
    ) {

        try {

            const usd =
                await getTcmbUsdRate();

            return {

                ok:
                    true,

                query:
                    query,

                text:
                    `
TCMB G NCEL D V Z KURU

Tarih:
${new Date().toLocaleDateString("tr-TR")}

ABD DOLARI (USD):

Forex al  :
${usd.buying.toFixed(4)} TL

Forex sat  :
${usd.selling.toFixed(4)} TL

Bu de erler do rudan TCMB'nin g ncel XML verisinden al nm  t r.
`.trim(),

                sources: [

                    {

                        title:
                            "T rkiye Cumhuriyet Merkez Bankas  - G ncel D viz Kurlar ",

                        url:
                            "https://www.tcmb.gov.tr/kurlar/today.xml"

                    }

                ]

            };

        } catch (
            error
        ) {

            console.error(
                "TCMB KUR HATASI:",
                error.message
            );

        }
    }

      
        const researchCategories = {

        gold: [
            "alt n",
            "gram alt n",
            " eyrek alt n",
            "yar m alt n",
            "tam alt n",
            "cumhuriyet alt n ",
            "ons alt n"
        ],

        currency: [
            "euro",
            "eur",
            "sterlin",
            "gbp",
            "frank",
            "d viz"
        ],

        cars: [
            "araba",
            "otomobil",
            "ara ",
            "araba fiyat ",
            "otomobil fiyat ",
            "ikinci el",
            "s f r araba"
        ],

        phones: [
            "telefon",
            "iphone",
            "samsung",
            "xiaomi",
            "oppo",
            "redmi"
        ],

        computers: [
            "bilgisayar",
            "laptop",
            "ekran kart ",
            "i lemci",
            "ram",
            "ssd"
        ],

        games: [
            "oyun",
            "steam",
            "playstation",
            "xbox",
            "minecraft",
            "valorant"
        ],

        sports: [
            "ma ",
            "futbol",
            "basketbol",
            "transfer",
            "puan durumu",
            "fikst r",
            "skor"
        ],

        news: [
            "haber",
            "son dakika",
            "g ndem",
            "son geli meler"
        ],

        economy: [
            "borsa",
            "enflasyon",
            "faiz",
            "ekonomi",
            "petrol"
        ],

        housing: [
            "ev fiyat ",
            "konut",
            "kira",
            "daire fiyat "
        ],

        transport: [
            "u ak bileti",
            "u u ",
            "otob s bileti",
            "sefer"
        ],

        movies: [
            "film",
            "dizi",
            "sinema",
            "vizyon"
        ],

        education: [
            "s nav",
            "okul takvimi",
            "e itim",
            " niversite"
        ],

        events: [
            "konser",
            "festival",
            "etkinlik"
        ]

    };

    let detectedCategory =
        "general";

    for (
        const category of
        Object.keys(
            researchCategories
        )
    ) {

        if (
            researchCategories[
                category
            ].some(
                word =>
                    currencyQuery.includes(
    word
)
            )
        ) {

            detectedCategory =
                category;

            break;
        }
    }

    console.log(
        "ARA TIRMA KATEGOR S :",
        detectedCategory
    );

    
    const lowerQuery =
        String(query || "").toLowerCase();

    const isUsdTryQuestion =
        (
            lowerQuery.includes("dolar") ||
            lowerQuery.includes("usd")
        ) &&
        (
            lowerQuery.includes("ka  tl") ||
            lowerQuery.includes("ka  lira") ||
            lowerQuery.includes("tl") ||
            lowerQuery.includes("kur") ||
            lowerQuery.includes("al  ") ||
            lowerQuery.includes("sat  ")
        );

    if (isUsdTryQuestion) {

        try {
console.log(
    "USD/TRY  ZEL KONTROL :",
    isUsdTryQuestion
);                
             console.log(
    "TCMB KONTROL  TAMAM:",
    isUsdTryQuestion ? "EVET" : "HAYIR"
);
            console.log(
                "TCMB USD KURU DO RUDAN ALINIYOR..."
            );

            const response =
                await fetchWithTimeout(
                    "https://www.tcmb.gov.tr/kurlar/today.xml",
                    {
                        method: "GET",
                        headers: {
                            "User-Agent":
                                "TÃ¼rkAI/10.0"
                        }
                    },
                    10000
                );

            if (!response.ok) {

                throw new Error(
                    "TCMB HTTP " +
                    response.status
                );
            }

            const xml =
                await response.text();

            const usdMatch =
                xml.match(
                    /<Currency[^>]*Kod="USD"[\s\S]*?<ForexBuying>(.*?)<\/ForexBuying>[\s\S]*?<ForexSelling>(.*?)<\/ForexSelling>[\s\S]*?<BanknoteBuying>(.*?)<\/BanknoteBuying>[\s\S]*?<BanknoteSelling>(.*?)<\/BanknoteSelling>[\s\S]*?<\/Currency>/
                );

            if (
                !usdMatch
            ) {

                throw new Error(
                    "TCMB USD verisi bulunamad ."
                );
            }

            const buying =
                usdMatch[1].trim();

            const selling =
                usdMatch[2].trim();

            const banknoteBuying =
                usdMatch[3].trim();

            const banknoteSelling =
                usdMatch[4].trim();

            console.log(
                "TCMB USD:",
                buying,
                selling
            );

            return {

                ok: true,

                query: query,

                text:
                    "TCMB resmi USD kuru:\n" +
                    "Forex al  : " +
                    buying +
                    " TL\n" +
                    "Forex sat  : " +
                    selling +
                    " TL\n" +
                    "Banknot al  : " +
                    banknoteBuying +
                    " TL\n" +
                    "Banknot sat  : " +
                    banknoteSelling +
                    " TL",

                sources: [
                    {
                        title:
                            "TCMB - G nl k D viz Kurlar ",

                        url:
                            "https://www.tcmb.gov.tr/kurlar/today.xml"
                    }
                ]

            };

        } catch (error) {

            console.error(
                "TCMB USD KURU HATASI:",
                error.message
            );

            // TCMB ba ar s zsa normal ara t rmaya devam et.
        }
    }
    console.log(
        "?NTERNET ARA?TIRMASI:",
        query
    );

    const results =
        await webSearch(
            query
        );

    if (
    !results.length
) {

        return {

            ok:
                false,

            query:
                query,

            text:
                "?nternette uygun arama sonucu bulunamad?.",

            sources:
                []

        };
    }
const trustedDomains = [
    "tcmb.gov.tr",
    "tff.org",
    "resmigazete.gov.tr",
    "gov.tr",
    "tuik.gov.tr",
    "mevzuat.gov.tr"
];

const scoreResult =
    result => {

        try {

            const hostname =
                new URL(
                    result.url
                ).hostname
                .toLowerCase();

            if (
                hostname === "tcmb.gov.tr" ||
                hostname.endsWith(".tcmb.gov.tr")
            ) {
                return 100;
            }

            if (
                hostname === "tff.org" ||
                hostname.endsWith(".tff.org")
            ) {
                return 95;
            }

            if (
                hostname === "resmigazete.gov.tr" ||
                hostname.endsWith(".resmigazete.gov.tr")
            ) {
                return 95;
            }

            if (
                hostname.endsWith(".gov.tr")
            ) {
                return 90;
            }

            if (
                trustedDomains.some(
                    domain =>
                        hostname === domain ||
                        hostname.endsWith(
                            "." + domain
                        )
                )
            ) {
                return 85;
            }

            return 10;

        } catch (
            error
        ) {

            return 0;
        }
    };
   
const trustedResults =
    results.filter(
        result =>
            result &&
            result.url &&
            result.title
    );
    trustedResults.sort(
    (
        a,
        b
    ) =>
        scoreResult(b) -
        scoreResult(a)
);
const selectedResults =
    trustedResults.slice(
        0,
        3
    );

const sourceTexts =
    await Promise.all(
        selectedResults.map(
            async result => {

                const pageText =
                    await fetchPageText(
                        result.url
                    );

                return {

                    title:
                        result.title,

                    url:
                        result.url,

                    text:
                        pageText

                };

            }
        )
    );

    let combined =
        "";

    for (
        const item of sourceTexts
    ) {

        combined +=
            "\n\nBA?LIK: " +
            item.title +
            "\nURL: " +
            item.url;

        if (
            item.text
        ) {

            combined +=
                "\n??ER?K: " +
                item.text;
        }
    }

    combined =
        combined.slice(
            0,
        5000
     );      
    return {

        ok:
            true,

        query:
            query,

        text:
            combined,

        sources:
            sourceTexts.map(
                item => ({

                    title:
                        item.title,

                    url:
                        item.url

                })
            )

    };
}

/* =========================================================
HAVA DURUMU ?EH?R BUL
========================================================= */

async function geocodeLocation(
    location
) {

    const url =
        WEATHER_GEOCODING_URL +
        "?name=" +
        encodeURIComponent(
            location
        ) +
        "&count=1" +
        "&language=tr" +
        "&format=json";

   

    if (
        !response.ok
    ) {

        throw new Error(
            "Konum arama HTTP " +
            response.status
        );
    }

    const data =
        await response.json();

    if (
        !data.results ||
        !data.results.length
    ) {

        return null;
    }

    return data.results[0];
}

/* =========================================================
HAVA DURUMU AL
========================================================= */

async function getWeather(
    location
) {

    const cleanLocation =
        String(
            location || ""
        ).trim();

    if (
        !cleanLocation
    ) {

        return {

            ok:
                false,

            message:
                "Hava durumu i?in ?ehir veya konum belirtilmedi."

        };
    }

    console.log(
        "HAVA DURUMU KONUMU:",
        cleanLocation
    );

    const place =
        await geocodeLocation(
            cleanLocation
        );

    if (
        !place
    ) {

        return {

            ok:
                false,

            message:
                cleanLocation +
                " i?in konum bulunamad?."

        };
    }

    const url =
        WEATHER_URL +
        "?latitude=" +
        encodeURIComponent(
            place.latitude
        ) +
        "&longitude=" +
        encodeURIComponent(
            place.longitude
        ) +
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m" +
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code" +
        "&timezone=Europe%2FIstanbul" +
        "&forecast_days=3";

    const response =
        await fetchWithTimeout(
            url,
            {
                method:
                    "GET",

                headers: {

                    "User-Agent":
                        "TÃ¼rkAI/10.0"

                }
            }
        );

    if (
        !response.ok
    ) {

        throw new Error(
            "Hava durumu HTTP " +
            response.status
        );
    }

    const data =
        await response.json();

    return {

        ok:
            true,

        location: {

            name:
                place.name,

            country:
                place.country,

            latitude:
                place.latitude,

            longitude:
                place.longitude

        },

        current:
            data.current || {},

        daily:
            data.daily || {},

        timezone:
            data.timezone || "Europe/Istanbul"

    };
}

/* =========================================================
HAVA KODU A?IKLAMA
========================================================= */

function weatherCodeText(
    code
) {

    const map = {

        0:
            "A??k",

        1:
            "?o?unlukla a??k",

        2:
            "Par?al? bulutlu",

        3:
            "Kapal?",

        45:
            "Sisli",

        48:
            "K?ra??l? sis",

        51:
            "Hafif ?iseleme",

        53:
            "Orta ?iddette ?iseleme",

        55:
            "Yo?un ?iseleme",

        61:
            "Hafif ya?mur",

        63:
            "Orta ?iddette ya?mur",

        65:
            "?iddetli ya?mur",

        71:
            "Hafif kar",

        73:
            "Orta ?iddette kar",

        75:
            "Yo?un kar",

        80:
            "Hafif sa?anak",

        81:
            "Orta ?iddette sa?anak",

        82:
            "?iddetli sa?anak",

        95:
            "G?k g?r?lt?l? f?rt?na",

        96:
            "Dolu ihtimalli g?k g?r?lt?l? f?rt?na",

        99:
            "?iddetli dolu ihtimalli g?k g?r?lt?l? f?rt?na"

    };

    return (
        map[code] ||
        "Bilinmeyen hava durumu"
    );
}

/* =========================================================
HAVA VER?S?N? METNE ?EV?R
========================================================= */

function formatWeatherForAI(
    weather
) {

    if (
        !weather ||
        !weather.ok
    ) {

        return "";
    }

    const current =
        weather.current || {};

    const daily =
        weather.daily || {};

    const location =
        weather.location || {};

    let text =
        `
[G?NCEL HAVA DURUMU]

Konum:
${location.name || ""}, ${location.country || ""}

Saat dilimi:
${weather.timezone || ""}

?u an:
${weatherCodeText(current.weather_code)}

S?cakl?k:
${current.temperature_2m ?? "Bilinmiyor"} ?C

Hissedilen:
${current.apparent_temperature ?? "Bilinmiyor"} ?C

Nem:
${current.relative_humidity_2m ?? "Bilinmiyor"} %

Ya???:
${current.precipitation ?? "Bilinmiyor"} mm

Ya?mur:
${current.rain ?? "Bilinmiyor"} mm

R?zgar:
${current.wind_speed_10m ?? "Bilinmiyor"} km/sa

G?nl?k tahmin:

`;

    if (
        Array.isArray(
            daily.time
        )
    ) {

        for (
            let i = 0;
            i <
            Math.min(
                daily.time.length,
                3
            );
            i++
        ) {

            text +=
                `
${daily.time[i]}:
Min ${daily.temperature_2m_min?.[i] ?? "?"} ?C
Max ${daily.temperature_2m_max?.[i] ?? "?"} ?C
Ya??? ihtimali ${daily.precipitation_probability_max?.[i] ?? "?"} %
Durum ${weatherCodeText(daily.weather_code?.[i])}

`;
        }
    }

    return text.trim();
}

/* =========================================================
GROQ ?STE??
========================================================= */

async function requestGroq(
    messages
) {

    let lastError =
        null;

    for (
        let attempt = 1;
        attempt <=
        MAX_RETRIES + 1;
        attempt++
    ) {

        const controller =
            new AbortController();

        const timeout =
            setTimeout(
                function () {

                    controller.abort();

                },
                REQUEST_TIMEOUT
            );

        try {

            const response =
                await fetch(
                    GROQ_URL,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                "Bearer " +
                                GROQ_API_KEY

                        },

                        body:
                            JSON.stringify({

                                model:
                                    GROQ_MODEL,

                                messages:
                                    messages,

                                temperature:
                                    0.20,

                                max_tokens:
                                    700,

                               reasoning_effort:
                               "low",

                          include_reasoning:
                                false,

                            stream: false,

                            tools: [],

                            tool_choice: "none"

                            }),

                        signal:
                            controller.signal

                    }
                );
console.log(
    "GROQ KALAN Ä°STEK:",
    response.headers.get("x-ratelimit-remaining-requests")
);

console.log(
    "GROQ KALAN TOKEN:",
    response.headers.get("x-ratelimit-remaining-tokens")
);

console.log(
    "GROQ LÄ°MÄ°T SIFIRLANMA:",
    response.headers.get("x-ratelimit-reset-requests")
);
            clearTimeout(
                timeout
            );

            const responseText =
                await response.text();

            if (
                !response.ok
            ) {

                const error =
                    new Error(
                        "Groq HTTP " +
                        response.status +
                        (
                            responseText
                                ? " - " +
                                  responseText.slice(
                                      0,
                                      500
                                  )
                                : ""
                        )
                    );

                error.status =
                    response.status;

                error.body =
                    responseText;

                throw error;
            }

            let data;

            try {

                data =
                    JSON.parse(
                        responseText
                    );

            } catch (error) {

                throw new Error(
                    "Groq ge?ersiz JSON g?nderdi."
                );
            }

            const usedTokens =
    data?.usage?.total_tokens || 0;

addGroqUsage(
    usedTokens
);

return data;

        } catch (error) {

            clearTimeout(
                timeout
            );

            lastError =
                error;
if (
    error.status === 429
) {
    throw error;
}
            console.error(
                "GROQ DENEME " +
                attempt +
                " HATASI:",
                error.message
            );

            if (
                error.status === 401 ||
                error.status === 403
            ) {

                break;
            }

            if (
                error.status === 400
            ) {

                break;
            }

            if (
                attempt <=
                MAX_RETRIES
            ) {

                await new Promise(
                    function (
                        resolve
                    ) {

                        setTimeout(
                            resolve,
                            500 * attempt
                        );

                    }
                );
            }
        }
    }

    throw (
        lastError ||
        new Error(
            "Groq ba?lant?s? kurulamad?."
        )
    );
}
/* =========================================================
CEREBRAS AI
========================================================= */

async function requestCerebras(
    messages
) {

    if (
        !CEREBRAS_API_KEY
    ) {

        throw new Error(
            "Cerebras API anahtar  bulunamad ."
        );
    }

    const response =
        await fetch(
            CEREBRAS_URL,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        "Bearer " +
                        CEREBRAS_API_KEY

                },

                body:
                    JSON.stringify({

                        model:
                            CEREBRAS_MODEL,

                        messages:
                            messages,

                        temperature:
                            0.20,

                        max_tokens:
                            700,

                        stream:
                            false

                    })

            }
        );

    const responseText =
        await response.text();

    if (
        !response.ok
    ) {

        const error =
            new Error(
                "Cerebras HTTP " +
                response.status +
                (
                    responseText
                        ? " - " +
                          responseText.slice(
                              0,
                              500
                          )
                        : ""
                )
            );

        error.status =
            response.status;

        error.body =
            responseText;

        throw error;
    }

    let data;

    try {

        data =
            JSON.parse(
                responseText
            );

    } catch (error) {

        throw new Error(
            "Cerebras ge ersiz JSON g nderdi."
        );
    }

    return data;
}
/* =========================================================
GEMINI YEDEK AI
========================================================= */

async function requestGemini(
    messages
) {

    if (
        !GEMINI_API_KEY
    ) {

        throw new Error(
            "Gemini API anahtar? bulunamad?."
        );
    }

   const contents =
    messages
    .filter(
    
        item =>
            item &&
            item.content
    )
            .map(
                item => ({

                    role:
                        item.role ===
                        "assistant"
                            ? "model"
                            : "user",

                    parts: [

                        {
                            text:
                                String(
                                    item.content
                                )
                        }

                    ]

                })
            );

    const response =
        await fetch(
           "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
           {
            

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "x-goog-api-key":
                        GEMINI_API_KEY

                },

               body:
    JSON.stringify({

        contents:
            contents,

        tools: [
            {
                google_search: {}
            }
        ],

        generationConfig: {

            maxOutputTokens:
                700

        }

    })

            }
        );

    const responseText =
        await response.text();

    if (
        !response.ok
    ) {

        const error =
            new Error(
                "Gemini HTTP " +
                response.status +
                " - " +
                responseText.slice(
                    0,
                    500
                )
            );

        error.status =
            response.status;

        error.body =
            responseText;

        throw error;
    }

    let data;

    try {

        data =
            JSON.parse(
                responseText
            );

    } catch (error) {

        throw new Error(
            "Gemini ge?ersiz JSON g?nderdi."
        );
    }

    return {

        choices: [

            {

                message: {

                    role:
                        "assistant",

                    content:
                        data
                            ?.candidates?.[0]
                            ?.content?.parts?.[0]
                            ?.text || ""

                }

            }

        ]

    };
}
/* =========================================================
GROQ ? GEMINI YEDEK S?STEM?
========================================================= */

async function requestAI(
    messages
) {

    const lastUserMessage =
        messages
            .filter(
                m =>
                    m &&
                    m.role === "user"
            )
            .pop()
            ?.content
            ?.trim()
            .toLowerCase() || "";
           console.log(
    "YEREL TEST MESAJI:",
    JSON.stringify(lastUserMessage)
);

    /* =========================================================
    BASÄ°T MESAJLAR
    API KULLANILMAZ
    ========================================================= */

    const simpleMessages = {

        "selam":
            "Selam! ğŸ˜Š",

        "slm":
            "Selam! ğŸ˜Š",

        "merhaba":
            "Merhaba! Size nasÄ±l yardÄ±mcÄ± olabilirim?",

        "mrb":
            "Merhaba! ğŸ˜Š",

        "hey":
            "Hey! ğŸ‘‹",

        "sa":
            "Selam! ğŸ˜Š",

        "s.a.":
            "Selam! ğŸ˜Š",

        "gÃ¼naydÄ±n":
            "GÃ¼naydÄ±n! â˜€ï¸",

        "iyi akÅŸamlar":
            "Ä°yi akÅŸamlar! ğŸ˜Š",

       

        "teÅŸekkÃ¼rler":
            "Rica ederim! ğŸ˜Š",

        "teÅŸekkÃ¼r ederim":
            "Rica ederim! ğŸ˜Š",

        "saÄŸ ol":
            "Ne demek! ğŸ˜Š",

        "tamam":
            "TamamdÄ±r! ğŸ‘",

        "olur":
            "Olur! ğŸ‘",

        "peki":
            "Peki! ğŸ˜Š",

        "anladÄ±m":
            "Harika! ğŸ‘",

        "gÃ¶rÃ¼ÅŸÃ¼rÃ¼z":
            "GÃ¶rÃ¼ÅŸÃ¼rÃ¼z! ğŸ‘‹",

        "bye":
            "GÃ¶rÃ¼ÅŸÃ¼rÃ¼z! ğŸ‘‹"

    };


  if (
    Object.prototype.hasOwnProperty.call(
        simpleMessages,
        lastUserMessage
    )
) {

    console.log(
        "AI: YEREL CEVAP (0 API TOKEN)"
    );

    return {
        choices: [
            {
                message: {
                    role: "assistant",
                    content:
                        simpleMessages[
                            lastUserMessage
                        ]
                }
            }
        ]
    };
}


/* =========================================================
NORMAL / GÃœNCEL / KARMAÅIK SORULAR
========================================================= */

try {

    console.log(
        "AI: GROQ"
    );

    return await requestGroq(
        messages
    );

} catch (groqError) {

    console.error(
        "GROQ BAÅARISIZ, CEREBRAS'A GEÃ‡Ä°LÄ°YOR:",
        groqError.message
    );

    try {

        console.log(
            "AI: CEREBRAS YEDEK"
        );

        return await requestCerebras(
            messages
        );

    } catch (cerebrasError) {

        console.error(
            "CEREBRAS DA BAÅARISIZ, GEMINI'YE GEÃ‡Ä°LÄ°YOR:",
            cerebrasError.message
        );

        try {

            console.log(
                "AI: GEMINI YEDEK"
            );

            return await requestGemini(
                messages
            );

        } catch (geminiError) {

            console.error(
                "GEMINI DE BAÅARISIZ:",
                geminiError.message
            );

            console.error(
                "GEMINI DETAY:",
                geminiError
            );

            throw new Error(
                "Groq, Cerebras ve Gemini kullanÄ±lamÄ±yor."
            );
        }
    }
}
}

/* =========================================================
BA?LANGI? HAFIZALARI
========================================================= */

memory =
    loadMemory();

userMemories =
    loadUserMemories();

/* =========================================================
EXPRESS
========================================================= */

app.use(
    express.json({
        limit:
            "15mb"
    })
);

app.use(
    express.static(
        __dirname
    )
);
/* =========================================================
OTOMAT?K KULLANICI COOKIE S?STEM?
========================================================= */

app.use(
    function (
        req,
        res,
        next
    ) {

        const cookies =
            String(
                req.headers.cookie || ""
            )
            .split(";")
            .reduce(
                function (
                    result,
                    item
                ) {

                    const parts =
                        item.trim().split("=");

                    const key =
                        parts.shift();

                    const value =
                        parts.join("=");

                    if (
                        key
                    ) {
                        result[key] =
                            decodeURIComponent(
                                value || ""
                            );
                    }

                    return result;

                },
                {}
            );

        let userId =
            cookies.erencan_user_id;

        if (
            !userId
        ) {
            userId =
                crypto.randomUUID();
        }

        userId =
            cleanUserId(
                userId
            );

        res.setHeader(
            "Set-Cookie",
            "erencan_user_id=" +
            encodeURIComponent(
                userId
            ) +
            "; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax"
        );

        req.erencanUserId =
            userId;

        next();
    }
);
/* =========================================================
ANA SAYFA
========================================================= */

app.get(
    "/",
    function (
        req,
        res
    ) {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);

/* =========================================================
TEST API
========================================================= */

app.get(
    "/api/test",
    function (
        req,
        res
    ) {

        const dateInfo =
            getCurrentDateInfo();

        return res.json({

            ok:
                true,

            server:
                true,

            ai:
                "Groq",

            model:
                GROQ_MODEL,

            apiKey:
                GROQ_API_KEY
                    ? "BULUNDU"
                    : "BULUNAMADI",

            memoryMessages:
                memory.length,

            userCount:
                Object.keys(
                    userMemories
                ).length,

            endpoint:
                "/api/chat",

            uploadEndpoint:
                "/api/upload",

            researchEndpoint:
                "/api/research",

            weatherEndpoint:
                "/api/weather",

            currentDate:
                dateInfo.turkey,

            year:
                dateInfo.year,

            languages:
                "?oklu dil deste?i aktif",

            personalMemory:
                true,

            fileUpload:
                true,

            webResearch:
                true,

            weather:
                true

        });

    }
);

/* =========================================================
WEB ARA?TIRMA API
========================================================= */

app.post(
    "/api/research",
    async function (
        req,
        res
    ) {

        try {

            const query =
                String(
                    req.body &&
                    req.body.query
                        ? req.body.query
                        : ""
                ).trim();

            if (
                !query
            ) {

                return res.status(
                    400
                ).json({

                    ok:
                        false,

                    reply:
                        "Ara?t?r?lacak konu belirtilmedi."

                });
            }

            if (
                query.length >
                500
            ) {

                return res.status(
                    400
                ).json({

                    ok:
                        false,

                    reply:
                        "Ara?t?rma sorgusu ?ok uzun."

                });
            }

            const result =
                await researchWeb(
                    query
                );

            return res.json(
                result
            );

        } catch (
            error
        ) {

            console.error(
                "ARA?TIRMA HATASI:",
                error.message
            );

            return res.status(
                500
            ).json({

                ok:
                    false,

                reply:
                    "?nternet ara?t?rmas? s?ras?nda bir hata olu?tu."

            });
        }

    }
);

/* =========================================================
HAVA DURUMU API
========================================================= */

app.get(
    "/api/weather",
    async function (
        req,
        res
    ) {

        try {

            const location =
                String(
                    req.query &&
                    req.query.location
                        ? req.query.location
                        : ""
                ).trim();

            if (
                !location
            ) {

                return res.status(
                    400
                ).json({

                    ok:
                        false,

                    reply:
                        "?ehir veya konum belirtilmedi."

                });
            }

            const weather =
                await getWeather(
                    location
                );

            if (
                !weather.ok
            ) {

                return res.status(
                    404
                ).json(
                    weather
                );
            }

            return res.json(
                weather
            );

        } catch (
            error
        ) {

            console.error(
                "HAVA DURUMU HATASI:",
                error.message
            );

            return res.status(
                500
            ).json({

                ok:
                    false,

                reply:
                    "Hava durumu bilgisi al?namad?."

            });
        }

  if (!isWeatherQuestion(message)) {

    const research =
        await researchWeb(message);

    if (research && research.ok) {

        researchContext =
            `
[?NTERNET ARA?TIRMASI]

Arama:
${research.query}

?NTERNET ARA?TIRMASI KURALLARI:

- A?a??daki bilgiler internetten al?nm??t?r.
- SADECE a?a??daki ara?t?rma sonu?lar?nda bulunan bilgileri kullan.
- Ara?t?rma sonu?lar?nda olmayan hi?bir bilgiyi tahmin etme veya uydurma.
- G?ncel, bug?nk?, ?u anki, son dakika veya en son bilgi isteniyorsa yaln?zca a?a??daki internet ara?t?rmas?n? esas al.
- Fiyat, tarih, saat, ma?, skor, d?viz kuru, haber ve benzeri g?ncel bilgilerde eski bilgini kullanma veya tahmin yapma.
- Ara?t?rma sonu?lar?nda bilgi yeterince a??k de?ilse bilgi uydurma.
- Bir bilgi kaynaklarda yoksa "Ara?t?rma sonu?lar?nda bu bilgi bulunamad?." de.
- Kaynaklar birbiriyle ?eli?iyorsa bunu a??k?a belirt.
- "Resmi kaynak", "TCMB", "TFF" gibi ifadeleri yaln?zca ara?t?rma metninde ger?ekten b?yle bir kaynak varsa kullan.
- Kullan?c? g?ncel bilgi sordu?unda kendi eski bilgini ara?t?rma sonucunun yerine koyma.
- Cevab?n? m?mk?n oldu?unca ara?t?rma sonu?lar?na dayand?r.

ARA?TIRMA SONU?LARI:
${String(
    research.text || ""
).slice(0, 5000)}
 KAYNAKLAR:
${(research.sources || [])
    .map(
        source =>
            "- " +
            source.title +
            " â€” " +
            source.url
    )
    .join("\n")}
`.trim();


        researchSources =
            research.sources || [];

        researchUsed =
            true;

        console.log(
            "?NTERNET ARA?TIRMASI AKT?F"
        );
    }
}  }
);

/* =========================================================
DOSYA Y?KLEME API
========================================================= */

app.post(
    "/api/upload",
    function (
        req,
        res
    ) {

        try {

            const userId =
                getUserId(
                    req
                );

            const fileName =
                cleanFileName(
                    req.body &&
                    req.body.fileName
                        ? req.body.fileName
                        : ""
                );

            const fileData =
                req.body &&
                req.body.fileData
                    ? String(
                        req.body.fileData
                    )
                    : "";

            if (
                !fileName ||
                !fileData
            ) {

                return res.status(
                    400
                ).json({

                    ok:
                        false,

                    reply:
                        "Dosya bulunamad?."

                });
            }

            if (
                !isAllowedFile(
                    fileName
                )
            ) {

                return res.status(
                    400
                ).json({

                    ok:
                        false,

                    reply:
                        "Bu dosya t?r?ne izin verilmiyor."

                });
            }

            let base64Data =
                fileData;

            if (
                base64Data.includes(
                    ","
                )
            ) {

                base64Data =
                    base64Data.split(
                        ","
                    )[1];

            }

            let buffer;

            try {

                buffer =
                    Buffer.from(
                        base64Data,
                        "base64"
                    );

            } catch (error) {

                return res.status(
                    400
                ).json({

                    ok:
                        false,

                    reply:
                        "Dosya verisi ge?ersiz."

                });
            }

            if (
                !buffer ||
                !buffer.length
            ) {

                return res.status(
                    400
                ).json({

                    ok:
                        false,

                    reply:
                        "Dosya bo? veya ge?ersiz."

                });
            }

            if (
                buffer.length >
                MAX_FILE_SIZE
            ) {

                return res.status(
                    400
                ).json({

                    ok:
                        false,

                    reply:
                        "Dosya ?ok b?y?k. Maksimum dosya boyutu 10 MB."

                });
            }

            const time =
                Date.now();

            const random =
                Math.random()
                    .toString(36)
                    .slice(
                        2,
                        10
                    );

            const extension =
                path.extname(
                    fileName
                );

            const baseName =
                path.basename(
                    fileName,
                    extension
                );

            const safeBaseName =
                cleanFileName(
                    baseName
                );

            const finalFileName =
                userId +
                "_" +
                time +
                "_" +
                random +
                "_" +
                safeBaseName +
                extension;

            const filePath =
                path.join(
                    UPLOADS_DIR,
                    finalFileName
                );

            fs.writeFileSync(
                filePath,
                buffer
            );

            console.log(
                "DOSYA Y?KLEND?:",
                fileName
            );

            console.log(
                "USER ID:",
                userId
            );

            console.log(
                "DOSYA BOYUTU:",
                buffer.length,
                "byte"
            );

            return res.json({

                ok:
                    true,

                file:
                    fileName,

                savedFile:
                    finalFileName,

                size:
                    buffer.length,

                userId:
                    userId,

                message:
                    "Dosya ba?ar?yla y?klendi."

            });

        } catch (
            error
        ) {

            console.error(
                "DOSYA Y?KLEME HATASI:",
                error.message
            );

            return res.status(
                500
            ).json({

                ok:
                    false,

                reply:
                    "Dosya y?klenirken bir hata olu?tu."

            });

        }

    }
);

/* =========================================================
CHAT API
========================================================= */

app.post(
    "/api/chat",
    async function (
        req,
        res
    ) {

        const startTime =
            Date.now();

        try {

            const userId =
                getUserId(
                    req
                );

            let message =
                String(
                    req.body &&
                    req.body.message
                        ? req.body.message
                        : ""
                ).trim();

            if (
                !message
            ) {

                return res.status(
                    400
                ).json({

                    ok:
                        false,

                    reply:
                        "L?tfen bir mesaj yaz."

                });
            }

            if (
                message.length >
                MAX_MESSAGE_LENGTH
            ) {

                return res.status(
                    400
                ).json({

                    ok:
                        false,

                    reply:
                        "Mesaj ?ok uzun. L?tfen daha k?sa bir mesaj g?nder."

                });
            }

            if (
                !GROQ_API_KEY
            ) {

                console.error(
                    "GROQ API KEY BULUNAMADI."
                );

                return res.status(
                    500
                ).json({

                    ok:
                        false,

                    reply:
                        "Groq API anahtar? bulunamad?."

                });
            }

            console.log("");
            console.log(
                "================================="
            );

            console.log(
                "YEN? MESAJ"
            );

            console.log(
                "KULLANICI:",
                message
            );

            console.log(
                "USER ID:",
                userId
            );

            const dateInfo =
                getCurrentDateInfo();

            console.log(
                "T?RK?YE TAR?H?:",
                dateInfo.turkey
            );

            /* -----------------------------------------
            KULLANICI HAFIZASI
            ----------------------------------------- */

            addUserMemory(
                userId,
                "user",
                message
            );

            const userMemory =
                getUserMemory(
                    userId
                );

            /* -----------------------------------------
            ?S?M S?STEM?
            ----------------------------------------- */

            const newName =
                findUserName(
                    message
                );

            const askingName =
                /(?:benim\s+ad?m|benim\s+ismim|ismim|ad?m)\s+ne(?:ydi)?/i.test(
                    message
                );

            if (
                newName &&
                !askingName
            ) {

                const reply =
                    "Tamam, ad?n? " +
                    newName +
                    " olarak hat?rlayaca??m.";

                addUserMemory(
                    userId,
                    "assistant",
                    reply
                );

                return res.json({

                    ok:
                        true,

                    reply:
                        reply,

                    timeMs:
                        Date.now() -
                        startTime,

                    userMemory:
                        true

                });
            }

            if (
                askingName
            ) {

                const userName =
                    getUserName(
                        userId
                    );

                if (
                    userName
                ) {

                    const reply =
                        "Senin ad?n " +
                        userName +
                        ".";

                    addUserMemory(
                        userId,
                        "assistant",
                        reply
                    );

                    return res.json({

                        ok:
                            true,

                        reply:
                            reply,

                        timeMs:
                            Date.now() -
                            startTime,

                        userMemory:
                            true

                    });
                }
            }

            /* -----------------------------------------
            BA?LAM
            ----------------------------------------- */

        let recentMessages = [];

const shortMessage =
    message.trim().toLowerCase();

const isCasualMessage =
    /^(slm|selam|merhaba|mrb|sa|hey|nas[ i]ls[ i]n|iyi misin|naber|nbr|te ekk rler|tesekkurler|sa ol|sagol)$/i.test(
        shortMessage
    );

if (!isCasualMessage) {

    recentMessages =
        userMemory
            .slice(
                -2
            );

}
        const cleanRecentMessages =
    recentMessages.filter(
        item =>
            !(
                item &&
                item.role === "assistant" &&
                typeof item.content === "string" &&
                (
                    item.content.includes(
                        "[ NTERNET ARA TIRMASI]"
                    ) ||
                    item.content.includes(
                        "27.80"
                    ) ||
                    item.content.includes(
                        "27.88"
                    )
                )
            )
    );
          
            /* -----------------------------------------
            ARA?TIRMA
            ----------------------------------------- */

            let researchContext =
                "";

            let researchSources =
                [];

            let researchUsed =
                false;

            const researchNeeded =
                shouldResearch(
                    message
                );
               if (
    researchNeeded
) {

    try {

        /*
            Hava durumu ?zel olarak
            Open-Meteo ?zerinden al?n?r.
        */

        if (
            isWeatherQuestion(
                message
            )
        ) {

            let location =
                extractWeatherLocation(
                    message
                );

            if (
                !location
            ) {

                location =
                    "Konya";
            }

            const weather =
                await getWeather(
                    location
                );

            if (
                weather &&
                weather.ok
            ) {

                researchContext =
                    `
[?NTERNET ARA?TIRMASI]

Hava durumu:
${JSON.stringify(
    weather
)}
`.trim();

                researchUsed =
                    true;

                console.log(
                    "HAVA DURUMU ARA?TIRMASI AKT?F"
                );
            }

        } else {

            /*
                Normal internet ara?t?rmas?
            */

            const research =
                await researchWeb(
                    message
                );

            if (
                research &&
                research.ok
            ) {

                researchContext =
                    `
[?NTERNET ARA?TIRMASI]

Arama:
${research.query}

Sonu?lar:
${String(
    research.text || ""
).slice(
    0,
    5000
)}
`.trim();

                researchSources =
                    research.sources ||
                    [];

                researchUsed =
                    true;

                console.log(
                    "?NTERNET ARA?TIRMASI AKT?F"
                );
            }
        }

    } catch (
        researchError
    ) {

        console.error(
            "ARA?TIRMA HATASI:",
            researchError.message
        );

        /*
            Ara?t?rma ba?ar?s?z olursa
            normal AI cevab? ?al??maya devam eder.
        */
    }
}
            /* -----------------------------------------
            GROQ MESAJLARI
            ----------------------------------------- */

            const messages = [
                

                {

                    role:
                        "system",

                    content:
                        `Sen TÃ¼rkAI'sÄ±n. KullanÄ±cÄ±yla doÄŸal ve kÄ±sa konuÅŸ. KullanÄ±cÄ±nÄ±n dilinde cevap ver. GÃ¼ncel bilgi gerekiyorsa araÅŸtÄ±rma sonucunu kullan. Gereksiz aÃ§Ä±klama yapma. Kod sorularÄ±nda mevcut kodu koru ve sadece gerekli deÄŸiÅŸikliÄŸi Ã¶ner.`

                },

                {

                    role:
                        "system",

                    content:
                        `
G?NCEL TAR?H VE ZAMAN B?LG?S?:

T?rkiye tarihi ve saati:
${dateInfo.turkey}

ISO zaman:
${dateInfo.iso}

Y?l:
${dateInfo.year}

Bu bilgi mevcut zaman bilgisidir.

Tarih sorular?nda bu bilgiyi kullan.

Ancak bu bilgi internet eri?imi sa?lamaz.

KULLANICI D?L?:

Kullan?c?n?n son mesaj?ndaki dili belirle.
M?mk?nse cevab? ayn? dilde ver.
Kullan?c? a??k?a ba?ka bir dil isterse o dile ge?.

KULLANICI HAFIZASI:

Bu konu?ma yaln?zca USER ID:
${userId}

i?in ge?erlidir.

Bu kullan?c?n?n haf?zas?n? ba?ka kullan?c?lar?n
haf?zas?yla kar??t?rma.

Bu kullan?c?ya ait ge?mi? mesajlar? ba?lam olarak
kullanabilirsin.
`.trim()

                }

            ];

            /* -----------------------------------------
            ARA?TIRMA SONU?LARINI AI'A VER
            ----------------------------------------- */

            if (
                researchContext
            ) {

                messages.push({

                    role:
                        "system",

                    content:
                        researchContext

                });

                messages.push({

                    role:
                        "system",

                    content:
                        `
ARA?TIRMA KURALI:

Yukar?daki ara?t?rma bilgileri g?ncel bilgi
gereken soruya yard?mc? olmak i?in al?nm??t?r.

Cevab?n? bu bilgilerle olu?tur.

Ara?t?rma sonucunda bulunmayan bilgileri uydurma.

Kullan?c? kaynak isterse kaynaklar? belirt.

Gereksiz yere "internette ara?t?rd?m" deme.

Hava durumu verisi varsa mevcut hava verisini
kullan.
`.trim()

                });
            }

            /* -----------------------------------------
            GE?M?? MESAJLAR
            ----------------------------------------- */
            /* -----------------------------------------
G NCEL ARA TIRMA  NCEL   
----------------------------------------- */

if (researchContext) {

    messages.push({

        role:
            "system",

        content:
            `
 OK  NEML :

G ncel internet ara t rmas  mevcut.

Ara t rma sonucu ile ge mi  mesajlar
aras nda farkl l k varsa HER ZAMAN
G NCEL ARA TIRMA SONUCUNU kullan.

Ge mi  konu malardaki eski fiyat,
kur, tarih, saat, skor veya ba ka
g ncel verileri kullanma.

Ara t rma sonucunda a  k a verilen
rakamlar  de i tirme.

 zellikle d viz kurlar nda ara t rma
sonucundaki TCMB de erlerini aynen kullan.
`.trim()

    });

}
            for (const item of cleanRecentMessages.slice(-USER_CONTEXT_MESSAGES)) {

                if (
                    !item ||
                    !item.content ||
                    typeof item.content !==
                    "string"
                ) {

                    continue;
                }
                   /* Eski internet ara t rma cevaplar n 
   tekrar AI'a g nderme */

if (
    item.role === "assistant" &&
    (
        item.content.includes(
            "[ NTERNET ARA TIRMASI]"
        ) ||
        item.content.includes(
            "27.80"
        ) ||
        item.content.includes(
            "27.88"
        )
    )
) {

    continue;
}
                messages.push({

                    role:
                        item.role ===
                        "assistant"
                            ? "assistant"
                            : "user",

                    content:
                        String(
                            item.content
                        )

                });
            }

            console.log(
                "KULLANICI HAFIZASI:",
                recentMessages.length +
                " mesaj"
            );

            console.log(
                "ARA?TIRMA:",
                researchUsed
                    ? "AKT?F"
                    : "GEREKM?YOR"
            );
            console.log(
    "ARAŞTIRMA SONUCU GROQ'A GİDİYOR:",
    researchContext
);

 if (researchContext) {
    messages.push({
        role: "system",
        content: `ÖNEMLİ: AŞAĞIDAKİ METİN GÜNCEL İNTERNET ARAŞTIRMASI SONUCUDUR.

${researchContext}

ARAŞTIRMA KURALLARI:

1. Cevabını öncelikle yukarıdaki araştırma metnine dayanarak ver.
2. Araştırma metninde açıkça bulunmayan hiçbir sayı, fiyat, kur, tarih, saat, istatistik veya olay bilgisini uydurma.
3. Araştırma metninde bir bilgi bulunmuyorsa, bunu varmış gibi gösterme.
4. Bir kaynağın adı araştırma metninde gerçekten geçmiyorsa o kaynağın adını kullanma.
5. Bloomberg, Reuters, TCMB, MGM veya başka bir kurumdan alınmış gibi bilgi uydurma.
6. Araştırma metnindeki kaynaklar birbiriyle çelişiyorsa bunu açıkça belirt.
7. Güncel bilgi sorusunda eski model bilgini kullanarak araştırma sonucunu değiştirme.
8. Emin olmadığın güncel bir bilgiyi tahmin etme.
9. Araştırma sonucu soruyu cevaplamak için yeterliyse kısa ve doğrudan cevap ver.
10. Kaynakta belirli bir değer varsa o değeri değiştirme.

ÖZELLİKLE:
Araştırma metninde bulunan güncel değerleri aynen kullan.
Araştırma metninde bulunmayan kesin rakamları veya kaynakları kendin oluşturma.`
    });
}
console.log("GROQ MESSAGES:", JSON.stringify(messages, null, 2));
            console.log(
                "GROQ ?STE?? G?NDER?L?YOR..."
            );

            /* -----------------------------------------
            GROQ
            ----------------------------------------- */

      
            const data = await requestGroq(messages);

            /* -----------------------------------------
            CEVAP
            ----------------------------------------- */

            let reply =
                "";

            if (
                data &&
                Array.isArray(
                    data.choices
                ) &&
                data.choices.length >
                0
            ) {

                const choice =
                    data.choices[0];

                if (
                    choice &&
                    choice.message &&
                    typeof choice.message.content ===
                    "string"
                ) {

                    reply =
                        choice.message.content.trim();

                }
            }

            /* -----------------------------------------
            CEVAP TEM?ZLE
            ----------------------------------------- */

            reply =
                cleanReply(
                    reply
                );
console.log(
    "BÄ°LGÄ° HAFIZASI TEST:",
    saveKnowledgeItem(
        message,
        reply
    )
);
            if (
                !reply
            ) {

                console.error(
                    "BO? GROQ CEVABI"
                );

                return res.status(
                    500
                ).json({

                    ok:
                        false,

                    reply:
                        "TÃ¼rkAI boÅŸ cevap verdi. LÃ¼tfen tekrar dene."

                });
            }

            /* -----------------------------------------
            B?LM?YORSA OTOMAT?K ARA?TIR
            ----------------------------------------- */

            const uncertainAnswer =
                /bilmiyorum|emin de?ilim|emin de?ilim|kesin olarak bilmiyorum|yeterli bilgim yok|do?rulayam?yorum|bilgi sahibi de?ilim|bunu bilmiyorum/i.test(
                    reply
                );

            if (
                uncertainAnswer &&
                !researchUsed
            ) {

                console.log(
                    "AI B?LG?S? YETERS?Z."
                );

                console.log(
                    "OTOMAT?K ?K?NC? ARA?TIRMA BA?LATILIYOR..."
                );

                try {

                    const secondResearch =
                        await researchWeb(
                            message
                        );

                    if (
                        secondResearch &&
                        secondResearch.ok
                    ) {

                        const secondMessages =
                            [
                                ...messages,

                                {

                                    role:
                                        "system",

                                    content:
                                        `
?LK CEVABINDA YETERL? B?LG? OLMADI.

?imdi internet ara?t?rmas? sonucu a?a??dad?r:

${secondResearch.text}

Kullan?c?n?n sorusunu ara?t?rma
sonu?lar?na g?re yeniden cevapla.

Ara?t?rma sonucunda bulunmayan
bilgileri uydurma.

K?sa, do?al ve do?ru cevap ver.
`.trim()

                                }
                            ];

                        const secondData =
                        await requestAI(
                          secondMessages
                       );            
                        let secondReply =
                            "";

                        if (
                            secondData &&
                            Array.isArray(
                                secondData.choices
                            ) &&
                            secondData.choices.length
                        ) {

                            const secondChoice =
                                secondData.choices[0];

                            if (
                                secondChoice &&
                                secondChoice.message &&
                                typeof secondChoice.message.content ===
                                "string"
                            ) {

                                secondReply =
                                    secondChoice
                                        .message
                                        .content
                                        .trim();
                            }
                        }

                        secondReply =
                            cleanReply(
                                secondReply
                            );

                        if (
                            secondReply
                        ) {

                            reply =
                                secondReply;

                            researchUsed =
                                true;

                            researchSources =
                                secondResearch.sources ||
                                [];

                            console.log(
                                "?K?NC? ARA?TIRMA SONRASI CEVAP OLU?TURULDU."
                            );
                        }
                    }

                } catch (
                    secondResearchError
                ) {

                    console.error(
                        "?K?NC? ARA?TIRMA HATASI:",
                        secondResearchError.message
                    );
                }
            }

            /* -----------------------------------------
            KULLANICI HAFIZASINA AI CEVABI
            ----------------------------------------- */

            addUserMemory(
                userId,
                "assistant",
                reply
            );

            /* -----------------------------------------
            ESK? HAFIZAYA DA KAYDET
            ----------------------------------------- */

            addMemory(
                "user",
                message
            );

            addMemory(
                "assistant",
                reply
            );

            /* -----------------------------------------
            S?RE
            ----------------------------------------- */

            const elapsed =
                Date.now() -
                startTime;

            console.log(
                "ERENCANAI:",
                reply
            );

            console.log(
                "CEVAP S?RES?:",
                elapsed +
                " ms"
            );

            console.log(
                "================================="
            );

            /* -----------------------------------------
            CEVAP
            ----------------------------------------- */

            return res.json({

                ok:
                    true,

                reply:
                    reply,

                timeMs:
                    elapsed,

                model:
                    GROQ_MODEL,

                currentDate:
                    dateInfo.turkey,

                userMemory:
                    true,

                userId:
                    userId,

                researchUsed:
                    researchUsed,

                sources:
                    researchSources

            });

        } catch (
            error
        ) {

            const elapsed =
                Date.now() -
                startTime;

            console.error("");
            console.error(
                "================================="
            );

            console.error(
                "TÃ¼rkAI HATASI"
            );

            console.error(
                error.message
            );

            if (
                error.status
            ) {

                console.error(
                    "HTTP DURUMU:",
                    error.status
                );
            }

            console.error(
                "================================="
            );

            let userMessage =
                "Sunucu ba?lant? hatas?.";

            if (
                error.name ===
                "AbortError"
            ) {

                userMessage =
                    "AI yan?t? zaman a??m?na u?rad?. Tekrar dene.";

            } else if (
                error.message &&
                error.message
                    .toLowerCase()
                    .includes("fetch")
            ) {

                userMessage =
                    "Groq ba?lant?s? kurulamad?. Sunucu ba?lant?s?n? kontrol et.";

            } else if (
                error.status ===
                401 ||
                error.status ===
                403
            ) {

                userMessage =
                    "Groq API anahtar? ge?ersiz veya yetkisiz.";

            } else if (
                error.status ===
                400
            ) {

                userMessage =
                    "Groq iste?i ge?ersiz. Model veya API ayarlar?n? kontrol et.";

            } else if (
                error.status ===
                429
            ) {

                userMessage =
                    "Groq kullan?m s?n?r?na ula??ld?. Biraz sonra tekrar dene.";

            } else if (
                error.status &&
                error.status >=
                500
            ) {

                userMessage =
                    "Groq sunucusunda ge?ici bir hata olu?tu.";
            }

            return res.status(
                500
            ).json({

                ok:
                    false,

                reply:
                    userMessage,

                timeMs:
                    elapsed

            });
        }

    }
);

/* =========================================================
ESK? HAFIZA API
========================================================= */

app.get(
    "/api/memory",
    function (
        req,
        res
    ) {

        return res.json({

            ok:
                true,

            count:
                memory.length,

            messages:
                memory

        });

    }
);

/* =========================================================
KULLANICI HAFIZASI API
========================================================= */

app.get(
    "/api/user-memory",
    function (
        req,
        res
    ) {

        const userId =
            getUserId(
                req
            );

        const userMemory =
            getUserMemory(
                userId
            );

        return res.json({

            ok:
                true,

            userMemory:
                true,

            count:
                userMemory.length,

            messages:
                userMemory

        });

    }
);

/* =========================================================
KULLANICI HAFIZASI TEM?ZLE
========================================================= */

app.post(
    "/api/clear-user-memory",
    function (
        req,
        res
    ) {

        const userId =
            getUserId(
                req
            );

        userMemories[userId] =
            [];

        const saved =
            saveUserMemories();

        return res.json({

            ok:
                saved,

            userMemory:
                true,

            message:
                saved
                    ? "Bu kullan?c?n?n TÃ¼rkAI haf?zas? temizlendi."
                    : "Kullan?c? haf?zas? temizlenemedi."

        });

    }
);

/* =========================================================
ESK? HAFIZA TEM?ZLE
========================================================= */

app.post(
    "/api/clear-memory",
    function (
        req,
        res
    ) {

        memory =
            [];

        const saved =
            saveMemory();

        return res.json({

            ok:
                saved,

            message:
                saved
                    ? "TÃ¼rkAI haf?zas? temizlendi."
                    : "Haf?za temizlenemedi."

        });

    }
);

/* =========================================================
SA?LIK
========================================================= */

app.get(
    "/api/health",
    function (
        req,
        res
    ) {

        const dateInfo =
            getCurrentDateInfo();

        return res.json({

            ok:
                true,

            service:
                "TÃ¼rkAI",

            ai:
                "Groq",

            model:
                GROQ_MODEL,

            memory:
                memory.length,

            users:
                Object.keys(
                    userMemories
                ).length,

            currentDate:
                dateInfo.turkey,

            uptime:
                Math.floor(
                    process.uptime()
                ),

            multilingual:
                true,

            personalMemory:
                true,

            fileUpload:
                true,

            webResearch:
                true,

            weather:
                true

        });

    }
);

/* =========================================================
404
========================================================= */

app.use(
    function (
        req,
        res
    ) {

        return res.status(
            404
        ).json({

            ok:
                false,

            error:
                "Bu TÃ¼rkAI API adresi bulunamad?."

        });

    }
);

/* =========================================================
GENEL HATA YAKALAYICI
========================================================= */

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        console.error(
            "EXPRESS GENEL HATA:",
            error.message
        );

        if (
            res.headersSent
        ) {

            return next(
                error
            );
        }

        return res.status(
            500
        ).json({

            ok:
                false,

            reply:
                "Sunucuda beklenmeyen bir hata olu?tu."

        });

    }
);

/* =========================================================
SUNUCU
========================================================= */

app.listen(
    PORT,
    "0.0.0.0",
    function () {

        const dateInfo =
            getCurrentDateInfo();

        console.log(
            "================================="
        );

        console.log(
            "          ERENCANAI"
        );

        console.log(
            "================================="
        );

        console.log(
            "Web: http://localhost:" +
            PORT
        );

        console.log(
            "API: /api/chat"
        );

        console.log(
            "UPLOAD: /api/upload"
        );

        console.log(
            "RESEARCH: /api/research"
        );

        console.log(
            "WEATHER: /api/weather"
        );

        console.log(
            "TEST: /api/test"
        );

        console.log(
            "HEALTH: /api/health"
        );

        console.log(
            "USER MEMORY: /api/user-memory"
        );

        console.log(
            "AI: Groq"
        );

        console.log(
            "MODEL:",
            GROQ_MODEL
        );

        console.log(
            "ESK? HAFIZA:",
            memory.length +
            " mesaj"
        );

        console.log(
            "KULLANICI SAYISI:",
            Object.keys(
                userMemories
            ).length
        );

        console.log(
            "API KEY:",
            GROQ_API_KEY
                ? "BULUNDU"
                : "BULUNAMADI"
        );

        console.log(
            "?OKLU D?L:",
            "AKT?F"
        );

        console.log(
            "KULLANICIYA ?ZEL HAFIZA:",
            "AKT?F"
        );

        console.log(
            "DOSYA Y?KLEME:",
            "AKT?F"
        );

        console.log(
            "MAKS?MUM DOSYA:",
            "10 MB"
        );

        console.log(
            "?NTERNET ARA?TIRMASI:",
            "AKT?F"
        );

        console.log(
            "HAVA DURUMU:",
            "AKT?F"
        );

        console.log(
            "OTOMAT?K B?LM?YORSA ARA?TIR:",
            "AKT?F"
        );

        console.log(
            "T?RK?YE TAR?H?:",
            dateInfo.turkey
        );

        console.log(
            "================================="
        );

    }
);














