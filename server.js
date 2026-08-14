"use strict";
require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
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
const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY ||
    "";
const GROQ_URL =
    "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL = "openai/gpt-oss-120b";

/* =========================================================
ARAŞTIRMA
========================================================= */

const SEARCH_URL =
    "https://html.duckduckgo.com/html/";
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
    0;

const MAX_MESSAGE_LENGTH =
    12000;

const MAX_REPLY_LENGTH =
    30000;

/* =========================================================
DOSYA YÜKLEME AYARLARI
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
UPLOADS KLASÖRÜ
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
        "UPLOADS KLASÖRÜ OLUŞTURULAMADI:",
        error.message
    );

}

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
- Kullanıcı özellikle başka bir dil isterse o dili kullan.
- Çeviri istenmediği sürece kullanıcının mesajını gereksiz yere başka dile çevirme.
- Cevap verirken seçilen dili doğal ve akıcı şekilde kullan.
- Kelime kelime çeviri gibi yapay ifadeler kullanma.
- Bir dilde yeterince emin değilsen uydurma.

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
3. Güncel bilgi gerektiğinde araştırma sonuçlarını kullan.
4. Araştırma sonuçları verilmişse onları öncelikli bilgi kaynağı olarak kullan.
5. Araştırma sonucunda yeterli bilgi yoksa bunu dürüstçe belirt.
6. Tarihleri birbirine karıştırma.
7. Geçmiş olayları gelecekteymiş gibi anlatma.
8. Gelecekteki olayları gerçekleşmiş gibi anlatma.
9. "bugün", "dün", "yarın", "şu an", "bu yıl" gibi ifadelerde mevcut tarih bilgisini dikkate al.
10. Güncel internet bilgisine sahip olmadığın durumda araştırma yapılmadıysa bunu belirt.
11. İnternetten doğrulanması gereken bilgileri uydurma.
12. Kullanıcı daha önce konuşulan bir konuyu devam ettiriyorsa bağlamı kullan.

İNTERNET ARAŞTIRMASI:

ErencanAI gerektiğinde internetten araştırma yapabilir.

Araştırma sonuçları mesajın içinde:

[İNTERNET ARAŞTIRMASI]
şeklinde verilebilir.

Araştırma sonuçları mevcutsa:

- Bilgileri dikkatlice değerlendir.
- Kaynak başlıklarını dikkate al.
- Güncel bilgilerde araştırma sonuçlarını öncelikli kullan.
- Kaynaklarda olmayan bilgileri uydurma.
- Çelişkili bilgiler varsa bunu belirt.
- Kullanıcıya gereksiz teknik araştırma ayrıntıları verme.
- Kaynak bilgisi istenirse kaynakları belirt.

HAVA DURUMU:

Hava durumu bilgisi verildiğinde:

- Konumu dikkate al.
- Güncel hava verisini kullan.
- Sıcaklık
- Yağış
- Rüzgar
- Nem
- Hava durumu açıklaması
gibi bilgileri kullanabilirsin.

Hava durumu verisi yoksa uydurma.

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

DOSYA:

ErencanAI dosya yükleme özelliğine sahiptir.

Desteklenen temel dosya türleri:

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

Maksimum dosya boyutu 10 MB'dır.

Dosyalar kullanıcı kimliğiyle ilişkilendirilir.

Bir kullanıcının dosyalarını başka kullanıcıya aktarma.

API anahtarını asla gösterme.

.env içindeki gizli bilgileri asla yazdırma.

Kod içine gerçek API anahtarı koyma.

PROJE:

Proje:
ErencanAI 8.00 PRO

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

Araştırma API:
POST /api/research

Hava durumu API:
GET /api/weather

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

GÜVENLİK:

API anahtarını asla gösterme.

.env içindeki gizli bilgileri asla yazdırma.

API anahtarını istemciye gönderme.

Şifreleri ve tokenları cevapta gösterme.

SONUÇ:

DOĞRU
DOĞAL
HIZLI
ÇOK DİLLİ
KULLANICIYA ÖZEL HAFIZALI
GÜNCEL BİLGİ ARAŞTIRABİLEN
HAVA DURUMU BİLGİSİ ALABİLEN
DOSYA YÜKLEYEBİLEN
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
DOSYA ADI TEMİZLE
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
            /[^a-zA-Z0-9ÇĞİÖŞÜçğıöşü._-]/g,
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
FETCH ZAMAN AŞIMI YARDIMCISI
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
HTML TEMİZLE
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
URL TEMİZLE
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
İNTERNET ARAŞTIRMASI GEREKİYOR MU?
========================================================= */

