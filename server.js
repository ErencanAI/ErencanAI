"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();

/* =========================================================
   TEMEL AYARLAR
========================================================= */

const PORT = Number(process.env.PORT) || 3000;

const GROQ_API_KEY =
    process.env.GROQ_API_KEY ||
    process.env.GR0Q_API_KEY ||
    "";

const GROQ_URL =
    "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL =
    "openai/gpt-oss-20b";

/* =========================================================
   DOSYALAR
========================================================= */

const MEMORY_FILE =
    path.join(__dirname, "memory.json");

const UPLOAD_DIR =
    path.join(__dirname, "uploads");

/* =========================================================
   HAFIZA AYARLARI
========================================================= */

const MAX_MEMORY_MESSAGES = 400;
const CONTEXT_MESSAGES = 30;

/* =========================================================
   MESAJ AYARLARI
========================================================= */

const MAX_MESSAGE_LENGTH = 12000;
const MAX_REPLY_LENGTH = 30000;

/* =========================================================
   SUNUCU AYARLARI
========================================================= */

const REQUEST_TIMEOUT_MS = 60000;

/* =========================================================
   DOSYA AYARLARI
========================================================= */

const MAX_FILE_SIZE =
    10 * 1024 * 1024;

/* =========================================================
   UPLOAD KLASÖRÜ
========================================================= */

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(
        UPLOAD_DIR,
        {
            recursive: true
        }
    );
}

/* =========================================================
   MULTER
========================================================= */

const storage =
    multer.diskStorage({

        destination: function (
            req,
            file,
            cb
        ) {

            cb(
                null,
                UPLOAD_DIR
            );
        },

        filename: function (
            req,
            file,
            cb
        ) {

            const originalName =
                path.basename(
                    file.originalname || "dosya"
                );

            const safeName =
                originalName
                    .replace(
                        /[^a-zA-Z0-9._-]/g,
                        "_"
                    );

            const uniqueName =
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 10) +
                "-" +
                safeName;

            cb(
                null,
                uniqueName
            );
        }
    });

const upload =
    multer({

        storage: storage,

        limits: {
            fileSize:
                MAX_FILE_SIZE
        }
    });

/* =========================================================
   ER̆ENCANAI SİSTEM PROMPTU
========================================================= */

