"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// GROQ API YAPILANDIRMASI
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const MEMORY_FILE = path.join(__dirname, "memory.json");
const CONTEXT_MESSAGES = 20;

// ======================================================
// SİSTEM PROMPT
// ======================================================

const SYSTEM_PROMPT = [
    "Sen ErencanAI adlı bir yapay zeka asistanısın.",
    "",
    "DİL:",
    "- Her zaman öncelikle Türkçe konuş.",
    "- Kullanıcı Türkçe konuşuyorsa Türkçe cevap ver.",
    "- Kullanıcı başka bir dil istemedikçe başka dil kullanma.",
    "",
    "DAVRANIŞ:",
    "- Doğal ve anlaşılır cevaplar ver.",
    "- Kullanıcının sorusuna doğrudan cevap ver.",
    "- Kısa sorulara kısa ve net cevaplar ver.",
    "- Gereksiz yere kendini tanıtma.",
    "- Bilmediğin bilgileri uydurma.",
    "- Önceki mesajları dikkate al.",
    "",
    "MATEMATİK:",
    "- Basit matematik işlemlerini dikkatlice hesapla.",
    "- 2 + 2 = 4.",
    "- 3 + 2 = 5.",
    "- Kullanıcı doğru bir matematik sonucu söylediğinde ona itiraz etme.",
    "",
    "KULLANICI ADI:",
    "- Kullanıcı Benim adım X derse kullanıcının adı X'tir.",
    "- Kullanıcı Benim adım ne derse kayıtlı en son kullanıcı adını söyle.",
    "- Kullanıcı yeni bir isim söylerse en yeni ismi kullan.",
    "",
    "KİMLİK:",
    "- Senin adın ErencanAI.",
    "- Kullanıcı senin adını sorarsa ErencanAI de."
].join("\n");

// ======================================================
// HAFIZA
// ======================================================

function loadMemory() {
    try {
        if (!fs.existsSync(MEMORY_FILE)) {
            fs.writeFileSync(
                MEMORY_FILE,
                "[]",
                "utf8"
            );

            return [];
        }

        const file = fs.readFileSync(
            MEMORY_FILE,
            "utf8"
        );

        if (!file.trim()) {
            return [];
        }

        const data = JSON.parse(file);

        if (!Array.isArray(data)) {
            return [];
        }

        return data;

    } catch (error) {
        console.error(
            "HAFIZA OKUMA HATASI:",
            error.message
        );

        return [];
    }
}

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

function addMemory(role, content) {
    memory.push({
        role: role,
        content: content,
        time: new Date().toISOString()
    });

    saveMemory();
}

const memory = loadMemory();

// ======================================================
// KULLANICI ADI
// ======================================================

function findUserName(text) {
    const match = text.match(
        /benim\s+ad[ıi]m\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)/i
    );

    if (match) {
        return match[1];
    }

    return null;
}

function getLastUserName() {
    for (
        let i = memory.length - 1;
        i >= 0;
        i--
    ) {
        if (memory[i].role !== "user") {
            continue;
        }

        const name = findUserName(
            memory[i].content
        );

        if (name) {
            return name;
        }
    }

    return null;
}

// ======================================================
// EXPRESS
// ======================================================

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.static(__dirname)
);

// ======================================================
// ANA SAYFA
// ======================================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );
});

// ======================================================
// GROQ TEST
// ======================================================

app.get(
    "/api/test",
    async (req, res) => {
        res.json({
            ok: true,
            groqConfigured: !!GROQ_API_KEY,
            model: GROQ_MODEL,
            memoryMessages: memory.length
        });
    }
);

// ======================================================
// CHAT
// ======================================================