function shouldResearch(
    message
) {

    const text =
        String(
            message || ""
        ).toLowerCase()
        .trim();

    if (
        !text
    ) {

        return false;
    }

    const researchWords = [

        "araştır",
        "araştırır mısın",
        "internetten bak",
        "internetten araştır",
        "web'den bak",
        "webden bak",
        "internete bak",
        "kaynak bul",
        "kaynakları bul",
        "güncel bilgi",
        "güncel olarak",
        "son durum",
        "son gelişmeler",
        "en son",
        "şu an",
        "şuan",
        "şimdi",
        "bugün",
        "dün",
        "yarın",
        "bu hafta",
        "bu ay",
        "2026",
        "haber",
        "haberler",
        "son haberler",
        "latest",
        "current",
        "recent",
        "news",
        "what is happening",
        "what's happening"

    ];

    for (
        const word of researchWords
    ) {

        if (
            text.includes(
                word
            )
        ) {

            return true;
        }
    }

    const weatherWords = [

        "hava durumu",
        "hava nasıl",
        "hava kaç derece",
        "sıcaklık kaç",
        "yağmur yağacak mı",
        "yağmur yağar mı",
        "kar yağacak mı",
        "bugün hava",
        "yarın hava",
        "rüzgar kaç",
        "nem kaç",
        "weather",
        "temperature",
        "forecast"

    ];

    for (
        const word of weatherWords
    ) {

        if (
            text.includes(
                word
            )
        ) {

            return true;
        }
    }
  
    return false;
}

/* =========================================================
HAVA DURUMU SORUSU MU?
========================================================= */

function isWeatherQuestion(
    message
) {

    const text =
        String(
            message || ""
        ).toLowerCase();

    const words = [

        "hava durumu",
        "hava nasıl",
        "hava kaç derece",
        "sıcaklık kaç",
        "yağmur yağacak mı",
        "yağmur yağar mı",
        "kar yağacak mı",
        "bugün hava",
        "yarın hava",
        "rüzgar kaç",
        "nem kaç",
        "weather",
        "temperature",
        "forecast"

    ];

    return words.some(
        word =>
            text.includes(
                word
            )
    );
}

/* =========================================================
HAVA KONUMU BUL
========================================================= */

function extractWeatherLocation(
    message
) {

    const text =
        String(
            message || ""
        ).trim();

    const patterns = [

        /(.+?)\s+(?:hava durumu|hava nasıl|hava kaç derece)/i,

        /(.+?)\s+(?:için hava|içinde hava)/i,

        /(?:hava durumu|hava nasıl|hava kaç derece)\s+(?:olan\s+)?(.+)/i,

        /(?:weather|forecast)\s+(?:in|for)\s+(.+)/i

    ];

    for (
        const pattern of patterns
    ) {

        const match =
            text.match(
                pattern
            );

        if (
            match &&
            match[1]
        ) {

            let location =
                match[1]
                    .trim()
                    .replace(
                        /[?.!,]+$/g,
                        ""
                    );

            if (
                location.length >= 2 &&
                location.length <= 100
            ) {

                return location;
            }
        }
    }

    return "";
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
                "Arama motorundan boş sonuç geldi."
            );
        }

        const results = [];

        /*
            DuckDuckGo sonuçları
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
            Alternatif bağlantı taraması
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
            "WEB ARAMA SONUÇLARI:",
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
ARAŞTIRMA SONUCU OLUŞTUR
========================================================= */