const SYSTEM_PROMPT = `
Sen ErencanAI adlı gelişmiş, hızlı, güvenilir ve doğal konuşan bir yapay zeka asistanısın.

GENEL DAVRANIŞ:

- Öncelikle kullanıcının ne istediğini doğru anla.
- Her zaman Türkçe cevap ver.
- Kullanıcının konuşma tarzına doğal şekilde uyum sağla.
- Basit sorulara kısa ve net cevap ver.
- Karmaşık sorulara gerektiği kadar ayrıntılı cevap ver.
- Kullanıcı özellikle detay istiyorsa ayrıntılı anlat.
- Kullanıcı sadece uygulanacak adımları istiyorsa doğrudan adımları ver.
- Gereksiz giriş cümleleri kullanma.
- Gereksiz tekrar yapma.
- Bilmediğin bilgiyi uydurma.
- Emin olmadığın bilgiyi kesin bilgi gibi gösterme.
- Güncel bilgi gerektiğinde verilen web araştırması sonuçlarını kullan.
- Güncel bilgi ile eski bilgiyi karıştırma.
- Tarihleri dikkatli değerlendir.
- Kullanıcının önceki mesajlarını bağlam olarak kullan.
- Hafızadaki bilgileri yalnızca gerektiğinde kullan.
- JSON biçiminde cevap verme.
- Cevabın başına "AI:" yazma.
- Cevabın başına "ErencanAI:" yazma.
- Doğal konuş.
- Gerektiğinde madde işaretleri kullan.
- Gerektiğinde kod bloğu kullan.

GÜNCEL BİLGİ:

- Sistem sana mevcut tarih ve saati ayrıca verebilir.
- "bugün", "dün", "yarın", "şu an", "en son", "güncel", "son durum",
  "kim kazandı", "ne oldu", "2026'da", "bu hafta", "bu ay"
  gibi ifadeler güncel bilgi gerektirebilir.
- Web araştırması sonuçları verilmişse bunları öncelikli bilgi olarak değerlendir.
- Web araştırması sonucu ile hafızadaki eski bilgiyi karıştırma.
- Tarihi kesin olarak bilmiyorsan tahmin etme.
- Güncel olaylarda kullanıcıya eski bilgi verme.

AKIL YÜRÜTME:

- Problemi mantıksal parçalara ayır.
- Önce problemi doğru tanımla.
- Sonra çözüm üret.
- Teknik sorularda hata mesajını dikkatlice incele.
- Dosya ve satır bilgilerini dikkate al.
- Kod vermeden önce sözdizimini kontrol et.
- Parantezleri kontrol et.
- Süslü parantezleri kontrol et.
- Tırnakları kontrol et.
- Değişken isimlerini kontrol et.
- Fonksiyonların birbiriyle uyumunu kontrol et.
- Asenkron işlemlerde hata yönetimi kullan.
- Kullanıcı "olmadı" derse önceki çözümün neden çalışmadığını düşün.
- Aynı hatalı çözümü tekrar etme.
- Çalışan sistemi gereksiz yere değiştirme.

KODLAMA UZMANLIĞI:

JavaScript:

- JavaScript
- ES5
- ES6+
- let
- const
- var
- arrow functions
- destructuring
- spread
- rest
- template literals
- CommonJS
- modules
- async
- await
- Promise
- Promise.all
- fetch
- AbortController
- try/catch
- error handling
- DOM
- events
- event listeners
- localStorage
- sessionStorage
- JSON
- regex
- arrays
- objects
- classes
- inheritance
- closures
- callbacks
- debounce
- throttle
- APIs

Node.js:

- Node.js
- npm
- CommonJS
- require
- fs
- path
- process
- process.env
- dotenv
- fetch
- AbortController
- HTTP
- REST
- JSON
- file system
- environment variables
- debugging
- asynchronous programming

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
- routes
- error middleware
- CORS
- deployment
- Render
- health checks
- timeouts
- API error handling

HTML:

- HTML5
- semantic HTML
- forms
- input
- textarea
- button
- modal
- sidebar
- chat interface
- accessibility
- responsive design

CSS:

- CSS
- CSS variables
- Flexbox
- Grid
- media queries
- responsive design
- animations
- transitions
- modal
- sidebar
- chat UI
- gradients
- shadows
- mobile layouts

Python:

- Python
- variables
- functions
- lists
- tuples
- dictionaries
- sets
- classes
- files
- JSON
- APIs
- exceptions
- debugging
- automation

C#:

- C#
- variables
- methods
- classes
- objects
- inheritance
- interfaces
- enums
- arrays
- List
- Dictionary
- exceptions
- async
- Unity C#

Unity:

- Unity
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
- C# scripts
- Unity debugging

API:

- REST
- GET
- POST
- JSON
- headers
- Authorization
- Bearer tokens
- fetch
- HTTP status codes
- timeout
- retry
- API error handling
- environment variables

GitHub:

- repositories
- commits
- branches
- push
- pull
- files
- GitHub deployment
- project management

Render:

- Web Service
- Build Command
- Start Command
- Environment Variables
- PORT
- deployment
- logs
- restart
- health checks

DOSYA ANALİZİ:

- Kullanıcı bir dosya yüklediğinde dosyanın adını ve türünü değerlendir.
- Dosyanın içeriği bağlama verilmişse içeriğini analiz et.
- Kod dosyalarında hataları bul.
- Metin dosyalarını özetleyebil.
- JSON dosyalarını analiz edebil.
- HTML/CSS/JS dosyalarını inceleyebil.
- Dosyanın tamamı verilmemişse bunu belirt.
- Dosyada olmayan bilgileri uydurma.
- Görsel veya ikili dosyanın içeriği okunamıyorsa bunu açıkça belirt.

HATA AYIKLAMA:

Aşağıdaki hataları tanı ve çöz:

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
- CSS errors
- DOM errors

HATA GELDİĞİNDE:

1. Hata türünü belirle.
2. Hatanın kaynağını belirle.
3. Nedenini açıkla.
4. En güvenli çözümü ver.
5. Gerekirse düzeltilmiş kodu eksiksiz ver.
6. Mevcut özelliklerin bozulup bozulmayacağını kontrol et.
7. Kullanıcının yapacağı işlemleri sırayla anlat.

ERENCANAI:

- Projenin adı ErencanAI.
- Backend Node.js + Express kullanır.
- Yapay zeka Groq API kullanır.
- Ana model openai/gpt-oss-20b'dir.
- memory.json kalıcı hafıza olarak kullanılır.
- Frontend index.html, app.js ve style.css dosyalarından oluşur.
- Dosya yükleme sistemi vardır.
- Yeni özellikler mevcut sistemi bozmadan eklenmelidir.
- Gelecekte ses, görsel, video ve araştırma özellikleri eklenebilir.

CEVAP KALİTESİ:

- Doğru.
- Doğal.
- Hızlı.
- Anlaşılır.
- Faydalı.
- Güncel.
- Teknik olarak mümkün.
- Gereksiz özgüven göstermeyen.
- Kullanıcının seviyesine uyum sağlayan.

EMOJİ:

- Gerektiğinde kullan.
- Teknik cevaplarda abartma.
- Başarı: ✅
- Hata: ❌
- Uyarı: ⚠️
- Bilgi: 🔎
- Fikir: 💡
- Kod: 💻
- Unity: 🎮

EN ÖNEMLİ KURAL:

ÇALIŞAN SİSTEMİ GEREKSİZ YERE BOZMA.
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

function addMemory(
    role,
    content
) {

    const cleanContent =
        String(
            content || ""
        ).trim();

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
   KULLANICI ADI BUL
========================================================= */

function findUserName(text) {

    const value =
        String(
            text || ""
        ).trim();

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
   SON KULLANICI ADI
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
   TARİH / SAAT
========================================================= */

function getCurrentDateTime() {

    const now =
        new Date();

    const date =
        now.toLocaleDateString(
            "tr-TR",
            {
                timeZone: "Europe/Istanbul",
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long"
            }
        );

    const time =
        now.toLocaleTimeString(
            "tr-TR",
            {
                timeZone: "Europe/Istanbul",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

    return {
        iso:
            now.toISOString(),

        date:
            date,

        time:
            time
    };
}

/* =========================================================
   GÜNCEL SORU MU?
========================================================= */

function needsWebSearch(text) {

    const value =
        String(
            text || ""
        )
        .toLocaleLowerCase(
            "tr-TR"
        );

    const keywords = [

        "bugün",
        "bugunku",
        "şu an",
        "şuan",
        "şimdiki",
        "güncel",
        "güncel mi",
        "en son",
        "son durum",
        "son dakika",
        "haber",
        "haberler",
        "kim kazandı",
        "kim kazandi",
        "kim şampiyon",
        "kim sampiyon",
        "ne oldu",
        "kaç oldu",
        "kac oldu",
        "hangi takım kazandı",
        "hangi takim kazandi",
        "dünya kupası",
        "dunya kupasi",
        "ligde",
        "puan durumu",
        "transfer",
        "transfer oldu",
        "şu anda",
        "şuanki",
        "şimdilik",
        "2026",
        "2025",
        "2027",
        "bu hafta",
        "bu ay",
        "bu yıl",
        "bu yil",
        "yarın",
        "yarin",
        "dün",
        "dun",
        "kaç gün",
        "kaç hafta",
        "ne zaman",
        "latest",
        "today",
        "current",
        "recent",
        "latest news"
    ];

    return keywords.some(
        keyword =>
            value.includes(keyword)
    );
}

/* =========================================================
   DOSYA TÜRÜ KONTROLÜ
========================================================= */

function isReadableTextFile(
    file
) {

    if (!file) {
        return false;
    }

    const extension =
        path.extname(
            file.originalname || ""
        )
        .toLowerCase();

    const allowedExtensions = [

        ".txt",
        ".json",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".html",
        ".htm",
        ".css",
        ".scss",
        ".md",
        ".csv",
        ".xml",
        ".yml",
        ".yaml",
        ".py",
        ".java",
        ".c",
        ".cpp",
        ".h",
        ".hpp",
        ".cs",
        ".php",
        ".sql",
        ".sh",
        ".bat",
        ".env",
        ".ini",
        ".log"
    ];

    return allowedExtensions.includes(
        extension
    );
}

/* =========================================================
   DOSYA İÇERİĞİ OKU
========================================================= */

function readUploadedFile(
    file
) {

    if (!file) {
        return null;
    }

    if (
        !isReadableTextFile(
            file
        )
    ) {

        return {
            readable: false,
            content: ""
        };
    }

    try {

        const stat =
            fs.statSync(
                file.path
            );

        const maxReadable =
            500000;

        const bytesToRead =
            Math.min(
                stat.size,
                maxReadable
            );

        const buffer =
            Buffer.alloc(
                bytesToRead
            );

        const fd =
            fs.openSync(
                file.path,
                "r"
            );

        fs.readSync(
            fd,
            buffer,
            0,
            bytesToRead,
            0
        );

        fs.closeSync(fd);

        let content =
            buffer.toString(
                "utf8"
            );

        if (
            stat.size >
            maxReadable
        ) {

            content +=
                "\n\n[DOSYA ÇOK BÜYÜK: İlk 500 KB okundu.]";
        }

        return {
            readable: true,
            content: content
        };

    } catch (error) {

        console.error(
            "DOSYA OKUMA HATASI:",
            error.message
        );

        return {
            readable: false,
            content: ""
        };
    }
}

/* =========================================================
   CEVAP TEMİZLE
========================================================= */

function cleanReply(text) {

    let reply =
        String(
            text || ""
        ).trim();

    if (!reply) {
        return "";
    }

    try {

        const parsed =
            JSON.parse(
                reply
            );

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
   TIMEOUT FETCH
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
            function () {

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

        clearTimeout(
            timeout
        );
    }
}

/* =========================================================
   GROQ İSTEĞİ
========================================================= */

async function requestGroq(
    messages,
    useWebSearch
) {

    const body = {

        model:
            GROQ_MODEL,

        messages:
            messages,

        temperature:
            0.25,

        max_completion_tokens:
            1600,

        stream:
            false
    };

    /*
       Güncel soru ise Groq Browser Search kullan.
       GPT-OSS 20B bunu destekliyor.
    */

    if (useWebSearch) {

        body.tool_choice =
            "required";

        body.tools = [
            {
                type:
                    "browser_search"
            }
        ];
    }

    return fetchWithTimeout(
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
                JSON.stringify(
                    body
                )
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
    express.json(
        {
            limit:
                "2mb"
        }
    )
);

app.use(
    express.static(
        __dirname
    )
);

app.use(
    "/uploads",
    express.static(
        UPLOAD_DIR
    )
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
   DOSYA YÜKLEME
========================================================= */

app.post(
    "/api/upload",

    upload.single("file"),

    function (
        req,
        res
    ) {

        try {

            if (!req.file) {

                return res.status(
                    400
                ).json({

                    ok:
                        false,

                    reply:
                        "Lütfen bir dosya seç."
                });
            }

            console.log(
                "DOSYA YÜKLENDİ:",
                req.file.originalname
            );

            const readable =
                isReadableTextFile(
                    req.file
                );

            return res.json({

                ok:
                    true,

                message:
                    "Dosya başarıyla yüklendi.",

                file: {

                    originalName:
                        req.file.originalname,

                    fileName:
                        req.file.filename,

                    size:
                        req.file.size,

                    mimeType:
                        req.file.mimetype,

                    readable:
                        readable,

                    url:
                        "/uploads/" +
                        encodeURIComponent(
                            req.file.filename
                        )
                }
            });

        } catch (error) {

            console.error(
                "DOSYA YÜKLEME HATASI:",
                error
            );

            return res.status(
                500
            ).json({

                ok:
                    false,

                reply:
                    "Dosya yüklenirken bir hata oluştu."
            });
        }
    }
);

/* =========================================================
   DOSYA YÜKLEME HATA MIDDLEWARE
========================================================= */

app.use(
    "/api/upload",

    function (
        error,
        req,
        res,
        next
    ) {

        console.error(
            "DOSYA API HATASI:",
            error
        );

        if (
            error instanceof
            multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(
                    400
                ).json({

                    ok:
                        false,

                    reply:
                        "Dosya çok büyük. En fazla 10 MB yükleyebilirsin."
                });
            }

            return res.status(
                400
            ).json({

                ok:
                    false,

                reply:
                    "Dosya yükleme hatası."
            });
        }

        return res.status(
            500
        ).json({

            ok:
                false,

            reply:
                "Dosya yüklenirken beklenmeyen bir hata oluştu."
        });
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

        const current =
            getCurrentDateTime();

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

            endpoint:
                "/api/chat",

            fileUpload:
                true,

            webSearch:
                true,

            currentDate:
                current.date,

            currentTime:
                current.time,

            maxFileSize:
                "10 MB"
        });
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

            let message =
                String(
                    req.body &&
                    req.body.message
                        ? req.body.message
                        : ""
                ).trim();

            /*
               Frontend isterse dosya bilgisini
               JSON olarak gönderebilir.
            */

            let uploadedFile =
                null;

            if (
                req.body &&
                req.body.file
            ) {

                uploadedFile =
                    req.body.file;
            }

            /* ---------------------------------------------
               MESAJ KONTROLÜ
            --------------------------------------------- */

            if (!message) {

                return res.status(
                    400
                ).json({

                    ok:
                        false,

                    reply:
                        "Lütfen bir mesaj yaz."
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
                        "Mesaj çok uzun. Lütfen daha kısa bir mesaj gönder."
                });
            }

            /* ---------------------------------------------
               API KEY
            --------------------------------------------- */

            if (!GROQ_API_KEY) {

                console.error(
                    "GROQ API KEY BULUNAMADI."
                );

                return res.status(
                    500
                ).json({

                    ok:
                        false,

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

            /* ---------------------------------------------
               HAFIZA
            --------------------------------------------- */

            addMemory(
                "user",
                message
            );

            /* ---------------------------------------------
               İSİM SİSTEMİ
            --------------------------------------------- */

            const newName =
                findUserName(
                    message
                );

            const askingName =
                /(?:benim\s+adım|benim\s+ismim|ismim|adım)\s+ne(?:ydi)?/i
                    .test(
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

                    ok:
                        true,

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

                        ok:
                            true,

                        reply:
                            reply,

                        timeMs:
                            Date.now() -
                            startTime
                    });
                }
            }

            /* ---------------------------------------------
               TARİH
            --------------------------------------------- */

            const current =
                getCurrentDateTime();

            /* ---------------------------------------------
               GÜNCEL BİLGİ KONTROLÜ
            --------------------------------------------- */

            const webSearch =
                needsWebSearch(
                    message
                );

            console.log(
                "GÜNCEL SORU:",
                webSearch
                    ? "EVET"
                    : "HAYIR"
            );

            if (webSearch) {

                console.log(
                    "WEB ARAŞTIRMASI: AKTİF"
                );
            }

            /* ---------------------------------------------
               SON MESAJLAR
            --------------------------------------------- */

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
                },

                {

                    role:
                        "system",

                    content:
                        `
