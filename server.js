"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = Number(process.env.PORT) || 3000;

/* =========================================================
   GROQ
========================================================= */

const GROQ_API_KEY =
    process.env.GROQ_API_KEY ||
    process.env.GR0Q_API_KEY ||
    "";

const GROQ_URL =
    "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL =
    "openai/gpt-oss-20b";

/* =========================================================
   AYARLAR
========================================================= */

const MEMORY_FILE =
    path.join(__dirname, "memory.json");

const MAX_MEMORY_MESSAGES = 400;
const CONTEXT_MESSAGES = 24;

const REQUEST_TIMEOUT_MS = 45000;
const MAX_MESSAGE_LENGTH = 12000;
const MAX_REPLY_LENGTH = 30000;

/* =========================================================
   ERENCANAI SİSTEMİ
========================================================= */

const SYSTEM_PROMPT = `
Sen ErencanAI adlı gelişmiş, hızlı, güvenilir ve doğal konuşan bir yapay zeka asistanısın.

TEMEL DAVRANIŞ:

- Her zaman Türkçe konuş.
- Kullanıcının konuşma tarzına doğal şekilde uyum sağla.
- Soruyu önce doğru anla.
- Cevabı doğrudan ver.
- Basit sorulara kısa cevap ver.
- Karmaşık problemlerde gerektiği kadar ayrıntı ver.
- Gereksiz tekrar yapma.
- Gereksiz giriş cümleleri kullanma.
- Bilmediğin bilgiyi uydurma.
- Emin olmadığın bilgiyi kesin bilgi gibi sunma.
- Çelişki varsa belirt.
- Kullanıcı bir önceki mesajla ilgili konuşuyorsa bağlamı kullan.
- Hafızadaki bilgileri yalnızca gerekli olduğunda kullan.
- JSON biçiminde cevap verme.
- Cevabın başına "AI:", "ErencanAI:" veya teknik etiket koyma.
- Doğal, anlaşılır ve yardımcı ol.
- Kullanıcı kısa cevap istiyorsa kısa cevap ver.
- Kullanıcı detay istiyorsa detaylandır.
- Kullanıcı sadece uygulanacak adımları istiyorsa gereksiz açıklama yapma.

KONUŞMA KALİTESİ:

- Kullanıcının ne istediğini tahmin etmek yerine mesajın anlamını dikkatlice değerlendir.
- Aynı soruyu tekrar sormaktan kaçın.
- Kullanıcı bir hata gönderirse hatayı analiz et.
- Önceki çözüm işe yaramadıysa aynı çözümü körü körüne tekrar etme.
- Sorunun muhtemel nedenlerini sırala.
- En güvenli çözümü önce ver.
- Çalışan kodu gereksiz yere değiştirme.
- Kullanıcının mevcut projesine uyum sağla.

AKIL YÜRÜTME:

- Problemi mantıksal parçalara ayır.
- Teknik sorunlarda hata mesajındaki dosya, satır ve hata türünü dikkate al.
- Kod vermeden önce sözdizimini kontrol et.
- Parantezleri kontrol et.
- Süslü parantezleri kontrol et.
- Tırnakları kontrol et.
- Değişken isimlerini kontrol et.
- Fonksiyonların birbirleriyle uyumlu olduğundan emin ol.
- API isteklerinin doğru biçimde oluşturulduğunu kontrol et.
- Asenkron işlemlerde hata yönetimi kullan.
- Kullanıcı "olmadı" derse yeni bir teşhis yap.

KODLAMA UZMANLIĞI:

JavaScript:

- ES5
- ES6+
- let / const
- arrow functions
- destructuring
- spread/rest
- template literals
- modules
- CommonJS
- async/await
- Promise
- Promise.all
- fetch
- AbortController
- try/catch
- error handling
- DOM
- event listener
- localStorage
- sessionStorage
- JSON
- regex
- array methods
- object methods
- classes
- closures
- callbacks
- debouncing
- throttling

Node.js:

- Node.js
- CommonJS
- require
- fs
- path
- process.env
- dotenv
- fetch
- AbortController
- HTTP istekleri
- dosya sistemi
- JSON dosyaları
- hata ayıklama
- environment variables
- process yönetimi

Express.js:

- Express
- middleware
- express.json
- express.static
- GET
- POST
- PUT
- PATCH
- DELETE
- REST API
- status codes
- route yönetimi
- error middleware
- CORS mantığı
- Render deployment
- health check
- API timeout yönetimi

HTML:

- HTML5
- semantic HTML
- form
- input
- textarea
- button
- modal
- sidebar
- chat arayüzü
- accessibility
- responsive yapı

CSS:

- CSS variables
- Flexbox
- Grid
- responsive tasarım
- media queries
- transitions
- animations
- modal
- sidebar
- chat UI
- scrollbar
- gradients
- shadows
- mobile layout

Python:

- değişkenler
- fonksiyonlar
- listeler
- tuple
- dictionary
- set
- class
- dosya işlemleri
- JSON
- API
- hata yönetimi
- debugging

C#:

- değişkenler
- method
- class
- object
- inheritance
- interface
- enum
- array
- List
- Dictionary
- exception handling
- async
- Unity C#

Unity:

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
- C# scriptleri
- Unity debugging

API:

- REST
- GET
- POST
- JSON
- headers
- Authorization
- Bearer token
- fetch
- HTTP status codes
- timeout
- retry
- API hata yönetimi
- environment variables

GitHub:

- repository
- commit
- branch
- push
- pull
- file management
- deployment
- GitHub bağlantıları

Render:

- Web Service
- Build Command
- Start Command
- Environment Variables
- PORT
- deployment
- logs
- restart
- health check

KODLAMA KURALLARI:

1. Çalışan sistemi gereksiz yere yeniden tasarlama.
2. Mevcut özellikleri koru.
3. Yeni özellik eklerken eski özellikleri bozma.
4. Kullanıcı belirli dosyayı isterse o dosyaya uygun çözüm üret.
5. Kullanıcı tam dosya isterse tam dosya ver.
6. Eksik kod bırakma.
7. Sözdizimi hatası bırakma.
8. API anahtarını kod içine yazma.
9. .env içindeki gizli bilgileri asla gösterme.
10. Kullanıcının gerçek API anahtarını tekrar yazma.
11. Aynı isimde çakışan değişkenler oluşturma.
12. Gereksiz bağımlılık ekleme.
13. Mevcut proje yapısını koru.
14. Bir özelliği düzeltirken diğer özellikleri kontrol et.
15. Kodun Node.js sürümüyle uyumlu olmasına dikkat et.
16. Hata durumlarında kullanıcıya anlaşılır mesaj döndür.
17. Sunucu tarafında ayrıntılı hatayı console'a yazabilir, kullanıcıya gizli bilgiler gönderme.

HATA AYIKLAMA:

Özellikle şu hataları tanı:

- SyntaxError
- ReferenceError
- TypeError
- MODULE_NOT_FOUND
- ENOENT
- EACCES
- fetch failed
- ECONNREFUSED
- ETIMEDOUT
- AbortError
- Headers Timeout Error
- authentication errors
- invalid API key
- JSON parse errors
- Express route errors
- HTTP 400
- HTTP 401
- HTTP 403
- HTTP 404
- HTTP 429
- HTTP 500
- CSS syntax errors
- JavaScript DOM errors

HATA GELDİĞİNDE:

1. Hatanın türünü belirle.
2. Hatanın kaynağını belirle.
3. Hatanın nedenini açıkla.
4. En güvenli çözümü ver.
5. Gerekirse düzeltilmiş kodu eksiksiz ver.
6. Çözümün mevcut sistemi bozup bozmayacağını kontrol et.

ERENCANAI PROJESİ:

- Projenin adı ErencanAI.
- Backend Node.js + Express kullanır.
- Yapay zeka Groq API kullanır.
- Model openai/gpt-oss-20b'dir.
- memory.json kalıcı hafıza olarak kullanılır.
- Frontend index.html, app.js ve style.css dosyalarından oluşur.
- Mevcut chat sistemi korunmalıdır.
- Gelecekte ses, görsel, video ve araştırma özellikleri eklenebilir.
- Yeni özellikler mevcut sistemi bozmadan eklenmelidir.

EMOJİ:

- Konuya uygunsa doğal şekilde emoji kullan.
- Her cümlede emoji kullanma.
- Teknik cevaplarda emoji kullanımını azalt.
- Başarılı işlem için gerektiğinde ✅
- Hata için gerektiğinde ❌
- Uyarı için gerektiğinde ⚠️
- Bilgi için gerektiğinde 🔎
- Fikir için gerektiğinde 💡
- Kodlama için gerektiğinde 💻
- Unity için gerektiğinde 🎮

EN ÖNEMLİ HEDEF:

DOĞRU + DOĞAL + HIZLI + ANLAŞILIR + FAYDALI cevap vermek.

Çalışan sistemi gereksiz yere bozma.
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

        if (!Array.isArray(data)) {
            return [];
        }

        return data.filter(
            item =>
                item &&
                typeof item === "object" &&
                (item.role === "user" ||
                    item.role === "assistant") &&
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
    const cleanContent =
        String(content || "").trim();

    if (!cleanContent) {
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
   İSİM BUL
========================================================= */

function findUserName(text) {
    const value =
        String(text || "").trim();

    const match =
        value.match(
            /(?:benim\s+adım|benim\s+ismim|adım|ismim)\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\b/i
        );

    if (!match) {
        return null;
    }

    return match[1];
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
            typeof parsed.reply === "string"
        ) {
            reply =
                parsed.reply.trim();
        }
    } catch {
        /* Normal metin */
    }

    /* Markdown code fence temizliği */

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

    /* Gereksiz teknik etiketler */

    reply =
        reply.replace(
            /^(?:AI|ErencanAI)\s*:\s*/i,
            ""
        );

    if (
        reply.length >
        MAX_REPLY_LENGTH
    ) {
        reply =
            reply.slice(
                0,
                MAX_REPLY_LENGTH
            ) +
            "\n\n[Yanıt çok uzundu ve kısaltıldı.]";
    }

    return reply.trim();
}

/* =========================================================
   TIMEOUT'LU FETCH
========================================================= */

async function fetchWithTimeout(
    url,
    options,
    timeoutMs
) {
    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => {
                controller.abort();
            },
            timeoutMs
        );

    try {
        return await fetch(
            url,
            {
                ...options,
                signal:
                    controller.signal
            }
        );

    } finally {
        clearTimeout(timeout);
    }
}

/* =========================================================
   GROQ İSTEĞİ
========================================================= */

async function requestGroq(messages) {
    const body = {
        model:
            GROQ_MODEL,

        messages:
            messages,

        temperature:
            0.25,

        max_tokens:
            900,

        stream:
            false
    };

    return fetchWithTimeout(
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
                JSON.stringify(body)
        },

        REQUEST_TIMEOUT_MS
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
   CHAT API
========================================================= */

app.post(
    "/api/chat",
    async function (req, res) {
        const startTime =
            Date.now();

        try {
            let message =
                String(
                    req.body &&
                    req.body.message
                        ? req.body.message
                        : ""
                ).trim();

            /* Mesaj kontrolü */

            if (!message) {
                return res.status(400).json({
                    ok: false,

                    reply:
                        "Lütfen bir mesaj yaz."
                });
            }

            /* Çok uzun mesaj kontrolü */

            if (
                message.length >
                MAX_MESSAGE_LENGTH
            ) {
                return res.status(400).json({
                    ok: false,

                    reply:
                        "Mesaj çok uzun. Lütfen daha kısa bir mesaj gönder."
                });
            }

            /* API key kontrolü */

            if (!GROQ_API_KEY) {
                console.error(
                    "GROQ API KEY BULUNAMADI."
                );

                return res.status(500).json({
                    ok: false,

                    reply:
                        "Groq API anahtarı bulunamadı. .env dosyasını kontrol et."
                });
            }

            console.log("");
            console.log(
                "================================="
            );
            console.log(
                "YENİ MESAJ"
            );
            console.log(
                "KULLANICI:",
                message
            );

            /* Kullanıcı mesajını kaydet */

            addMemory(
                "user",
                message
            );

            /* =================================================
               İSİM SİSTEMİ
            ================================================= */

            const newName =
                findUserName(
                    message
                );

            const askingName =
                /(?:benim\s+adım|benim\s+ismim|ismim|adım)\s+ne(?:ydi)?/i.test(
                    message
                );

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

                    reply:
                        reply,

                    timeMs:
                        Date.now() -
                        startTime
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

                        reply:
                            reply,

                        timeMs:
                            Date.now() -
                            startTime
                    });
                }
            }

            /* =================================================
               BAĞLAM
            ================================================= */

            const recentMessages =
                memory.slice(
                    -CONTEXT_MESSAGES
                );

            const messages = [
                {
                    role:
                        "system",

                    content:
                        SYSTEM_PROMPT
                }
            ];

            for (
                const item of recentMessages
            ) {
                if (
                    !item ||
                    typeof item.content !==
                        "string" ||
                    !item.content.trim()
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
                        item.content
                });
            }

            /* =================================================
               GROQ
            ================================================= */

            console.log(
                "GROQ İSTEĞİ GÖNDERİLİYOR..."
            );

            let response;

            try {
                response =
                    await requestGroq(
                        messages
                    );

            } catch (error) {
                console.error(
                    "GROQ BAĞLANTI HATASI:",
                    error.message
                );

                if (
                    error.name ===
                    "AbortError"
                ) {
                    return res.status(504).json({
                        ok: false,

                        reply:
                            "Groq yanıt vermek için çok uzun süre bekledi. Lütfen tekrar dene."
                    });
                }

                return res.status(502).json({
                    ok: false,

                    reply:
                        "Groq bağlantısı kurulamadı. Sunucu bağlantısını kontrol et."
                });
            }

            /* =================================================
               GROQ HTTP HATASI
            ================================================= */

            const responseText =
                await response.text();

            if (!response.ok) {
                console.error(
                    "GROQ HTTP HATASI:",
                    response.status
                );

                console.error(
                    "GROQ CEVABI:",
                    responseText.slice(
                        0,
                        2000
                    )
                );

                let errorMessage =
                    "Groq API hatası.";

                try {
                    const errorData =
                        JSON.parse(
                            responseText
                        );

                    if (
                        errorData &&
                        errorData.error &&
                        errorData.error.message
                    ) {
                        errorMessage =
                            errorData
                                .error
                                .message;
                    }

                } catch {
                    /* JSON değil */
                }

                if (
                    response.status ===
                    401
                ) {
                    errorMessage =
                        "Groq API anahtarı geçersiz.";
                }

                if (
                    response.status ===
                    429
                ) {
                    errorMessage =
                        "Groq kullanım limiti aşıldı. Biraz sonra tekrar dene.";
                }

                return res.status(502).json({
                    ok: false,

                    reply:
                        errorMessage
                });
            }

            /* =================================================
               JSON
            ================================================= */

            let data;

            try {
                data =
                    JSON.parse(
                        responseText
                    );

            } catch (error) {
                console.error(
                    "GROQ JSON PARSE HATASI:",
                    error.message
                );

                console.error(
                    responseText.slice(
                        0,
                        2000
                    )
                );

                return res.status(502).json({
                    ok: false,

                    reply:
                        "Groq geçerli bir JSON cevap göndermedi."
                });
            }

            /* =================================================
               CEVAP AL
            ================================================= */

            let reply = "";

            if (
                data &&
                Array.isArray(
                    data.choices
                ) &&
                data.choices.length > 0
            ) {
                const choice =
                    data.choices[0];

                if (
                    choice &&
                    choice.message
                ) {
                    if (
                        typeof choice
                            .message
                            .content ===
                        "string"
                    ) {
                        reply =
                            choice
                                .message
                                .content
                                .trim();
                    }
                }
            }

            /* =================================================
               CEVAP TEMİZLE
            ================================================= */

            reply =
                cleanReply(
                    reply
                );

            /* =================================================
               BOŞ CEVAP
            ================================================= */

            if (!reply) {
                console.error(
                    "GROQ BOŞ CEVAP VERDİ."
                );

                console.error(
                    JSON.stringify(
                        data,
                        null,
                        2
                    ).slice(
                        0,
                        5000
                    )
                );

                return res.status(502).json({
                    ok: false,

                    reply:
                        "ErencanAI boş cevap aldı. Lütfen tekrar dene."
                });
            }

            /* =================================================
               ASİSTAN HAFIZASI
            ================================================= */

            addMemory(
                "assistant",
                reply
            );

            /* =================================================
               SÜRE
            ================================================= */

            const elapsed =
                Date.now() -
                startTime;

            console.log(
                "ERENCANAI:",
                reply
            );

            console.log(
                "CEVAP SÜRESİ:",
                elapsed +
                    " ms"
            );

            console.log(
                "================================="
            );

            /* =================================================
               JSON CEVAP
            ================================================= */

            return res.json({
                ok: true,

                reply:
                    reply,

                timeMs:
                    elapsed
            });

        } catch (error) {
            console.error(
                "================================="
            );

            console.error(
                "ERENCANAI SUNUCU HATASI:"
            );

            console.error(
                error
            );

            console.error(
                "================================="
            );

            return res.status(500).json({
                ok: false,

                reply:
                    "Sunucuda beklenmeyen bir hata oluştu."
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

        const saved =
            saveMemory();

        return res.json({
            ok:
                saved,

            message:
                saved
                    ? "ErencanAI hafızası temizlendi."
                    : "Hafıza temizlenemedi."
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
   GENEL HATA YAKALAMA
========================================================= */

app.use(
    function (error, req, res, next) {
        console.error(
            "EXPRESS HATASI:",
            error
        );

        return res.status(500).json({
            ok: false,

            reply:
                "Sunucuda bir hata oluştu."
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
            "TIMEOUT: " +
            REQUEST_TIMEOUT_MS +
            " ms"
        );

        console.log(
            "================================="
        );
    }
);

