import { GoogleGenAI, Type } from "@google/genai";
import { CutRequest } from "./types";

// Initialize Gemini client
// Note: API key is injected via NEXT_PUBLIC_GEMINI_API_KEY in client or process.env.GEMINI_API_KEY in server
// Since we are using this in client-side components (or server actions), we need to handle both?
// The prompt says: "Always call Gemini API from the frontend code... NEVER call Gemini API from the backend."
// So we use NEXT_PUBLIC_GEMINI_API_KEY.

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error("NEXT_PUBLIC_GEMINI_API_KEY is missing");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy' });

export async function extractTableData(file: File): Promise<CutRequest[]> {
  if (!apiKey) {
    throw new Error("API Key not configured");
  }

  // Convert file to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const prompt = `
    Analyze this image of a material list table.
    Extract the items to be cut.
    For each item, identify:
    - Material name (e.g., "Cantoneira", "Barra Chata", "Viga U")
    - Length (convert to millimeters. If in cm, multiply by 10. If in m, multiply by 1000).
    - Quantity (number of pieces).
    - Description (any other details like "Pos. 1", "Montante", etc.).
    
    Return a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              material: { type: Type.STRING },
              length: { type: Type.NUMBER, description: "Length in mm" },
              quantity: { type: Type.NUMBER },
              description: { type: Type.STRING },
            },
            required: ["material", "length", "quantity"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text);
    
    // Add IDs
    return data.map((item: any) => ({
      id: crypto.randomUUID(),
      material: item.material,
      length: item.length,
      quantity: item.quantity,
      description: item.description || '',
    }));
  } catch (error) {
    console.error("Gemini extraction error:", error);
    throw error;
  }
}
