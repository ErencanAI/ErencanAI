"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;

/* =========================================================
   GROQ
========================================================= */

const GROQ_API_KEY =
    process.env.GROQ_API_KEY ||
    process.env.GR0Q_API_KEY;

const GROQ_URL =
    "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL =
    "openai/gpt-oss-20b";

/* =========================================================
   HAFIZA AYARLARI
========================================================= */

const MEMORY_FILE =
    path.join(__dirname, "memory.json");

const MAX_MEMORY_MESSAGES = 400;
const CONTEXT_MESSAGES = 20;

/* =========================================================
   API AYARLARI
========================================================= */

const REQUEST_TIMEOUT = 30000;
const MAX_RETRIES = 2;

/* =========================================================
   ERENCANAI SİSTEMİ
========================================================= */

const SYSTEM_PROMPT = `
Sen ErencanAI adlı gelişmiş, hızlı, doğal ve güvenilir bir yapay zeka asistanısın.

TEMEL KURALLAR:

- Her zaman Türkçe konuş.
- Kullanıcının konuşma tarzını doğal şekilde anlayıp ona uyum sağla.
- Kullanıcı kısa cevap istiyorsa kısa cevap ver.
- Kullanıcı detaylı anlatım istiyorsa detaylı anlat.
- Sorunun özüne doğrudan gir.
- Gereksiz giriş cümleleri kullanma.
- Gereksiz tekrar yapma.
- Aynı bilgiyi farklı şekillerde tekrar tekrar anlatma.
- Bilmediğin bilgiyi uydurma.
- Emin olmadığın bilgiyi kesin bilgi gibi sunma.
- Önceki konuşmalardaki bağlamı dikkate al.
- Hafızadaki bilgileri yalnızca gerektiğinde kullan.
- Kullanıcının söylediği şeyleri gereksiz yere tekrar etme.
- JSON biçiminde cevap verme.
- Cevabın başına "AI:", "ErencanAI:", "Assistant:" gibi etiketler koyma.
- Doğal konuş.
- Kullanıcı hata yaptığında küçümseme veya alay etme.
- Kullanıcı sinirliyse gereksiz uzun açıklamalarla daha fazla uzatma.

CEVAP UZUNLUĞU:

- Basit soru → 1-3 cümle.
- Normal soru → gerekli kadar açıklama.
- Teknik işlem → numaralı adımlar.
- Kod isteği → eksiksiz ve çalışabilir kod.
- Kullanıcı "sadece ne yapacağımı söyle" derse yalnızca uygulanacak adımları ver.
- Kullanıcı "baştan sona kodu ver" derse eksiksiz dosya ver.
- Gereksiz uzun cevap verme.

EMOJİ:

- Uygunsa doğal emoji kullan.
- Her cümlede emoji kullanma.
- Teknik cevaplarda emoji kullanımını azalt.
- Başarılı işlem → ✅
- Hata → ❌
- Uyarı → ⚠️
- Bilgi/araştırma → 🔎
- Fikir → 💡
- Kodlama → 💻
- Unity/oyun → 🎮

AKIL YÜRÜTME:

- Problemi önce doğru anlamaya çalış.
- Teknik hatalarda doğrudan görünen belirtiye değil, asıl nedene odaklan.
- Kullanıcı "olmadı" derse önceki çözümü aynen tekrar etme.
- Yeni olası nedenleri kontrol et.
- Kod verirken sözdizimini kontrol et.
- Açılan parantezleri ve kapanan parantezleri kontrol et.
- Değişken isimlerinde çakışma oluşturmamaya dikkat et.
- Mevcut çalışan sistemi gereksiz yere değiştirme.
- Bir dosyanın yalnızca küçük bir bölümü değişecekse gereksiz bölümleri değiştirme.

KODLAMA:

JavaScript:
- ES6+
- async/await
- Promise
- fetch
- DOM
- event listener
- localStorage
- JSON
- hata yönetimi

Node.js:
- CommonJS
- require
- fs
- path
- dotenv
- process.env
- fetch
- HTTP
- hata ayıklama

Express:
- express.json
- express.static
- GET
- POST
- middleware
- REST API
- status kodları
- Render

HTML:
- HTML5
- semantic HTML
- form
- input
- textarea
- button
- class
- id

CSS:
- Flexbox
- Grid
- responsive tasarım
- mobil tasarım
- animation
- transition
- modal
- sidebar
- chat arayüzü
- media query

Python:
- temel Python
- fonksiyon
- list
- dictionary
- dosya işlemleri
- API
- hata ayıklama

C#:
- class
- method
- değişken
- koşullar
- döngüler
- OOP
- Unity

Unity:
- GameObject
- Component
- MonoBehaviour
- Inspector
- Transform
- UI
- Scene
- PlayerController
- GameManager
- C#

API:
- REST
- GET
- POST
- JSON
- headers
- Authorization
- Bearer
- fetch
- environment variables
- API hata yönetimi

GitHub:
- repository
- commit
- branch
- dosya yükleme
- deployment

Render:
- Web Service
- Build Command
- Start Command
- Environment Variables
- PORT
- deployment
- log inceleme

GÜVENLİ KODLAMA:

- API anahtarını asla cevapta gösterme.
- .env içindeki gizli bilgileri asla tekrar yazma.
- Kullanıcının API anahtarını kod içine koyma.
- Gizli bilgileri console.log ile yazdırma.
- Kullanıcı mevcut bir dosyayı paylaştığında çalışan bölümleri korumaya çalış.
- Gereksiz yere projeyi sıfırdan tasarlama.

ERENCANAI PROJESİ:

- Proje adı ErencanAI.
- Backend Node.js + Express.
- AI sağlayıcısı Groq.
- Model: openai/gpt-oss-20b.
- Kalıcı hafıza memory.json.
- Frontend index.html + app.js + style.css.
- API: /api/chat.
- Test: /api/test.
- Sistem mevcut çalışan özellikleri korumalıdır.
- Gelecekte sohbet geçmişi, sesli sohbet, fotoğraf ve video özellikleri eklenebilir.

HATA AYIKLAMA:

Bir hata mesajı geldiğinde:

1. Hatanın dosyasını belirle.
2. Hatanın gerçek nedenini belirle.
3. Neden oluştuğunu kısa şekilde açıkla.
4. Çözümü sırayla ver.
5. Gerekirse düzeltilmiş kodu eksiksiz ver.
6. Çözümün mevcut sistemi bozup bozmadığını kontrol et.

Özellikle tanı:

- SyntaxError
- ReferenceError
- TypeError
- MODULE_NOT_FOUND
- ENOENT
- fetch failed
- ECONNREFUSED
- timeout
- Headers Timeout Error
- API authentication
- JSON parse
- Express route
- DOM
- CSS syntax

EN ÖNEMLİ HEDEF:

DOĞRU + DOĞAL + HIZLI + ANLAŞILIR + FAYDALI cevap ver.

Mevcut çalışan sistemi gereksiz yere bozma.
`.trim();

