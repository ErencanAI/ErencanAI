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
   HAFIZA
========================================================= */

const MEMORY_FILE =
    path.join(
        __dirname,
        "memory.json"
    );

const MAX_MEMORY_MESSAGES = 400;

/*
   Modele gönderilecek son konuşma sayısı.
*/
const CONTEXT_MESSAGES = 30;

/* =========================================================
   API AYARLARI
========================================================= */

const REQUEST_TIMEOUT = 30000;

const MAX_RETRIES = 2;

const MAX_MESSAGE_LENGTH = 12000;

const MAX_REPLY_LENGTH = 30000;

/* =========================================================
   TARİH / ZAMAN
========================================================= */

/*
   ErencanAI her istekte sunucunun güncel
   tarih ve saat bilgisini modele gönderir.

   Böylece model:
   - bugünün tarihini
   - yılı
   - ayı
   - günü
   - saati
   bilir.

   Not:
   Bu internet erişimi değildir.
*/
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

==============================
TEMEL KİMLİK
==============================

- Adın ErencanAI.
- Kullanıcıyla doğal şekilde konuş.
- Ana dilin Türkçedir.
- Kullanıcı başka bir dil kullanırsa gerekirse o dile uyum sağlayabilirsin.
- Kullanıcının konuşma tarzını anlayıp uygun şekilde cevap ver.
- Samimi ol ama gereksiz yere aşırı samimi olma.
- Saygılı ol.
- Kullanıcı hata yaptığında küçümseme.
- Kullanıcı sinirliyse gereksiz şekilde uzatma.

==============================
EN ÖNEMLİ KURALLAR
==============================

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

==============================
GÜNCEL TARİH SİSTEMİ
==============================

Sana her istekte güncel Türkiye tarih ve saat bilgisi ayrıca verilecektir.

Bu bilgiyi gerçek kabul et.

Ancak:

- Tarih bilgisi = mevcut zaman bilgisi.
- İnternet erişimi = güncel haber, skor, fiyat, sonuç ve web verisi.

Tarih bilgisinin verilmiş olması internete erişebildiğin anlamına gelmez.

Örneğin:

Eğer mevcut tarih 2026 ise,
2026 yılında gerçekleşmiş bir Dünya Kupası finalini
"henüz oynanmadı" şeklinde anlatma.

Eğer mevcut tarih olayın tarihinden sonraysa,
olayın gerçekleşmiş olabileceğini dikkate al.

Eğer olayın sonucu sistem tarafından doğrulanmış şekilde verilmemişse,
sonucu uydurma.

==============================
CEVAP TARZI
==============================

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

Gereksiz:
- Tekrar
- Giriş cümlesi
- Sonuç tekrarı
- Aynı açıklamanın farklı versiyonları

kullanma.

==============================
DOĞRULUK
==============================

Özellikle şu konularda dikkatli ol:

- Güncel haberler
- Spor sonuçları
- Dünya Kupası
- Futbol
- Transferler
- Teknoloji
- Yazılım sürümleri
- Fiyatlar
- Tarihler
- Hava durumu
- Politik gelişmeler
- Şirket haberleri
- Güncel kişiler
- Güncel etkinlikler

Modelin eğitim bilgisinde olmayan bir bilgi için
kesin konuşma.

==============================
AKIL YÜRÜTME
==============================

Soruyu önce doğru anlamaya çalış.

Teknik problem varsa:

1. Hatanın ne olduğunu belirle.
2. Kaynağını belirle.
3. En olası nedeni belirle.
4. Çözümü sırala.
5. Gerekirse tam kod ver.
6. Çözümün mevcut sistemi bozup bozmayacağını düşün.

Kullanıcı "olmadı" derse:
- Aynı çözümü körü körüne tekrar etme.
- Yeni olası nedeni değerlendir.

==============================
KODLAMA
==============================

JavaScript:

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

Node.js:

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

Express:

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

Python:

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

GitHub:

- repository
- commit
- branch
- push
- pull
- dosya yönetimi
- deployment

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

==============================
ERENCANAI PROJESİ
==============================

Proje:
ErencanAI

Backend:
Node.js + Express

AI:
Groq

Model:
openai/gpt-oss-20b

Hafıza:
memory.json

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

Mevcut çalışan sistemi gereksiz yere değiştirme.

==============================
HAFIZA
==============================

Hafızadaki bilgileri gerektiğinde kullan.

Ancak:

- Kullanıcıya ait olmayan bilgileri kullanıcıya aitmiş gibi söyleme.
- Hafızadaki eski bilgileri güncel gerçek olarak kabul etme.
- Yeni bilgi eski bilgiyle çelişirse yeni bilgiyi dikkate al.
- Kullanıcının açıkça söylediği isim gibi basit bilgileri hatırlayabilirsin.
- Gizli bilgileri cevapta gösterme.

