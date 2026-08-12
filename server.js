"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

/* =========================================================
SUNUCU
========================================================= */

const PORT =
    Number(process.env.PORT) || 3000;

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
ESKİ HAFIZA
========================================================= */

const MEMORY_FILE =
    path.join(
        __dirname,
        "memory.json"
    );

const MAX_MEMORY_MESSAGES =
    400;

const CONTEXT_MESSAGES =
    30;

/* =========================================================
KULLANICIYA ÖZEL HAFIZA
========================================================= */

const USERS_MEMORY_FILE =
    path.join(
        __dirname,
        "users_memory.json"
    );

const MAX_USER_MEMORY_MESSAGES =
    400;

const USER_CONTEXT_MESSAGES =
    30;

/* =========================================================
API AYARLARI
========================================================= */

const REQUEST_TIMEOUT =
    30000;

const MAX_RETRIES =
    2;

const MAX_MESSAGE_LENGTH =
    12000;

const MAX_REPLY_LENGTH =
    30000;

/* =========================================================
TARİH / ZAMAN
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
GELİŞMİŞ SİSTEM PROMPTU
========================================================= */

const SYSTEM_PROMPT = `
Sen ErencanAI adlı gelişmiş, hızlı, doğal, güvenilir ve yardımcı bir yapay zeka asistanısın.

TEMEL KİMLİK:

- Adın ErencanAI.
- Kullanıcıyla doğal şekilde konuş.
- Ana dilin Türkçedir.
- Kullanıcının kullandığı dili otomatik olarak algıla.
- Kullanıcı hangi dilde yazıyorsa mümkün olduğunca aynı dilde cevap ver.
- Kullanıcı dil değiştirirse sen de dili değiştir.
- Kullanıcı birden fazla dil kullanıyorsa sorunun ağırlıklı olduğu dili kullan.
- Kullanıcı özellikle başka bir dil isterse o dili kullan.
- Çeviri istenmediği sürece kullanıcının mesajını gereksiz yere başka dile çevirme.
- Cevap verirken seçilen dili doğal ve akıcı şekilde kullan.
- Kelime kelime çeviri gibi yapay ifadeler kullanma.
- Dilin doğal konuşma kurallarına, dil bilgisine ve yazımına dikkat et.
- Bir dilde yeterince emin değilsen uydurma; mümkün olduğunca doğru ve anlaşılır ifade kullan.

DESTEKLENEN YAYGIN DİLLER:

Türkçe
İngilizce
Almanca
Fransızca
İspanyolca
İtalyanca
Portekizce
Brezilya Portekizcesi
Rusça
Ukraynaca
Lehçe
Felemenkçe
İsveççe
Norveççe
Danca
Fince
Çekçe
Slovakça
Macarca
Romence
Bulgarca
Yunanca
Sırpça
Hırvatça
Boşnakça
Slovence
Arapça
İbranice
Farsça
Hintçe
Urduca
Bengalce
Pencapça
Marathi
Tamilce
Teluguca
Endonezce
Malayca
Vietnamca
Tayca
Çince
Basitleştirilmiş Çince
Geleneksel Çince
Japonca
Korece

Bu dillerden biriyle konuşulduğunda mümkün olduğunca o dilde doğal cevap ver.

DİL KURALLARI:

1. Kullanıcının kullandığı dili otomatik algıla.
2. Aynı dilde cevap vermeyi tercih et.
3. Kullanıcı açıkça dil değiştirirse hemen uyum sağla.
4. Kullanıcı "İngilizce konuş" derse İngilizce konuş.
5. Kullanıcı "Türkçe konuş" derse Türkçe konuş.
6. Kullanıcı "Almanca cevapla" derse Almanca cevapla.
7. Kullanıcı çeviri isterse istenen hedef dile çevir.
8. Çeviri sırasında anlamı koru.
9. Özel isimleri gereksiz yere değiştirme.
10. Kod içindeki programlama sözdizimini bozma.
11. Teknik terimleri gerektiğinde orijinal halleriyle kullan.
12. Dil değişimi için kullanıcıdan tekrar tekrar izin isteme.
13. Kullanıcının dilini yanlış algılarsan sonraki mesajdaki dili takip et.

DOĞAL KONUŞMA:

- Samimi ol ama gereksiz yere aşırı samimi olma.
- Saygılı ol.
- Kullanıcı hata yaptığında küçümseme.
- Kullanıcı sinirliyse gereksiz şekilde uzatma.
- Kullanıcının konuşma tarzını anlayıp uygun şekilde cevap ver.
- Gereksiz emoji kullanma.
- Kullanıcı kısa cevap istiyorsa kısa cevap ver.

DOĞRULUK:

1. Bilmediğin bilgiyi uydurma.
2. Emin olmadığın bilgiyi kesin gerçek gibi söyleme.
3. Güncel bilgi gerektiğinde mevcut tarih bilgisini kullan.
4. Tarihleri birbirine karıştırma.
5. Geçmiş olayları gelecekteymiş gibi anlatma.
6. Gelecekteki olayları gerçekleşmiş gibi anlatma.
7. Bir olayın gerçekleşip gerçekleşmediğini mevcut tarih ile karşılaştır.
8. Kullanıcı "bugün", "dün", "yarın", "şu an", "bu yıl" gibi ifadeler kullanırsa mevcut tarih bilgisini dikkate al.
9. Kullanıcı belirli bir tarih sorarsa tarihi açıkça belirt.
10. Güncel internet bilgisine sahip olmadığın durumda bunu dürüstçe belirt.
11. İnternetten doğrulanması gereken bilgileri uydurma.
12. Kullanıcı daha önce konuşulan bir konuyu devam ettiriyorsa bağlamı kullan.

TARİH:

Sana her istekte güncel Türkiye tarih ve saat bilgisi ayrıca verilecektir.

Bu bilgi mevcut zaman bilgisidir.

Ancak:

- Tarih bilgisi internet erişimi değildir.
- Güncel haber, spor sonucu, fiyat, hava durumu veya başka internet verisi doğrulanmamışsa uydurma.

CEVAP UZUNLUĞU:

Basit soru:
- 1-3 cümle.

Normal soru:
- Gerektiği kadar açıklama.

Teknik soru:
- Gerektiğinde numaralı adımlar.

Kod isteği:
- Eksiksiz ve çalışabilir kod.

"Sadece ne yapacağımı söyle":
- Yalnızca uygulanacak adımları ver.

"Baştan sona kodu ver":
- Dosyanın tamamını ver.

Kullanıcı detay isterse:
- Detaylandır.

Kullanıcı kısa isterse:
- Kısa cevap ver.

Gereksiz tekrar yapma.

TEKNİK PROBLEM ÇÖZME:

1. Hatanın ne olduğunu belirle.
2. Kaynağını belirle.
3. En olası nedeni belirle.
4. Çözümü sırala.
5. Gerekirse tam kod ver.
6. Çözümün mevcut sistemi bozup bozmayacağını düşün.

Kullanıcı "olmadı" derse:
- Aynı çözümü körü körüne tekrar etme.
- Yeni olası nedeni değerlendir.

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
- hata yönetimi

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
- chat arayüzü
- responsive yapı
- accessibility

CSS:

- Flexbox
- Grid
- responsive tasarım
- media query
- animation
- transition
- modal
- sidebar
- chat UI
- gradients
- shadows

PYTHON:

- değişkenler
- fonksiyonlar
- listeler
- dictionary
- class
- dosya işlemleri
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
- dosya yönetimi
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

PROJE:

Proje:
ErencanAI

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

Test:
GET /api/test

Health:
GET /api/health

HAFIZA:

ErencanAI kullanıcıya özel hafıza sistemi kullanır.

Her kullanıcının hafızası ayrı tutulmalıdır.

Bir kullanıcının bilgilerini başka kullanıcıya aktarma.

Kullanıcının kimliği USER-ID sistemiyle belirlenir.

Kullanıcıya özel hafızadaki bilgiler yalnızca o kullanıcı için bağlam olarak kullanılmalıdır.

Kullanıcı adı gibi basit bilgiler hatırlanabilir.

Yeni bilgi eski bilgiyle çelişiyorsa yeni bilgiyi dikkate al.

Gizli bilgileri cevapta gösterme.

API anahtarını asla gösterme.

.env içindeki gizli bilgileri asla yazdırma.

Kod içine gerçek API anahtarı koyma.

GÜVENLİK:

API anahtarını asla gösterme.

.env içindeki gizli bilgileri asla yazdırma.

API anahtarını istemciye gönderme.

Şifreleri ve tokenları cevapta gösterme.

HATA TANIMA:

SyntaxError
ReferenceError
TypeError
MODULE_NOT_FOUND
ENOENT
EACCES
fetch failed
ECONNREFUSED
ETIMEDOUT
AbortError
Headers Timeout Error
HTTP 400
HTTP 401
HTTP 403
HTTP 404
HTTP 429
HTTP 500
JSON parse errors
Express errors
DOM errors
CSS errors

SONUÇ:

DOĞRU
DOĞAL
HIZLI
ÇOK DİLLİ
KULLANICIYA ÖZEL HAFIZALI
GÜNCEL TARİH BİLGİSİNİ DİKKATE ALAN
ANLAŞILIR
FAYDALI

cevaplar üret.

Mevcut çalışan sistemi gereksiz yere bozma.
`.trim();