async function researchWeb(
    query
) {

    console.log(
        "İNTERNET ARAŞTIRMASI:",
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
                "İnternette uygun arama sonucu bulunamadı.",

            sources:
                []

        };
    }

    const sourceTexts = [];
const trustedResults =
    results.filter(
        result =>
            result &&
            result.url &&
            result.title
    );
    for (
        const result of trustedResults.slice(
            0,
            3
        )
    ) {

        const pageText =
            await fetchPageText(
                result.url
            );

        sourceTexts.push({

            title:
                result.title,

            url:
                result.url,

            text:
                pageText

        });
    }

    let combined =
        "";

    for (
        const item of sourceTexts
    ) {

        combined +=
            "\n\nBAŞLIK: " +
            item.title +
            "\nURL: " +
            item.url;

        if (
            item.text
        ) {

            combined +=
                "\nİÇERİK: " +
                item.text;
        }
    }

    combined =
        combined.slice(
            0,
        14000
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
HAVA DURUMU ŞEHİR BUL
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
                "Hava durumu için şehir veya konum belirtilmedi."

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
                " için konum bulunamadı."

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
                        "ErencanAI/8.00"

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
HAVA KODU AÇIKLAMA
========================================================= */

function weatherCodeText(
    code
) {

    const map = {

        0:
            "Açık",

        1:
            "Çoğunlukla açık",

        2:
            "Parçalı bulutlu",

        3:
            "Kapalı",

        45:
            "Sisli",

        48:
            "Kırağılı sis",

        51:
            "Hafif çiseleme",

        53:
            "Orta şiddette çiseleme",

        55:
            "Yoğun çiseleme",

        61:
            "Hafif yağmur",

        63:
            "Orta şiddette yağmur",

        65:
            "Şiddetli yağmur",

        71:
            "Hafif kar",

        73:
            "Orta şiddette kar",

        75:
            "Yoğun kar",

        80:
            "Hafif sağanak",

        81:
            "Orta şiddette sağanak",

        82:
            "Şiddetli sağanak",

        95:
            "Gök gürültülü fırtına",

        96:
            "Dolu ihtimalli gök gürültülü fırtına",

        99:
            "Şiddetli dolu ihtimalli gök gürültülü fırtına"

    };

    return (
        map[code] ||
        "Bilinmeyen hava durumu"
    );
}

/* =========================================================
HAVA VERİSİNİ METNE ÇEVİR
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
[GÜNCEL HAVA DURUMU]

Konum:
${location.name || ""}, ${location.country || ""}

Saat dilimi:
${weather.timezone || ""}

Şu an:
${weatherCodeText(current.weather_code)}

Sıcaklık:
${current.temperature_2m ?? "Bilinmiyor"} °C

Hissedilen:
${current.apparent_temperature ?? "Bilinmiyor"} °C

Nem:
${current.relative_humidity_2m ?? "Bilinmiyor"} %

Yağış:
${current.precipitation ?? "Bilinmiyor"} mm

Yağmur:
${current.rain ?? "Bilinmiyor"} mm

Rüzgar:
${current.wind_speed_10m ?? "Bilinmiyor"} km/sa

Günlük tahmin:

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
Min ${daily.temperature_2m_min?.[i] ?? "?"} °C
Max ${daily.temperature_2m_max?.[i] ?? "?"} °C
Yağış ihtimali ${daily.precipitation_probability_max?.[i] ?? "?"} %
Durum ${weatherCodeText(daily.weather_code?.[i])}

`;
        }
    }

    return text.trim();
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
                                    700,

                                reasoning_effort:
                                    "low",

                                reasoning_format: "hidden",

                            stream: false,

                            tools: [],

                            tool_choice: "none"

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
            "Groq bağlantısı kurulamadı."
        )
    );
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
            "Gemini API anahtarı bulunamadı."
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
            "Gemini geçersiz JSON gönderdi."
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
GROQ → GEMINI YEDEK SİSTEMİ
========================================================= */

async function requestAI(
    messages
) {

    try {

        console.log(
            "AI: GROQ"
        );

        return await requestGroq(
            messages
        );

    } catch (groqError) {

        console.error(
            "GROQ BAŞARISIZ, GEMINI'YE GEÇİLİYOR:",
            groqError.message
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
                "GEMINI DE BAŞARISIZ:",
                geminiError.message
             );
        
console.error(
    "GEMINI DETAY:",
    geminiError
);
            throw new Error(
                "Groq ve Gemini kullanılamıyor."
            );
        }
    }
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
            "15mb"
    })
);

