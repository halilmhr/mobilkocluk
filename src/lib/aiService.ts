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

// Extract topics from table of contents image using Gemini Vision
export const extractTopicsFromImage = async (base64Image: string): Promise<string[]> => {
    console.log('[AI Service] extractTopicsFromImage called');

    if (!API_KEY) {
        console.error('[AI Service] CRITICAL: API key not found!');
        throw new Error("EXPO_PUBLIC_GEMINI_API_KEY not found");
    }

    const client = new GoogleGenerativeAI(API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Bu bir kitabın içindekiler sayfasının fotoğrafı. 
Fotoğraftaki TÜM konu başlıklarını çıkar ve liste olarak ver.

KURALLAR:
1. Sadece konu başlıklarını al (sayfa numaralarını ALMA)
2. Bölüm numaralarını da dahil et (örn: "Ünite 1 - Vektörler")
3. Alt başlıklar varsa onları da ayrı ayrı yaz
4. Türkçe konu isimlerini koru
5. Her konuyu ayrı satıra yaz

JSON formatında cevap ver:
{
  "topics": ["Konu 1", "Konu 2", "Konu 3", ...]
}`;

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
            }
        });

        const jsonString = response.response.text().trim();
        console.log('[AI Service] Vision response:', jsonString.substring(0, 200));
        const parsed = JSON.parse(jsonString);
        return parsed.topics || [];
    } catch (error) {
        console.error('[AI Service] Vision extraction error:', error);
        throw new Error("İçindekiler analizi başarısız oldu");
    }
};
