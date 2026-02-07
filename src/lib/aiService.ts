import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export interface GeneratedAssignment {
    day: number;
    title: string;
    description: string;
    subject: string;
    topic?: string;
}

interface PlanOptions {
    examType: string;
    subjects: string[];
    prompt: string;
    difficulty: string;
    prioritySubjects?: string[];
    planDuration?: number;
    dailyHours?: number;
}

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// Log API key status at startup (only first 8 chars for security)
console.log('[AI Service] Gemini API Key Status:', API_KEY ? `Set (${API_KEY.substring(0, 8)}...)` : 'NOT SET');

export const generateStudyPlan = async (options: PlanOptions): Promise<GeneratedAssignment[]> => {
    console.log('[AI Service] generateStudyPlan called');

    if (!API_KEY) {
        console.error('[AI Service] CRITICAL: API key not found!');
        throw new Error("EXPO_PUBLIC_GEMINI_API_KEY not found");
    }

    const client = new GoogleGenerativeAI(API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    const planDays = options.planDuration || 7;

    const fullPrompt = `Sen bir eğitim koçunun akıllı asistanısın.

KOÇUN VERDİĞİ GÖREV:
"${options.prompt}"

SENİN İŞİN:
Bu görevi ${planDays} güne profesyonelce dağıt.

KURALLAR:
1. KOÇUN YAZDIĞI ANA GÖREVİ KORU - değiştirme, farklı şeyler ekleme
2. Koç "50 paragraf" dediyse, her gün 50 paragraf görevi olsun
3. Günlere hafif varyasyon ekleyebilirsin:
   - Gün 1: "50 Paragraf - Başlangıç"
   - Gün 3: "50 Paragraf - Pekiştirme"
   - Gün 7: "50 Paragraf - Final Tekrar"
4. Açıklamalar kısa ve profesyonel olsun
5. Koç ders belirtmediyse subject = "Genel" yaz

YANLIŞ ÖRNEK (YAPMA):
Koç: "50 paragraf çöz"
❌ Gün 1: Matematik limit konusu
❌ Gün 2: Fizik kuvvet ve hareket
(Bu yanlış çünkü koç paragraf dedi, sen başka ders verdin)

DOĞRU ÖRNEK:
Koç: "50 paragraf çöz"
✓ Gün 1: 50 Paragraf - Temel Seviye / "Kolay-orta paragraflarla başla"
✓ Gün 2: 50 Paragraf - Karma / "Farklı türlerden paragraflar"
✓ Gün 3: 50 Paragraf - Zor / "Çıkmış soru tarzı paragraflar"

JSON formatı:
{
  "plan": [
    {
      "day": 1,
      "title": "Ana Görev - Varyasyon",
      "description": "Kısa profesyonel açıklama",
      "subject": "Ders veya Genel",
      "topic": "Varsa konu"
    }
  ]
}`;

    try {
        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        plan: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    day: { type: SchemaType.NUMBER },
                                    title: { type: SchemaType.STRING },
                                    description: { type: SchemaType.STRING },
                                    subject: { type: SchemaType.STRING },
                                    topic: { type: SchemaType.STRING }
                                },
                                required: ["day", "title", "description", "subject", "topic"]
                            }
                        }
                    },
                    required: ["plan"]
                }
            }
        });

        let jsonString = response.response.text().trim();
        if (jsonString.startsWith('```json')) {
            jsonString = jsonString.substring(7, jsonString.length - 3).trim();
        } else if (jsonString.startsWith('```')) {
            jsonString = jsonString.substring(3, jsonString.length - 3).trim();
        }

        const resultJson = JSON.parse(jsonString) as { plan: GeneratedAssignment[] };
        return resultJson.plan || [];
    } catch (error) {
        console.error("Error generating plan:", error);
        throw error;
    }
};
export interface StudentAnalysisData {
    name: string;
    examType: string;
    subjects: string[];
    recentCheckins: any[];
    recentExams: any[];
    recentStudyTime: any[];
    recentQuestions: any[];
}

