"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;

const GROQ_API_KEY =
    process.env.GROQ_API_KEY ||
    process.env.GR0Q_API_KEY;

const GROQ_URL =
    "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL =
    "openai/gpt-oss-20b";

const MEMORY_FILE =
    path.join(__dirname, "memory.json");

const MAX_MEMORY_MESSAGES = 300;
const CONTEXT_MESSAGES = 10;

const SYSTEM_PROMPT = [
    "Sen ErencanAI adlı yapay zeka asistanısın.",
    "Türkçe konuş.",
    "Kullanıcının sorusuna doğrudan cevap ver.",
    "Gereksiz uzun cevap verme.",
    "Basit sorulara kısa ve doğal cevap ver.",
    "Bilmediğin bilgileri uydurma.",
    "Önceki mesajları dikkate al.",
    "Normal konuşma şeklinde cevap ver.",
    "JSON biçiminde cevap verme.",
    "Cevabının başına veya sonuna teknik bilgi ekleme.",
    "Sadece kullanıcıya verilecek doğal cevabı üret."
].join("\n");

let memory = [];


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

        const content =
            fs.readFileSync(
                MEMORY_FILE,
                "utf8"
            );

        if (!content.trim()) {
            return [];
        }

        const data =
            JSON.parse(content);

        if (Array.isArray(data)) {
            return data;
        }

        return [];

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
        content: String(content),
        time: new Date().toISOString()
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


function findUserName(text) {
    const match =
        String(text).match(
            /(?:benim\s+adım|benim\s+ismim|adım)\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)/i
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
        const item = memory[i];

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

        if (name) {
            return name;
        }
    }

    return null;
}


function cleanReply(text) {
    let reply =
        String(text || "").trim();

    if (!reply) {
        return "";
    }

    // Model yanlışlıkla JSON döndürürse
    try {
        const parsed =
            JSON.parse(reply);

        if (
            parsed &&
            typeof parsed.reply === "string"
        ) {
            reply =
                parsed.reply.trim();
        }
    } catch (error) {
        // Normal metinse hiçbir şey yapma.
    }

    // Gereksiz Markdown JSON çitlerini temizle
    reply =
        reply
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

    return reply;
}


memory = loadMemory();


app.use(
    express.json({
        limit: "2mb"
    })
);


app.use(
    express.static(__dirname)
);


app.get(
    "/",
    function (req, res) {
        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );
    }
);


app.get(
    "/api/test",
    function (req, res) {

        return res.json({
            ok: true,
            server: true,
            ai: "Groq",
            model: GROQ_MODEL,
            apiKey:
                GROQ_API_KEY
                    ? "BULUNDU"
                    : "BULUNAMADI",
            memoryMessages:
                memory.length,
            endpoint:
                "/api/chat"
        });
    }
);


app.post(
    "/api/chat",
    async function (req, res) {

        try {

            const message =
                String(
                    req.body &&
                    req.body.message
                        ? req.body.message
                        : ""
                ).trim();


            if (!message) {

                return res.status(400).json({
                    ok: false,
                    reply:
                        "Lütfen bir mesaj yaz."
                });
            }


            if (!GROQ_API_KEY) {

                console.error(
                    "GROQ API KEY BULUNAMADI."
                );

                return res.status(500).json({
                    ok: false,
                    reply:
                        "Groq API anahtarı bulunamadı."
                });
            }


            console.log("");
            console.log(
                "KULLANICI:",
                message
            );

            addMemory(
                "user",
                message
            );


            const newName =
                findUserName(message);


            const askingName =
                /benim\s+adım\s+ne/i.test(message) ||
                /adım\s+neydi/i.test(message) ||
                /ismim\s+ne/i.test(message);


            if (
                newName &&
                !askingName
            ) {

                const reply =
                    "Tamam, adını " +
                    newName +
                    " olarak hatırlayacağım.";

                addMemory(
                    "assistant",
                    reply
                );

                return res.json({
                    ok: true,
                    reply: reply,
                    timeMs: 0
                });
            }


            if (askingName) {

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

                    return res.json({
                        ok: true,
                        reply: reply,
                        timeMs: 0
                    });
                }
            }


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
                const item of recentMessages
            ) {

                if (
                    !item ||
                    !item.content
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


            const startTime =
                Date.now();


            console.log(
                "GROQ İSTEĞİ GÖNDERİLİYOR..."
            );


            const response =
                await fetch(
                    GROQ_URL,
                    {
                        method: "POST",

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
                                    0.3,

                                max_tokens:
                                    300,

                                stream:
                                    false
                            })
                    }
                );


            const responseText =
                await response.text();


            if (!response.ok) {

                console.error(
                    "GROQ HTTP HATASI:",
                    response.status
                );

                console.error(
                    responseText
                );

                return res.status(
                    500
                ).json({
                    ok: false,
                    reply:
                        "Groq hatası: " +
                        response.status
                });
            }


            let data;

            try {

                data =
                    JSON.parse(
                        responseText
                    );

            } catch (error) {

                console.error(
                    "GROQ JSON HATASI:",
                    responseText
                );

                return res.status(
                    500
                ).json({
                    ok: false,
                    reply:
                        "Groq geçerli bir cevap göndermedi."
                });
            }


            let reply = "";


            if (
                data &&
                data.choices &&
                data.choices[0] &&
                data.choices[0].message
            ) {

                const content =
                    data
                        .choices[0]
                        .message
                        .content;

                if (
                    typeof content ===
                    "string"
                ) {
                    reply =
                        content.trim();
                }
            }


            reply =
                cleanReply(reply);


            if (!reply) {

                console.error(
                    "BOŞ GROQ CEVABI:",
                    JSON.stringify(data)
                );

                return res.status(
                    500
                ).json({
                    ok: false,
                    reply:
                        "ErencanAI boş cevap verdi."
                });
            }


            addMemory(
                "assistant",
                reply
            );


            const elapsed =
                Date.now() -
                startTime;


            console.log(
                "ERENCANAI:",
                reply
            );

            console.log(
                "CEVAP SÜRESİ:",
                elapsed + " ms"
            );


            return res.json({
                ok: true,
                reply: reply,
                timeMs: elapsed
            });


        } catch (error) {

            console.error(
                "ERENCANAI HATASI:"
            );

            console.error(
                error
            );


            return res.status(
                500
            ).json({
                ok: false,
                reply:
                    "Sunucu bağlantı hatası: " +
                    error.message
            });
        }
    }
);


app.get(
    "/api/memory",
    function (req, res) {

        return res.json({
            ok: true,
            count:
                memory.length,
            messages:
                memory
        });
    }
);


app.post(
    "/api/clear-memory",
    function (req, res) {

        memory = [];

        saveMemory();

        return res.json({
            ok: true,
            message:
                "ErencanAI hafızası temizlendi."
        });
    }
);


app.use(
    function (req, res) {

        return res.status(
            404
        ).json({
            ok: false,
            error:
                "Bu ErencanAI API adresi bulunamadı."
        });
    }
);


app.listen(
    PORT,
    "0.0.0.0",
    function () {

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
            "TEST: /api/test"
        );

        console.log(
            "AI: Groq"
        );

        console.log(
            "MODEL: " +
            GROQ_MODEL
        );

        console.log(
            "HAFIZA: " +
            memory.length +
            " mesaj"
        );

        console.log(
            "API KEY: " +
            (
                GROQ_API_KEY
                    ? "BULUNDU"
                    : "BULUNAMADI"
            )
        );

        console.log(
            "================================="
        );
    }
);