ŞU ANKİ TARİH VE SAAT:

Tarih:
${current.date}

Saat:
${current.time}

ISO:
${current.iso}

Zaman dilimi:
Europe/Istanbul

Bu tarih ve saati güncel zaman bilgisi olarak kabul et.
`
                }
            ];

            /* ---------------------------------------------
               WEB ARAŞTIRMASI TALİMATI
            --------------------------------------------- */

            if (webSearch) {

                messages.push({

                    role:
                        "system",

                    content:
                        `
Bu soru güncel bilgi gerektirebilir.

Web araması etkin.
Gerekli güncel bilgiyi web araştırmasından kontrol et.

Özellikle:
- tarihleri
- güncel sonuçları
- son haberleri
- spor sonuçlarını
- şampiyonları
- güncel teknoloji bilgilerini
- güncel kişi/kurum bilgilerini
- 2026 yılı olaylarını

eski model bilgisinden tahmin etmek yerine araştırma sonuçlarına göre değerlendir.

Eğer web araştırması sonucu mevcutsa, cevabı araştırma sonucuna göre oluştur.
`
                });
            }

            /* ---------------------------------------------
               YÜKLENEN DOSYA
            --------------------------------------------- */

            if (uploadedFile) {

                messages.push({

                    role:
                        "system",

                    content:
                        `