app.use(
    express.static(
        __dirname
    )
);
/* =========================================================
OTOMATİK KULLANICI COOKIE SİSTEMİ
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
                "Çoklu dil desteği aktif",

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
WEB ARAŞTIRMA API
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
                        "Araştırılacak konu belirtilmedi."

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
                        "Araştırma sorgusu çok uzun."

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
                "ARAŞTIRMA HATASI:",
                error.message
            );

            return res.status(
                500
            ).json({

                ok:
                    false,

                reply:
                    "İnternet araştırması sırasında bir hata oluştu."

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
                        "Şehir veya konum belirtilmedi."

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
                    "Hava durumu bilgisi alınamadı."

            });
        }

  if (!isWeatherQuestion(message)) {

    const research =
        await researchWeb(message);

    if (research && research.ok) {

        researchContext =
            `
[İNTERNET ARAŞTIRMASI]

Arama:
${research.query}

İNTERNET ARAŞTIRMASI KURALLARI:

- Aşağıdaki bilgiler internetten alınmıştır.
- SADECE aşağıdaki araştırma sonuçlarında bulunan bilgileri kullan.
- Araştırma sonuçlarında olmayan hiçbir bilgiyi tahmin etme veya uydurma.
- Güncel fiyat, tarih, saat, maç, döviz kuru ve haberlerde özellikle dikkatli ol.
- Bir bilgi kaynaklarda yoksa "Araştırma sonuçlarında bu bilgi bulunamadı." de.
- Kaynaklar birbiriyle çelişiyorsa bunu açıkça belirt.
- "Resmi kaynak", "TCMB", "TFF" gibi ifadeleri yalnızca araştırma metninde gerçekten böyle bir kaynak varsa kullan.
- Kullanıcı güncel bilgi sorduğunda kendi eski bilgini araştırma sonucunun yerine koyma.
- Cevabını mümkün olduğunca araştırma sonuçlarına dayandır.

ARAŞTIRMA SONUÇLARI:
${String(
    research.text || ""
).slice(0, 5000)}
`.trim();

        researchSources =
            research.sources || [];

        researchUsed =
            true;

        console.log(
            "İNTERNET ARAŞTIRMASI AKTİF"
        );
    }
}  }
);

/* =========================================================
DOSYA YÜKLEME API
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
                        "Dosya bulunamadı."

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
                        "Bu dosya türüne izin verilmiyor."

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
                        "Dosya verisi geçersiz."

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
                        "Dosya boş veya geçersiz."

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
                        "Dosya çok büyük. Maksimum dosya boyutu 10 MB."

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
                "DOSYA YÜKLENDİ:",
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
                    "Dosya başarıyla yüklendi."

            });

        } catch (
            error
        ) {

            console.error(
                "DOSYA YÜKLEME HATASI:",
                error.message
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
            ARAŞTIRMA
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
            Hava durumu özel olarak
            Open-Meteo üzerinden alınır.
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
[İNTERNET ARAŞTIRMASI]

Hava durumu:
${JSON.stringify(
    weather
)}
`.trim();

                researchUsed =
                    true;

                console.log(
                    "HAVA DURUMU ARAŞTIRMASI AKTİF"
                );
            }

        } else {

            /*
                Normal internet araştırması
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
[İNTERNET ARAŞTIRMASI]

Arama:
${research.query}

Sonuçlar:
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
                    "İNTERNET ARAŞTIRMASI AKTİF"
                );
            }
        }

    } catch (
        researchError
    ) {

        console.error(
            "ARAŞTIRMA HATASI:",
            researchError.message
        );

        /*
            Araştırma başarısız olursa
            normal AI cevabı çalışmaya devam eder.
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
`.trim()

                }

            ];

            /* -----------------------------------------
            ARAŞTIRMA SONUÇLARINI AI'A VER
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
ARAŞTIRMA KURALI:

Yukarıdaki araştırma bilgileri güncel bilgi
gereken soruya yardımcı olmak için alınmıştır.

Cevabını bu bilgilerle oluştur.

Araştırma sonucunda bulunmayan bilgileri uydurma.

Kullanıcı kaynak isterse kaynakları belirt.

Gereksiz yere "internette araştırdım" deme.

Hava durumu verisi varsa mevcut hava verisini
kullan.
`.trim()

                });
            }

            /* -----------------------------------------
            GEÇMİŞ MESAJLAR
            ----------------------------------------- */

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
                "ARAŞTIRMA:",
                researchUsed
                    ? "AKTİF"
                    : "GEREKMİYOR"
            );