/* =========================================================
ESKİ HAFIZA
========================================================= */

let memory = [];

/* =========================================================
KULLANICI HAFIZALARI
========================================================= */

let userMemories = {};

/* =========================================================
ESKİ HAFIZA YÜKLE
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
ESKİ HAFIZA KAYDET
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
ESKİ HAFIZAYA EKLE
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
KULLANICI HAFIZASI DOSYASI OLUŞTUR
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
USER ID TEMİZLE
========================================================= */

function cleanUserId(value) {

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

function getUserId(req) {

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
İSİM BUL
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
            /(?:benim\s+adım|benim\s+ismim|adım|ismim)\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\b/i
        );

    if (
        match
    ) {

        return match[1];
    }

    return null;
}

/* =========================================================
KULLANICI HAFIZASINDAN İSİM BUL
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
ESKİ SİSTEM İÇİN İSİM
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
CEVAP TEMİZLE
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
                /^(ErencanAI|AI|Assistant)\s*:\s*/i,
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
            "\n\n[Yanıt çok uzundu ve kısaltıldı.]";
    }

    return reply;
}

/* =========================================================
GROQ İSTEĞİ
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
                                    1200,

                                reasoning_effort:
                                    "low",

                                reasoning_format:
                                    "hidden",

                                stream:
                                    false
                            }),

                        signal:
                            controller.signal
                    }
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
                    "Groq geçersiz JSON gönderdi."
                );
            }

            return data;

        } catch (error) {

            clearTimeout(
                timeout
            );

            lastError =
                error;

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
                    function (resolve) {

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
            "Groq bağlantısı kurulamadı."
        )
    );
}

/* =========================================================
BAŞLANGIÇ HAFIZALARI
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
            "2mb"
    })
);

app.use(
    express.static(
        __dirname
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

            currentDate:
                dateInfo.turkey,

            year:
                dateInfo.year,

            languages:
                "Çoklu dil desteği aktif",

            personalMemory:
                true
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
                        "Groq API anahtarı bulunamadı."
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

            console.log(
                "USER ID:",
                userId
            );

            const dateInfo =
                getCurrentDateInfo();

            console.log(
                "TÜRKİYE TARİHİ:",
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
               İSİM SİSTEMİ
            ----------------------------------------- */

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
                    " olarak hatırlayacağım.";

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
                        "Senin adın " +
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
               BAĞLAM
            ----------------------------------------- */

            const recentMessages =
                userMemory.slice(
                    -USER_CONTEXT_MESSAGES
                );

            /* -----------------------------------------
               GROQ MESAJLARI
            ----------------------------------------- */

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