/* =========================================================
   HAFIZA
========================================================= */

let memory = [];

/* =========================================================
   HAFIZA YÜKLE
========================================================= */

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

/* =========================================================
   HAFIZA KAYDET
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
   HAFIZAYA EKLE
========================================================= */

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

/* =========================================================
   İSİM BUL
========================================================= */

function findUserName(text) {

    const match =
        String(text).match(
            /(?:benim\s+adım|benim\s+ismim|adım|ismim)\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)/i
        );

    if (match) {
        return match[1];
    }

    return null;
}

/* =========================================================
   SON KULLANICI ADINI BUL
========================================================= */

function getLastUserName() {

    for (
        let i = memory.length - 1;
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

        if (name) {
            return name;
        }
    }

    return null;
}

/* =========================================================
   CEVAP TEMİZLE
========================================================= */

function cleanReply(text) {

    let reply =
        String(text || "").trim();

    if (!reply) {
        return "";
    }

    /* JSON cevap geldiyse */
    try {

        const parsed =
            JSON.parse(reply);

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

    /* Markdown code fence temizliği */

    reply =
        reply
            .replace(
                /^```json\s*/i,
                ""
            )
            .replace(
                /^```\s*/i,
                ""
            )
            .replace(
                /\s*```$/i,
                ""
            )
            .trim();

    /* Gereksiz AI etiketlerini temizle */

    reply =
        reply.replace(
            /^(ErencanAI|AI|Assistant)\s*:\s*/i,
            ""
        ).trim();

    return reply;
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

        const controller =
            new AbortController();

        const timeout =
            setTimeout(
                () => controller.abort(),
                REQUEST_TIMEOUT
            );

        try {

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
                                    0.25,

                                max_tokens:
                                    700,

                                stream:
                                    false
                            }),

                        signal:
                            controller.signal
                    }
                );

            clearTimeout(timeout);

            const responseText =
                await response.text();

            if (!response.ok) {

                const error =
                    new Error(
                        "Groq HTTP " +
                        response.status
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
                    "Groq geçersiz JSON gönderdi."
                );
            }

            return data;

        } catch (error) {

            clearTimeout(timeout);

            lastError =
                error;

            console.error(
                "GROQ DENEME " +
                attempt +
                " HATASI:",
                error.message
            );

            /* API anahtarı / yetki hatasında tekrar deneme */

            if (
                error.status === 401 ||
                error.status === 403
            ) {
                break;
            }

            /* Son deneme değilse kısa bekle */

            if (
                attempt <= MAX_RETRIES
            ) {
                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            500 * attempt
                        )
                );
            }
        }
    }

    throw lastError ||
        new Error(
            "Groq bağlantısı kurulamadı."
        );
}

/* =========================================================
   BAŞLANGIÇ
========================================================= */

memory =
    loadMemory();

/* =========================================================
   EXPRESS
========================================================= */

app.use(
    express.json({
        limit: "2mb"
    })
);

app.use(
    express.static(__dirname)
);

/* =========================================================
   ANA SAYFA
========================================================= */

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

/* =========================================================
   TEST API
========================================================= */

app.get(
    "/api/test",
    function (req, res) {

        return res.json({

            ok: true,

            server: true,

            ai: "Groq",

            model:
                GROQ_MODEL,

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

/* =========================================================
   ANA CHAT API
========================================================= */

app.post(
    "/api/chat",
    async function (req, res) {

        const startTime =
            Date.now();

        try {

            const message =
                String(
                    req.body &&
                    req.body.message
                        ? req.body.message
                        : ""
                ).trim();

            /* -----------------------------------------
               MESAJ KONTROLÜ
            ----------------------------------------- */

            if (!message) {

                return res.status(400).json({

                    ok: false,

                    reply:
                        "Lütfen bir mesaj yaz."
                });
            }

            /* -----------------------------------------
               API KEY KONTROLÜ
            ----------------------------------------- */

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
                "================================="
            );
            console.log(
                "KULLANICI:",
                message
            );

            /* -----------------------------------------
               KULLANICI MESAJINI HAFIZAYA EKLE
            ----------------------------------------- */

            addMemory(
                "user",
                message
            );

            /* -----------------------------------------
               İSİM KONTROLÜ
            ----------------------------------------- */

            const newName =
                findUserName(
                    message
                );

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
                    " olarak hatırlayacağım. 😊";

                addMemory(
                    "assistant",
                    reply
                );

                return res.json({

                    ok: true,

                    reply: reply,

                    timeMs:
                        Date.now() -
                        startTime
                });
            }

            /* -----------------------------------------
               İSİM SORUSU
            ----------------------------------------- */

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

                        timeMs:
                            Date.now() -
                            startTime
                    });
                }
            }

            /* -----------------------------------------
               SON MESAJLAR
            ----------------------------------------- */

            const recentMessages =
                memory.slice(
                    -CONTEXT_MESSAGES
                );

            /* -----------------------------------------
               GROQ MESAJLARI
            ----------------------------------------- */

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

            console.log(
                "BAĞLAM:",
                recentMessages.length +
                " mesaj"
            );

            console.log(
                "GROQ İSTEĞİ GÖNDERİLİYOR..."
            );

            /* -----------------------------------------
               GROQ
            ----------------------------------------- */

            const data =
                await requestGroq(
                    messages
                );

            /* -----------------------------------------
               CEVABI AL
            ----------------------------------------- */

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

            /* -----------------------------------------
               CEVABI TEMİZLE
            ----------------------------------------- */

            reply =
                cleanReply(
                    reply
                );

            /* -----------------------------------------
               BOŞ CEVAP
            ----------------------------------------- */

            if (!reply) {

                console.error(
                    "BOŞ GROQ CEVABI"
                );

                return res.status(500).json({

                    ok: false,

                    reply:
                        "ErencanAI boş cevap verdi."
                });
            }

            /* -----------------------------------------
               ASİSTAN CEVABI HAFIZAYA
            ----------------------------------------- */

            addMemory(
                "assistant",
                reply
            );

            /* -----------------------------------------
               SÜRE
            ----------------------------------------- */

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

            console.log(
                "================================="
            );

            /* -----------------------------------------
               CEVAP
            ----------------------------------------- */

            return res.json({

                ok: true,

                reply: reply,

                timeMs:
                    elapsed,

                model:
                    GROQ_MODEL
            });

        } catch (error) {

            const elapsed =
                Date.now() -
                startTime;

            console.error("");
            console.error(
                "================================="
            );
            console.error(
                "ERENCANAI HATASI"
            );
            console.error(
                error.message
            );
            console.error(
                "================================="
            );

            let userMessage =
                "Sunucu bağlantı hatası.";

            /* -----------------------------------------
               TIMEOUT
            ----------------------------------------- */

            if (
                error.name ===
                "AbortError"
            ) {

                userMessage =
                    "AI yanıtı zaman aşımına uğradı. Tekrar dene.";
            }

            /* -----------------------------------------
               FETCH
            ----------------------------------------- */

            else if (
                error.message &&
                error.message
                    .toLowerCase()
                    .includes("fetch")
            ) {

                userMessage =
                    "Groq bağlantısı kurulamadı. Sunucu bağlantısını kontrol et.";
            }

            /* -----------------------------------------
               AUTH
            ----------------------------------------- */

            else if (
                error.status === 401 ||
                error.status === 403
            ) {

                userMessage =
                    "Groq API anahtarı geçersiz veya yetkisiz.";
            }

            /* -----------------------------------------
               RATE LIMIT
            ----------------------------------------- */

            else if (
                error.status === 429
            ) {

                userMessage =
                    "Groq kullanım sınırına ulaşıldı. Biraz sonra tekrar dene.";
            }

            /* -----------------------------------------
               SERVER ERROR
            ----------------------------------------- */

            else if (
                error.status &&
                error.status >= 500
            ) {

                userMessage =
                    "Groq sunucusunda geçici bir hata oluştu.";
            }

            return res.status(500).json({

                ok: false,

                reply:
                    userMessage,

                timeMs:
                    elapsed
            });
        }
    }
);

/* =========================================================
   HAFIZA GÖRÜNTÜLEME
========================================================= */

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

/* =========================================================
   HAFIZA TEMİZLEME
========================================================= */

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

/* =========================================================
   SAĞLIK KONTROLÜ
========================================================= */

app.get(
    "/api/health",
    function (req, res) {

        return res.json({

            ok: true,

            service:
                "ErencanAI",

            ai:
                "Groq",

            model:
                GROQ_MODEL,

            memory:
                memory.length,

            uptime:
                Math.floor(
                    process.uptime()
                )
        });
    }
);

/* =========================================================
   404
========================================================= */

app.use(
    function (req, res) {

        return res.status(404).json({

            ok: false,

            error:
                "Bu ErencanAI API adresi bulunamadı."
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
            "HEALTH: /api/health"
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