app.post(
    "/api/chat",
    async (req, res) => {

        try {

            const message = String(
                req.body?.message || ""
            ).trim();

            if (!message) {

                return res.status(400).json({
                    ok: false,
                    reply:
                        "Lütfen bir mesaj yaz."
                });
            }

            if (!GROQ_API_KEY) {

                return res.status(500).json({
                    ok: false,
                    reply:
                        "GROQ_API_KEY anahtarı bulunamadı. Lütfen Render ortam değişkenlerini kontrol edin."
                });
            }

            console.log(
                "KULLANICI:",
                message
            );

            // Kullanıcı mesajını kaydet
            addMemory(
                "user",
                message
            );

            // ==================================================
            // İSİM KAYDETME
            // ==================================================

            const newName =
                findUserName(message);

            if (newName) {

                const reply =
                    "Tamam, adını " +
                    newName +
                    " olarak hatırlayacağım.";

                addMemory(
                    "assistant",
                    reply
                );

                console.log(
                    "ERENCANAI:",
                    reply
                );

                return res.json({
                    ok: true,
                    reply: reply
                });
            }

            // ==================================================
            // İSİM SORUSU
            // ==================================================

            if (
                /benim\s+ad[ıi]m\s+ne/i.test(message) ||
                /ad[ıi]m\s+neydi/i.test(message) ||
                /ismim\s+ne/i.test(message)
            ) {

                const userName =
                    getLastUserName();

                if (userName) {

                    const reply =
                        "Senin adın " +
                        userName +
                        ".";

                    addMemory(
                        "assistant",
                        reply
                    );

                    console.log(
                        "ERENCANAI:",
                        reply
                    );

                    return res.json({
                        ok: true,
                        reply: reply
                    });
                }
            }

            // ==================================================
            // MODELE GÖNDERİLECEK HAFIZA
            // ==================================================

            const recentMessages =
                memory.slice(
                    -CONTEXT_MESSAGES
                );

            const messages = [
                {
                    role: "system",
                    content:
                        SYSTEM_PROMPT
                }
            ];

            for (
                const item
                of recentMessages
            ) {

                messages.push({
                    role: item.role,
                    content: item.content
                });
            }

            // ==================================================
            // GROQ API İSTEĞİ
            // ==================================================

            const response =
                await fetch(
                    GROQ_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                            "Authorization":
                                `Bearer ${GROQ_API_KEY}`
                        },

                        body:
                            JSON.stringify({
                                model:
                                    GROQ_MODEL,

                                messages:
                                    messages,

                                temperature:
                                    0.1
                            })
                    }
                );

            const data =
                await response.json();

            // ==================================================
            // GROQ HATASI
            // ==================================================

            if (!response.ok) {

                console.error(
                    "GROQ HATASI:",
                    data
                );

                return res.status(500).json({
                    ok: false,
                    reply:
                        "Groq API hatası: " +
                        (
                            data.error?.message ||
                            "Bilinmeyen hata"
                        )
                });
            }

            // ==================================================
            // CEVAP
            // ==================================================

            const reply =
                String(
                    data.choices?.[0]?.message?.content ||
                    ""
                ).trim();

            if (!reply) {

                return res.status(500).json({
                    ok: false,
                    reply:
                        "ErencanAI cevap veremedi."
                });
            }

            // AI cevabını da kaydet
            addMemory(
                "assistant",
                reply
            );

            console.log(
                "ERENCANAI:",
                reply
            );

            res.json({
                ok: true,
                reply: reply
            });

        } catch (error) {

            console.error(
                "ERENCANAI HATASI:",
                error
            );

            res.status(500).json({
                ok: false,
                reply:
                    "Bağlantı hatası: " +
                    error.message
            });
        }
    }
);

// ======================================================
// HAFIZAYI GÖSTER
// ======================================================

app.get(
    "/api/memory",
    (req, res) => {

        res.json({
            ok: true,
            count:
                memory.length,
            messages:
                memory
        });
    }
);

// ======================================================
// HAFIZAYI TEMİZLE
// ======================================================

app.post(
    "/api/clear-memory",
    (req, res) => {

        memory.length = 0;

        saveMemory();

        res.json({
            ok: true,
            message:
                "ErencanAI hafızası temizlendi."
        });
    }
);

// ======================================================
// BULUNAMAYAN API
// ======================================================

app.use(
    (req, res) => {

        res.status(404).json({
            ok: false,
            error:
                "Bu ErencanAI API adresi bulunamadı."
        });
    }
);

// ======================================================
// SUNUCU
// ======================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "================================="
        );

        console.log(
            "     ERENCANAI 7.0 (GROQ)"
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
            "TEST: /api/test"
        );

        console.log(
            "MEMORY: /api/memory"
        );

        console.log(
            "AI: Groq " +
            GROQ_MODEL
        );

        console.log(
            "KALICI HAFIZA: " +
            memory.length +
            " mesaj"
        );

        console.log(
            "================================="
        );
    }
);