if (researchContext) {
    messages.push({
        role: "system",
        content: `ÖNEMLİ GÜNCEL İNTERNET BİLGİSİ:

${researchContext}

Bu bilgi internet araştırmasından alınmıştır.
Eski hafıza veya model bilgisi bununla çelişirse
İNTERNET ARAŞTIRMASI SONUCUNU esas al.
Güncel bilgi sorularında eski bilgiyi kullanma.`
    });
}
messages.forEach(message => {
    if (typeof message.content === "string") {
        message.content =
            message.content.slice(0, 12000);
    }
});
console.log("GROQ MESSAGES:", JSON.stringify(messages, null, 2));
            console.log(
                "GROQ İSTEĞİ GÖNDERİLİYOR..."
            );

            /* -----------------------------------------
            GROQ
            ----------------------------------------- */

              const data =
             await requestAI(
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
            BİLMİYORSA OTOMATİK ARAŞTIR
            ----------------------------------------- */

            const uncertainAnswer =
                /bilmiyorum|emin değilim|emin değilim|kesin olarak bilmiyorum|yeterli bilgim yok|doğrulayamıyorum|bilgi sahibi değilim|bunu bilmiyorum/i.test(
                    reply
                );

            if (
                uncertainAnswer &&
                !researchUsed
            ) {

                console.log(
                    "AI BİLGİSİ YETERSİZ."
                );

                console.log(
                    "OTOMATİK İKİNCİ ARAŞTIRMA BAŞLATILIYOR..."
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
İLK CEVABINDA YETERLİ BİLGİ OLMADI.

Şimdi internet araştırması sonucu aşağıdadır:

${secondResearch.text}

Kullanıcının sorusunu araştırma
sonuçlarına göre yeniden cevapla.

Araştırma sonucunda bulunmayan
bilgileri uydurma.

Kısa, doğal ve doğru cevap ver.
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
                                "İKİNCİ ARAŞTIRMA SONRASI CEVAP OLUŞTURULDU."
                            );
                        }
                    }

                } catch (
                    secondResearchError
                ) {

                    console.error(
                        "İKİNCİ ARAŞTIRMA HATASI:",
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
            ESKİ HAFIZAYA DA KAYDET
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
            "DOSYA YÜKLEME:",
            "AKTİF"
        );

        console.log(
            "MAKSİMUM DOSYA:",
            "10 MB"
        );

        console.log(
            "İNTERNET ARAŞTIRMASI:",
            "AKTİF"
        );

        console.log(
            "HAVA DURUMU:",
            "AKTİF"
        );

        console.log(
            "OTOMATİK BİLMİYORSA ARAŞTIR:",
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







