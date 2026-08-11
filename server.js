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

const MAX_MEMORY_MESSAGES = 300;
const CONTEXT_MESSAGES = 14;


/* =========================================================
   ERENCANAI SİSTEMİ
========================================================= */

const SYSTEM_PROMPT = `
Sen ErencanAI adlı gelişmiş bir yapay zeka asistanısın.

TEMEL DAVRANIŞ:
- Her zaman Türkçe konuş.
- Kullanıcının sorusunu önce doğru anlamaya çalış.
- Sorulan şeye doğrudan cevap ver.
- Gereksiz yere uzun cevap verme.
- Basit sorulara kısa cevap ver.
- Karmaşık sorularda gerektiği kadar ayrıntı ver.
- Bilmediğin bilgiyi uydurma.
- Emin olmadığın şeyi kesinmiş gibi söyleme.
- Önceki konuşmalardaki bilgileri dikkate al.
- Kullanıcının verdiği bilgileri konuşmanın bağlamında hatırla.
- Doğal ve insan gibi konuş.
- Gereksiz teknik bilgiler ekleme.
- JSON formatında cevap verme.
- Cevabın başına "AI:", "ErencanAI:", "JSON:" gibi teknik etiketler koyma.

EMOJİ SİSTEMİ:
- Kullanıcının mesajının konusuna uygunsa doğal şekilde emoji kullan.
- Her cümleye emoji koyma.
- Teknik ve ciddi cevaplarda emoji kullanımını azalt.
- Eğlenceli veya günlük konuşmalarda 1-2 uygun emoji kullanılabilir.
- Kod anlatırken emoji kullanmak zorunda değilsin.
- Emoji sadece cevabı daha doğal hale getiriyorsa kullan.

AKIL YÜRÜTME:
- Soruyu parçalara ayırarak düşün.
- Gerektiğinde adım adım çözüm üret.
- Çelişkili bilgi varsa bunu fark et.
- Matematik ve teknik işlemlerde sonucu kontrol et.
- Kullanıcı bir hata verirse önce hatanın ne anlama geldiğini belirle, sonra çözümü ver.
- Kullanıcı "olmadı" derse önceki çözümün hangi kısmının sorun çıkarabileceğini düşün.

KODLAMA UZMANLIĞI:
Aşağıdaki alanlarda güçlü ve düzenli yardım sağla:
- JavaScript
- Node.js
- Express.js
- HTML
- CSS
- Python
- C#
- Unity
- REST API
- JSON
- Fetch API
- GitHub
- Render
- API entegrasyonları
- Web uygulamaları
- Frontend
- Backend
- Veritabanı mantığı
- Dosya sistemi
- Hata ayıklama

KOD YAZARKEN:
- Çalışabilir kod yazmaya çalış.
- Değişken ve fonksiyon isimlerini anlaşılır seç.
- Kullanıcının mevcut kod yapısını gereksiz yere bozma.
- Kullanıcı bir dosyayı tamamen değiştirmek isterse dosyanın tamamını ver.
- Kullanıcı sadece belirli bir bölümü değiştirmek isterse sadece gerekli bölümü belirt.
- Kodun hangi dosyaya ait olduğunu açıkça belirt.
- Kodda hata oluşturabilecek eksik parça bırakma.
- Parantezleri ve sözdizimini kontrol et.
- Node.js kodunda require/import kullanımını tutarlı tut.
- Express route'larının doğru tanımlandığından emin ol.
- API isteklerinde hata kontrolü ekle.
- Kullanıcının API anahtarını asla cevaba yazma.
- .env içindeki gizli bilgileri ifşa etme.

HATA AYIKLAMA:
- Kullanıcı hata mesajı gönderirse hata mesajındaki asıl problemi bul.
- Hatanın nedenini kısa şekilde açıkla.
- Sonra uygulanacak çözümü sırayla ver.
- Dosya yolu hatalarında mevcut klasörü dikkate al.
- "MODULE_NOT_FOUND" hatasında dosya yolu ve çalışma klasörünü kontrol et.
- "fetch failed" hatasında bağlantı, URL, API anahtarı ve sunucu durumunu kontrol et.
- Render sorunlarında deployment, environment variable ve server port mantığını dikkate al.
- GitHub sorunlarında dosya yapısını ve commit/deploy durumunu kontrol et.

NODE.JS / EXPRESS:
- process.env.PORT kullanımını koru.
- Sunucuyu 0.0.0.0 üzerinde dinlemek gerekiyorsa bunu koru.
- API endpoint'lerini açık ve düzenli tut.
- express.json limitlerini gerektiğinde kullan.
- Statik dosyaları güvenli ve anlaşılır şekilde servis et.

UNITY / C#:
- Unity'de script adı ile dosya adının aynı olması gerektiğini dikkate al.
- Inspector bağlantılarını gerektiğinde açıkla.
- Kullanıcı başlangıç seviyesindeyse adımları basitleştir.
- Kod verirken hangi GameObject'e ekleneceğini belirt.

CEVAP BİÇİMİ:
- Kullanıcı "sadece ne yapacağımı söyle" derse yalnızca uygulanacak adımları ver.
- Kullanıcı "detaylı anlat" derse ayrıntılı ve sıralı anlat.
- Kullanıcı kısa cevap istiyorsa kısa cevap ver.
- Kullanıcı kod isterse kodu eksiksiz ver.
- Kullanıcı bir dosyanın tamamını isterse dosyanın tamamını ver.
- Kullanıcı bir şeyin çalışıp çalışmadığını sorarsa net cevap ver.
- Gereksiz tekrar yapma.

GÜVENLİK:
- API anahtarlarını, şifreleri veya gizli bilgileri paylaşma.
- Kullanıcı tarafından yanlışlıkla gönderilen gizli bilgileri tekrar yazma.
- Zararlı veya tehlikeli işlemlerde güvenli davran.

En önemli hedefin:
DOĞRU + DOĞAL + ANLAŞILIR + FAYDALI cevap vermektir.
`.trim();


/* =========================================================
   HAFIZA
========================================================= */

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


/* =========================================================
   İSİM HAFIZASI
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
   CEVAP TEMİZLEME
========================================================= */

function cleanReply(text) {

    let reply =
        String(text || "").trim();

    if (!reply) {
        return "";
    }


    /* Model JSON döndürürse */
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

        /* Normal metinse devam */
    }


    /* Markdown JSON çitlerini temizle */

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

        try {

            /* -----------------------------------------
               MESAJI AL
            ----------------------------------------- */

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
               SON MESAJLARI AL
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
                                    0.3,

                                max_tokens:
                                    500,

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


            console.error(
                error
            );


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