KULLANICI BİR DOSYA YÜKLEDİ.

Dosya adı:
${String(
    uploadedFile.originalName ||
    uploadedFile.fileName ||
    "Bilinmeyen dosya"
)}

Dosya türü:
${String(
    uploadedFile.mimeType ||
    "Bilinmeyen"
)}

Dosya boyutu:
${String(
    uploadedFile.size ||
    "Bilinmeyen"
)} byte

Dosya içeriği ayrıca verilmişse analiz et.
İçerik verilmemişse dosyanın yalnızca metadata bilgilerinin bulunduğunu kabul et.
`
                });
            }

            /* ---------------------------------------------
               HAFIZA BAĞLAMI
            --------------------------------------------- */

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

            /* ---------------------------------------------
               GROQ
            --------------------------------------------- */

            console.log(
                "GROQ İSTEĞİ GÖNDERİLİYOR..."
            );

            let response;

            try {

                response =
                    await requestGroq(
                        messages,
                        webSearch
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

                    return res.status(
                        504
                    ).json({

                        ok:
                            false,

                        reply:
                            "Groq yanıt vermek için çok uzun süre bekledi. Lütfen tekrar dene."
                    });
                }

                return res.status(
                    502
                ).json({

                    ok:
                        false,

                    reply:
                        "Groq bağlantısı kurulamadı. Sunucu bağlantısını kontrol et."
                });
            }

            /* ---------------------------------------------
               GROQ HTTP CEVABI
            --------------------------------------------- */

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
                        3000
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
                    403
                ) {

                    errorMessage =
                        "Groq bu isteğe izin vermedi.";
                }

                if (
                    response.status ===
                    429
                ) {

                    errorMessage =
                        "Groq kullanım limiti aşıldı. Biraz sonra tekrar dene.";
                }

                return res.status(
                    502
                ).json({

                    ok:
                        false,

                    reply:
                        errorMessage
                });
            }

            /* ---------------------------------------------
               JSON
            --------------------------------------------- */

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
                        3000
                    )
                );

                return res.status(
                    502
                ).json({

                    ok:
                        false,

                    reply:
                        "Groq geçerli bir JSON cevap göndermedi."
                });
            }

            /* ---------------------------------------------
               CEVAP
            --------------------------------------------- */

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
                        typeof
                        choice.message.content ===
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

            /* ---------------------------------------------
               TEMİZLE
            --------------------------------------------- */

            reply =
                cleanReply(
                    reply
                );

            /* ---------------------------------------------
               BOŞ CEVAP
            --------------------------------------------- */

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

                return res.status(
                    502
                ).json({

                    ok:
                        false,

                    reply:
                        "ErencanAI boş cevap aldı. Lütfen tekrar dene."
                });
            }

            /* ---------------------------------------------
               HAFIZAYA EKLE
            --------------------------------------------- */

            addMemory(
                "assistant",
                reply
            );

            /* ---------------------------------------------
               SÜRE
            --------------------------------------------- */

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

            /* ---------------------------------------------
               CEVAP
            --------------------------------------------- */

            return res.json({

                ok:
                    true,

                reply:
                    reply,

                timeMs:
                    elapsed,

                webSearch:
                    webSearch,

                currentDate:
                    current.date,

                currentTime:
                    current.time
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

            return res.status(
                500
            ).json({

                ok:
                    false,

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
   HAFIZA TEMİZLEME
========================================================= */

app.post(
    "/api/clear-memory",
    function (
        req,
        res
    ) {

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
                "Bu ErencanAI API adresi bulunamadı."
        });
    }
);

/* =========================================================
   GENEL HATA
========================================================= */

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        console.error(
            "EXPRESS HATASI:",
            error
        );

        return res.status(
            500
        ).json({

            ok:
                false,

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

        const current =
            getCurrentDateTime();

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
            "UPLOAD: /api/upload"
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
            "WEB SEARCH: AKTİF"
        );

        console.log(
            "DOSYA YÜKLEME: AKTİF"
        );

        console.log(
            "MAX DOSYA: 10 MB"
        );

        console.log(
            "TARİH: " +
            current.date
        );

        console.log(
            "SAAT: " +
            current.time
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
