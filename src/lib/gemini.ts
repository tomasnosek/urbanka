import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features might not work.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function extractDataFromPDF(pdfBuffer: Buffer, forcePro: boolean = false) {
    const modelName = forcePro ? "gemini-1.5-pro" : "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
Vytěž informace z tohoto dokumentu týkajícího se obecního investičního projektu.
Vrať výsledek v čistém JSON formátu podle následující TypeScript struktury:

interface ProjectContent {
    meta: {
        status: string; // "Připravuje se", "V realizaci" nebo "Dokončeno"
        updateDate: string; // Dnešní lokální datum
    };
    blocks: Array<{
        id: string; // vygeneruj unikátní ID (např. uuid)
        type: "hero" | "stats" | "contentBlockLeft" | "contentBlockRight" | "timeline";
        data: any; // data specifická pro daný typ bloku
    }>;
}

Pro "hero" blok vracej: { title: string, lead: string, imageUrl: "/images/black.png", imageCaption: string }
Pro "stats" blok vracej: { items: Array<{label: string, value: string}> } (ideálně celková cena, zahájení, dokončení)
Pro "contentBlockLeft/Right" vracej: { title: string, content: string, imageUrl: "/images/black.png", imagePosition: "left" | "right" }
Pro "timeline" blok vracej: { events: Array<{ id: string, date: string, title: string, description: string, images: [] }> }

Na začátek projektového JSON přidej i root element "confidence_flag": (true/false) a "blocks".
Vrať hodnotu false, pokud dokument obsahuje nejasnosti, protichůdné informace o ceně nebo je to velmi složitý text a ty jako Flash model doporučuješ manuální revizi.
Vrať JENOM PŘESNÝ JSON. Nic víc, žádný markdown.`;

    try {
        const result = await model.generateContent([
            {
                inlineData: {
                    data: pdfBuffer.toString("base64"),
                    mimeType: "application/pdf"
                }
            },
            prompt
        ]);

        const textResponse = result.response.text();
        // Extract raw JSON if it's wrapped in Markdown
        const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || textResponse.match(/```\n([\s\S]*?)\n```/);
        let cleanedJson = jsonMatch ? jsonMatch[1] : textResponse;

        return JSON.parse(cleanedJson.trim());
    } catch (error) {
        console.error("Gemini Extraction Error:", error);
        throw new Error("Nepodařilo se vytěžit data z PDF.");
    }
}

export async function extractDataFromMultipleFiles(files: { buffer: Buffer, mimeType: string, comment: string }[]) {
    // We use pro model usually when there are multiple complex files, but let's stick to flash unless requested.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Vytěž informace z těchto přiložených dokumentů k založení investičního projektu do naší databáze.
K některým dokumentům mohl uživatel přidat specifické instrukce - tyto instrukce plně respektuj při extrakci.
Vrať výsledek v čistém JSON formátu podle následující TypeScript struktury:

interface ProjectContent {
    meta: {
        status: string; // Vždy nastav "Připravuje se" nebo odhadni z textu.
        updateDate: string; // Dnešní lokální datum
    };
    hero: {
        title: string;
        lead: string;
        imageUrl: "/images/black.png";
        imageCaption: string;
    };
    stats: Array<{label: string, value: string}>;
    contentBlocks: Array<{
        type: "text" | "image-text";
        heading: string;
        body: string;
        imageUrl?: "/images/black.png";
        imageCaption?: string;
        reverse?: boolean;
    }>;
    timeline: Array<{
        date: string;
        title: string;
        description: string;
        images: [];
    }>;
}

Vrať JENOM PŘESNÝ JSON splňující tuto ProjectContent strukturu. Nic víc, žádný markdown.`;

    try {
        const parts: any[] = [];

        files.forEach((file, index) => {
            parts.push({
                inlineData: {
                    data: file.buffer.toString("base64"),
                    mimeType: file.mimeType
                }
            });
            if (file.comment?.trim()) {
                parts.push(`Komentář uživatele k dokumentu ${index + 1}:\n${file.comment.trim()}`);
            }
        });

        parts.push(prompt);

        const result = await model.generateContent(parts);
        const textResponse = result.response.text();

        // Extract raw JSON if wrapped in Markdown
        const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || textResponse.match(/```\n([\s\S]*?)\n```/);
        let cleanedJson = jsonMatch ? jsonMatch[1] : textResponse;

        return JSON.parse(cleanedJson.trim());
    } catch (error) {
        console.error("Gemini Multi-File Extraction Error:", error);
        throw new Error("Nepodařilo se vytěžit data z dokumentů.");
    }
}


export async function analyzeFeedback(text: string): Promise<"question" | "error" | "spam" | "toxic"> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Analyzuj následující zprávu (feedback od občana).
Kategorizuj ji do jediné přípustné kategorie z těchto čtyř:
- "question" (obecný dotaz k projektu)
- "error" (občan upozorňuje na chybu v textu nebo technickou chybu na stránce)
- "spam" (komerční sdělení, nesmyslný text)
- "toxic" (vulgární, urážlivá zpráva)

Vrať jako výsledek POUZE a JENOM jedno z těch čtyř slov.

Zpráva:
"${text}"
`;

    try {
        const result = await model.generateContent(prompt);
        const category = result.response.text().trim().toLowerCase();

        switch (category) {
            case "question":
            case "error":
            case "spam":
            case "toxic":
                return category;
            default:
                return "question"; // fallback
        }
    } catch (error) {
        console.error("Gemini Feedback Analysis Error:", error);
        return "question"; // fallback if AI fails
    }
}