==============================
GÜVENLİ KODLAMA
==============================

API anahtarını asla gösterme.

.env içindeki gizli bilgileri asla yazdırma.

API anahtarını istemciye gönderme.

Kod içine gerçek API anahtarı koyma.

Şifreleri ve tokenları cevapta gösterme.

==============================
HATA AYIKLAMA
==============================

Şunları tanıyabil:

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

==============================
EMOJİ
==============================

Uygunsa kullan.

Teknik cevaplarda azalt.

Başarılı:
✅

Hata:
❌

Uyarı:
⚠️

Bilgi:
🔎

Fikir:
💡

Kod:
💻

Unity:
🎮

==============================
SON HEDEF
==============================

DOĞRU
DOĞAL
HIZLI
GÜNCEL TARİH BİLGİSİNİ DİKKATE ALAN
ANLAŞILIR
FAYDALI

cevaplar üret.

Mevcut çalışan sistemi gereksiz yere bozma.
`.trim();

/* =========================================================
   HAFIZA DEĞİŞKENİ
========================================================= */

let memory = [];

/* =========================================================
   HAFIZA YÜKLE
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
   İSİM BUL
========================================================= */

function findUserName(text) {

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
   SON KULLANICI ADINI BUL
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

function cleanReply(text) {

    let reply =
        String(
            text || ""
        ).trim();

    if (
        !reply
    ) {

        return "";
    }

    /*
       JSON cevap geldiyse düz metne çevir.
    */

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

        /*
           Normal metin.
        */
    }

    /*
       Markdown code fence.
    */

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

    /*
       Gereksiz AI etiketleri.
    */

    reply =
        reply.replace(
            /^(ErencanAI|AI|Assistant)\s*:\s*/i,
            ""
        ).trim();

    /*
       Aşırı uzun cevap koruması.
    */

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

                                /*
                                   Dengeli yaratıcılık.
                                */

                                temperature:
                                    0.20,

                                /*
                                   Modelin cevap için
                                   yeterli alanı olsun.
                                */

                                max_tokens:
                                    1200,

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

            /*
               Yetki hatalarında
               tekrar denemeye gerek yok.
            */

            if (
                error.status === 401 ||
                error.status === 403
            ) {

                break;
            }

            /*
               Son deneme değilse bekle.
            */

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
   BAŞLANGIÇ
========================================================= */

memory =
    loadMemory();

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

            endpoint:
                "/api/chat",

            currentDate:
                dateInfo.turkey,

            year:
                dateInfo.year
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

            /* -----------------------------------------
               MESAJ KONTROLÜ
            ----------------------------------------- */

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

            /* -----------------------------------------
               API KEY
            ----------------------------------------- */

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

            /* -----------------------------------------
               TARİH
            ----------------------------------------- */

            const dateInfo =
                getCurrentDateInfo();

            console.log(
                "TÜRKİYE TARİHİ:",
                dateInfo.turkey
            );

            /* -----------------------------------------
               KULLANICI HAFIZASI
            ----------------------------------------- */

            addMemory(
                "user",
                message
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

            if (
                askingName
            ) {

                const userName =
                    getLastUserName();

                if (
                    userName
                ) {

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

            /* -----------------------------------------
               BAĞLAM
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
Güncel haber, skor veya son dakika bilgisi
gerekiyorsa doğrulanmış veri yoksa uydurma.
                        `.trim()
                }

            ];

            /*
               Eski konuşmaları ekle.
            */

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
               TEMİZLE
            ----------------------------------------- */

            reply =
                cleanReply(
                    reply
                );

            /* -----------------------------------------
               BOŞ CEVAP
            ----------------------------------------- */

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
               HAFIZA
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
                    dateInfo.turkey
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
                error.status ===
                401 ||
                error.status ===
                403
            ) {

                userMessage =
                    "Groq API anahtarı geçersiz veya yetkisiz.";
            }

            /* -----------------------------------------
               RATE LIMIT
            ----------------------------------------- */

            else if (
                error.status ===
                429
            ) {

                userMessage =
                    "Groq kullanım sınırına ulaşıldı. Biraz sonra tekrar dene.";
            }

            /* -----------------------------------------
               SERVER
            ----------------------------------------- */

            else if (
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
   HAFIZA
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
   HAFIZA TEMİZLE
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

            currentDate:
                dateInfo.turkey,

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
            "AI: Groq"
        );

        console.log(
            "MODEL:",
            GROQ_MODEL
        );

        console.log(
            "HAFIZA:",
            memory.length +
            " mesaj"
        );

        console.log(
            "API KEY:",
            GROQ_API_KEY
                ? "BULUNDU"
                : "BULUNAMADI"
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
