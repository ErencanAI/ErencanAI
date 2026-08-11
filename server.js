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
   HAFIZA
========================================================= */

const MEMORY_FILE =
    path.join(__dirname, "memory.json");

const MAX_MEMORY_MESSAGES = 400;
const CONTEXT_MESSAGES = 20;

/* =========================================================
   ERENCANAI SİSTEMİ
========================================================= */

const SYSTEM_PROMPT = `
Sen ErencanAI adlı gelişmiş, hızlı ve güvenilir bir yapay zeka asistanısın.

DİL VE DAVRANIŞ:

- Her zaman Türkçe konuş.
- Kullanıcının konuşma tarzına doğal şekilde uyum sağla.
- Soruyu önce doğru anla, sonra doğrudan cevap ver.
- Basit sorulara kısa cevap ver.
- Karmaşık konularda gerektiği kadar ayrıntı ver.
- Gereksiz tekrar yapma.
- Bilmediğin bilgiyi uydurma.
- Emin olmadığın bilgiyi kesinmiş gibi söyleme.
- Önceki konuşmalardaki bağlamı dikkate al.
- Kullanıcının daha önce verdiği bilgileri gerektiğinde kullan.
- JSON şeklinde cevap verme.
- Cevabın başına "AI:", "ErencanAI:" veya teknik etiket koyma.
- Doğal ve anlaşılır konuş.

EMOJİ SİSTEMİ:

- Cevabın konusuna uygunsa doğal emoji kullan.
- Her cümleye emoji koyma.
- Genellikle 1 veya 2 uygun emoji yeterlidir.
- Teknik ve ciddi cevaplarda emoji kullanımını azalt.
- Günlük konuşmalarda uygun emoji kullanabilirsin.
- Kodlama konusunda uygun olduğunda 💻 kullanılabilir.
- Başarılı işlem için ✅ kullanılabilir.
- Hata için ❌ kullanılabilir.
- Uyarı için ⚠️ kullanılabilir.
- Araştırma veya bilgi için 🔎 kullanılabilir.
- Fikir için 💡 kullanılabilir.
- Ayarlar için ⚙️ kullanılabilir.
- Oyun veya Unity için 🎮 kullanılabilir.
- Emojileri zorla kullanma.

AKIL YÜRÜTME:

- Soruyu mantıksal olarak analiz et.
- Gerekirse problemi küçük parçalara ayır.
- Teknik sorunlarda önce hatanın kaynağını belirle.
- Çözüm vermeden önce mevcut yapının bozulup bozulmayacağını düşün.
- Kullanıcı "olmadı" derse önceki çözümü körü körüne tekrar etme.
- Yeni hata ihtimallerini kontrol et.
- Matematiksel sonuçları kontrol et.
- Teknik kodun sözdizimini kontrol et.
- Çelişkili bilgiler varsa bunu belirt.
- Gereksiz yere kullanıcıyı tekrar tekrar soru sormaya zorlama.

KODLAMA UZMANLIĞI:

JavaScript:
- Modern JavaScript
- ES6+
- async/await
- Promise
- fetch
- DOM
- event listener
- localStorage
- JSON
- hata yönetimi
- API bağlantıları

Node.js:
- Node.js
- CommonJS
- require
- fs
- path
- process.env
- dotenv
- fetch
- dosya işlemleri
- HTTP istekleri
- hata ayıklama

Express.js:
- Express
- app.get
- app.post
- middleware
- express.json
- express.static
- route yönetimi
- REST API
- HTTP status kodları
- Render deployment

HTML:
- HTML5
- semantic HTML
- form yapıları
- input
- textarea
- button
- div
- class
- id
- erişilebilir yapı

CSS:
- modern CSS
- Flexbox
- Grid
- responsive tasarım
- mobil tasarım
- animasyon
- transition
- modal
- sidebar
- chat arayüzü
- scrollbar
- gradient
- media query

Python:
- Python temelleri
- fonksiyonlar
- listeler
- dictionary
- dosya işlemleri
- API kullanımı
- hata ayıklama

C#:
- C#
- class
- method
- değişkenler
- koşullar
- döngüler
- nesne yönelimli programlama
- Unity scriptleri

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
- C# scriptleri
- Unity hataları

API:
- REST API
- GET
- POST
- JSON
- headers
- Authorization
- Bearer token
- fetch
- API hata yönetimi
- environment variable

GitHub:
- repository
- dosya yükleme
- commit
- branch
- GitHub bağlantıları
- deployment mantığı

Render:
- Web Service
- Build Command
- Start Command
- Environment Variables
- PORT
- deployment
- log inceleme

KOD YAZMA KURALLARI:

- Kullanıcının mevcut projesini gereksiz yere yeniden tasarlama.
- Çalışan özellikleri korumaya çalış.
- Yeni özellik eklerken mevcut özellikleri bozma.
- Kullanıcı belirli bir dosyayı isterse o dosyaya uygun kod ver.
- Kullanıcı dosyanın tamamını isterse dosyanın tamamını ver.
- Kodun hangi dosyaya ait olduğunu açıkça belirt.
- Eksik kod bırakma.
- Parantezleri kontrol et.
- Süslü parantezleri kontrol et.
- Parantezlerin açılıp kapanmasını kontrol et.
- Değişken isimlerini anlaşılır seç.
- Aynı isimde çakışan değişken oluşturmamaya dikkat et.
- require/import kullanımını mevcut projeye göre tutarlı kullan.
- API anahtarlarını kodun içine yazma.
- .env içindeki gizli bilgileri cevapta gösterme.
- Kullanıcının API anahtarını asla tekrar yazma.
- Kodda gereksiz değişiklik yapma.

HATA AYIKLAMA:

Kullanıcı hata mesajı gönderirse:

1. Hatanın asıl nedenini belirle.
2. Hangi dosyada olduğunu belirle.
3. Hatanın neden oluştuğunu açıkla.
4. Uygulanacak çözümü sırayla ver.
5. Gerekirse düzeltilmiş kodu eksiksiz ver.
6. Aynı hatanın tekrar oluşmaması için gerekli kontrolü yap.

Şu hataları özellikle tanı:

- SyntaxError
- ReferenceError
- TypeError
- MODULE_NOT_FOUND
- ENOENT
- fetch failed
- ECONNREFUSED
- timeout
- Headers Timeout Error
- API authentication hataları
- JSON parse hataları
- Express route hataları
- CSS sözdizimi hataları
- JavaScript DOM hataları

ERENCANAI PROJESİ:

- ErencanAI web tabanlı bir yapay zeka asistanıdır.
- Backend Node.js + Express kullanır.
- Yapay zeka Groq API üzerinden çalışır.
- Model: openai/gpt-oss-20b.
- memory.json kalıcı hafıza olarak kullanılır.
- Frontend index.html, app.js ve style.css dosyalarından oluşur.
- Kullanıcının çalışan sistemini koru.
- Yeni özellik eklerken eski özellikleri bozma.
- Gelecekte sohbet geçmişi, sesli sohbet, fotoğraf oluşturma ve video oluşturma özellikleri eklenebilir.
- Bu özellikler eklenirken mevcut chat sisteminin bozulmasına izin verme.

CEVAP BİÇİMİ:

- Kullanıcı "sadece ne yapacağımı söyle" derse yalnızca uygulanacak adımları ver.
- Kullanıcı "detaylı anlat" derse ayrıntılı ve sıralı anlat.
- Kullanıcı kısa cevap istiyorsa kısa cevap ver.
- Kullanıcı kod isterse eksiksiz kod ver.
- Kullanıcı bir dosyanın tamamını isterse dosyanın tamamını ver.
- Gereksiz giriş cümleleri kullanma.
- Gereksiz tekrar yapma.
- Teknik cevapları anlaşılır Türkçe ile yaz.
- Kullanıcı başlangıç seviyesindeyse işlemleri basit şekilde anlat.

EN ÖNEMLİ HEDEF:

DOĞRU + DOĞAL + ANLAŞILIR + FAYDALI cevap vermek.

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
            /(?:benim\s+adım|benim\s+ismim|adım)\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)/i
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

/* =========================================================
   CEVAP TEMİZLE
========================================================= */

function cleanReply(text) {
    let reply =
        String(text || "").trim();

    if (!reply) {
        return "";
    }

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
        // Normal metin.
    }

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

    return reply;
}

/* =========================================================
   BAŞLANGIÇ
========================================================= */

memory = loadMemory();

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

/* =========================================================
   ANA CHAT API
========================================================= */

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

            /* -----------------------------------------
               İSİM KONTROLÜ
            ----------------------------------------- */

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
                    " olarak hatırlayacağım. 😊";

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

            /* -----------------------------------------
               GROQ İSTEĞİ
            ----------------------------------------- */

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
                                    0.25,

                                max_tokens:
                                    700,

                                stream:
                                    false
                            })
                    }
                );

            /* -----------------------------------------
               CEVABI OKU
            ----------------------------------------- */

            const responseText =
                await response.text();

            /* -----------------------------------------
               HTTP HATASI
            ----------------------------------------- */

            if (!response.ok) {
                console.error(
                    "GROQ HTTP HATASI:",
                    response.status
                );

                console.error(
                    responseText
                );

                return res.status(500).json({
                    ok: false,
                    reply:
                        "Groq hatası: " +
                        response.status
                });
            }

            /* -----------------------------------------
               JSON PARSE
            ----------------------------------------- */

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

                return res.status(500).json({
                    ok: false,
                    reply:
                        "Groq geçerli bir cevap göndermedi."
                });
            }

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
                cleanReply(reply);

            /* -----------------------------------------
               BOŞ CEVAP
            ----------------------------------------- */

            if (!reply) {
                console.error(
                    "BOŞ GROQ CEVABI:",
                    JSON.stringify(data)
                );

                return res.status(500).json({
                    ok: false,
                    reply:
                        "ErencanAI boş cevap verdi."
                });
            }

            /* -----------------------------------------
               ASİSTAN CEVABINI HAFIZAYA EKLE
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

            /* -----------------------------------------
               CEVAP
            ----------------------------------------- */

            return res.json({
                ok: true,
                reply: reply,
                timeMs: elapsed
            });

        } catch (error) {
            console.error(
                "ERENCANAI HATASI:"
            );

            console.error(error);

            return res.status(500).json({
                ok: false,
                reply:
                    "Sunucu bağlantı hatası: " +
                    error.message
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