export const getStudentAnalysis = async (data: StudentAnalysisData): Promise<string[]> => {
    if (!API_KEY) {
        throw new Error("EXPO_PUBLIC_GEMINI_API_KEY not found");
    }

    const client = new GoogleGenerativeAI(API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    const fullPrompt = `Bir eğitim koçu olarak şu öğrenci verilerini analiz et ve koça 3 tane kısa, aksiyon odaklı içgörü/not ver.
Öğrenci: ${data.name} (${data.examType})
Dersler: ${data.subjects.join(', ')}

Son Mood/Check-in: ${JSON.stringify(data.recentCheckins.slice(0, 3))}
Son Deneme Netleri: ${JSON.stringify(data.recentExams.slice(0, 3))}
Son Çalışma Süreleri: ${JSON.stringify(data.recentStudyTime.slice(0, 3))}
Soru Çözüm Verileri: ${JSON.stringify(data.recentQuestions.slice(0, 7))}

Cevabını JSON formatında ["Madde 1", "Madde 2", "Madde 3"] şeklinde ver.`;

    try {
        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const jsonString = response.response.text().trim();
        return JSON.parse(jsonString) as string[];
    } catch (error) {
        console.error("Error generating analysis:", error);
        return [
            "Öğrenci verileri analiz edilemedi.",
            "Son çalışmaları kontrol etmenizi öneririm.",
            "Motivasyon takibi yapılmalı."
        ];
    }
};

export interface CoachGlobalAnalysisData {
    totalStudents: number;
    activeToday: number;
    totalAssignments: number;
    completedAssignments: number;
    moodTrends: string[]; // Recent mood emojis or labels
    studentSummaries: {
        name: string;
        pendingAssignments: number;
        lastActive: string;
    }[];
}

export const getCoachGlobalAnalysis = async (data: CoachGlobalAnalysisData): Promise<string[]> => {
    if (!API_KEY) {
        throw new Error("EXPO_PUBLIC_GEMINI_API_KEY not found");
    }

    const client = new GoogleGenerativeAI(API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    const fullPrompt = `Bir eğitim koçu asistanı olarak, koçun panelindeki tüm öğrenci verilerini analiz et ve koça 3 tane stratejik not/içgörü ver.
Genel Durum:
- Toplam Öğrenci: ${data.totalStudents}
- Bugün Aktif: ${data.activeToday}
- Ödev Tamamlama: ${data.completedAssignments}/${data.totalAssignments}
- Son Moodlar: ${data.moodTrends.join(', ')}

Öğrenci Bazlı Özetler: ${JSON.stringify(data.studentSummaries.slice(0, 5))}

Aksiyon odaklı, koçu motive eden veya uyaran 3 madde üret.
Cevabını JSON formatında ["Madde 1", "Madde 2", "Madde 3"] şeklinde ver.`;

    try {
        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const jsonString = response.response.text().trim();
        return JSON.parse(jsonString) as string[];
    } catch (error) {
        console.error("Global analysis error:", error);
        return [
            "Genel öğrenci performansı stabil görünüyor.",
            "Ödev takip çizelgelerini kontrol etmenizi öneririm.",
            "Aktif olmayan öğrencilerle iletişime geçilebilir."
        ];
    }
};

// Extract nested units and topics from table of contents image using Gemini Vision
export const extractTopicsFromImage = async (base64Image: string): Promise<{ title: string; topics: string[] }[]> => {
    console.log('[AI Service] extractTopicsFromImage started - Image size approx:', Math.round(base64Image.length / 1024), 'KB');

    if (!API_KEY) {
        console.error('[AI Service] CRITICAL: API key not found!');
        throw new Error("EXPO_PUBLIC_GEMINI_API_KEY not found");
    }

    const client = new GoogleGenerativeAI(API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Bu bir kitabın içindekiler sayfasıdır. Lütfen sayfadaki ÜNİTE (Bölüm) ve altındaki KONU (Alt Başlık) hiyerarşisini çıkar.

KURALLAR:
1. Sayfa numaralarını, sayfa başlarındaki "S." ibarelerini veya tarihleri KESİNLİKLE alma.
2. Ünite/Bölüm isimlerini "title" alanına yaz. (Örn: "Ünite 1: Mantık ve Kümeler")
3. O ünitenin altındaki tüm konu başlıklarını "topics" listesine ekle.
4. Eğer kitabın yapısında net bir ünite-konu ayrımı yoksa (sadece liste halindeyse), hepsini "Genel Konular" başlıklı tek bir ünite altında topla.
5. Madde işaretleri (•, -, *, 1., a.) gibi işaretleri temizle.
6. Sadece eğitimle ilgili başlıkları al. (İçindekiler, Önsöz, Cevap Anahtarı gibi kısımları alma).
7. Yazım hatalarını kitapta olduğu gibi bırak, düzeltme yapma.

ÖRNEK YAPI:
{
  "chapters": [
    {
      "title": "Ünite 1: Sayılar",
      "topics": ["Tam Sayılar", "Rasyonel Sayılar"]
    }
  ]
}

Yanıtını SADECE yukarıdaki hiyerarşiye uygun JSON formatında ver.`;

    try {
        const response = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        chapters: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    title: { type: SchemaType.STRING },
                                    topics: {
                                        type: SchemaType.ARRAY,
                                        items: { type: SchemaType.STRING }
                                    }
                                },
                                required: ["title", "topics"]
                            }
                        }
                    },
                    required: ["chapters"]
                }
            }
        });

        const fullText = response.response.text();
        console.log('[AI Service] Raw AI Response Length:', fullText.length);

        let jsonString = fullText.trim();

        // Robust markdown cleaning
        if (jsonString.includes('```')) {
            const match = jsonString.match(/```(?:json)?([\s\S]*?)```/);
            if (match && match[1]) {
                jsonString = match[1].trim();
            }
        }

        const parsed = JSON.parse(jsonString);

        if (!parsed.chapters || !Array.isArray(parsed.chapters)) {
            console.error('[AI Service] Invalid format from AI:', jsonString);
            throw new Error("AI beklenen formatta veri döndürmedi.");
        }

        console.log(`[AI Service] Successfully extracted ${parsed.chapters.length} chapters.`);
        return parsed.chapters;
    } catch (error: any) {
        console.error('[AI Service] Vision extraction failed:', error);

        if (error instanceof SyntaxError) {
            throw new Error("Kitap verisi okundu ama işlenemedi. Lütfen tekrar deneyin.");
        }

        throw new Error(error?.message || "İçindekiler analizi başarısız oldu. Lütfen fotoğrafın net olduğundan ve içindekiler kısmını tam gördüğünden emin olun.");
    }
};