KULLANICI DİLİ:

Kullanıcının son mesajındaki dili belirle.
Mümkünse cevabı aynı dilde ver.
Kullanıcı açıkça başka bir dil isterse o dile geç.

KULLANICI HAFIZASI:

Bu konuşma yalnızca USER ID:
${userId}

için geçerlidir.

Bu kullanıcının hafızasını başka kullanıcıların
hafızasıyla karıştırma.

Bu kullanıcıya ait geçmiş mesajları bağlam olarak
kullanabilirsin.
`
                        .trim()
                }
            ];

            for (
                const item of
                recentMessages
            ) {

                if (
                    !item ||
                    !item.content ||
                    typeof item.content !==
                    "string"
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
               CEVAP TEMİZLE
            ----------------------------------------- */

            reply =
                cleanReply(
                    reply
                );

            if (
                !reply
            ) {

                console.error(
                    "BOŞ GROQ CEVABI"
                );

                return res.status(
                    500
                ).json({

                    ok:
                        false,

                    reply:
                        "ErencanAI boş cevap verdi. Lütfen tekrar dene."
                });
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
               ESKİ HAFIZAYA DA KAYDET
               MEVCUT SİSTEM BOZULMASIN
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
                    userId
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
                "Sunucu bağlantı hatası.";

            if (
                error.name ===
                "AbortError"
            ) {

                userMessage =
                    "AI yanıtı zaman aşımına uğradı. Tekrar dene.";

            } else if (
                error.message &&
                error.message
                    .toLowerCase()
                    .includes("fetch")
            ) {

                userMessage =
                    "Groq bağlantısı kurulamadı. Sunucu bağlantısını kontrol et.";

            } else if (
                error.status ===
                401 ||
                error.status ===
                403
            ) {

                userMessage =
                    "Groq API anahtarı geçersiz veya yetkisiz.";

            } else if (
                error.status ===
                400
            ) {

                userMessage =
                    "Groq isteği geçersiz. Model veya API ayarlarını kontrol et.";

            } else if (
                error.status ===
                429
            ) {

                userMessage =
                    "Groq kullanım sınırına ulaşıldı. Biraz sonra tekrar dene.";

            } else if (
                error.status &&
                error.status >=
                500
            ) {

                userMessage =
                    "Groq sunucusunda geçici bir hata oluştu.";
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
ESKİ HAFIZA API
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
KULLANICI HAFIZASI TEMİZLE
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
                    ? "Bu kullanıcının ErencanAI hafızası temizlendi."
                    : "Kullanıcı hafızası temizlenemedi."
        });
    }
);

/* =========================================================
ESKİ HAFIZA TEMİZLE
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
                    ? "ErencanAI hafızası temizlendi."
                    : "Hafıza temizlenemedi."
        });
    }
);

/* =========================================================
SAĞLIK
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
                "ErencanAI",

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
                "Bu ErencanAI API adresi bulunamadı."
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
                "Sunucuda beklenmeyen bir hata oluştu."
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
            "ESKİ HAFIZA:",
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
            "ÇOKLU DİL:",
            "AKTİF"
        );

        console.log(
            "KULLANICIYA ÖZEL HAFIZA:",
            "AKTİF"
        );

        console.log(
            "TÜRKİYE TARİHİ:",
            dateInfo.turkey
        );

        console.log(
            "================================="
        );
    }
);
