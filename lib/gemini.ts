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
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const prompt = `
    Analyze this image or PDF document of a material list table.
    Extract the items to be cut.
    For each item, identify:
    - Material name (CRUCIAL: This MUST be highly detailed. Combine the shape and its exact dimensions/thickness into this field. e.g., "Perfil U Enrijecido 150x50x15x2.00").
       - SPECIAL CASE FOR PLATES (Chapas de ligação): If the material is "ACO" or similar and the nomenclature is like "# 6.30x1000" (or "# Thickness x Width") with a given length (e.g. 788), format the material strictly as: "Chapa {Width}x{Length} e={Thickness}mm" (e.g., "Chapa 1000x788 e=6.30mm"). In this case, set skipOptimization to true.
    - Length (convert to millimeters. If in cm, multiply by 10. If in m, multiply by 1000). For plates formatted above, length is STILL REQUIRED here as the original length.
    - Quantity (number of pieces).
    - Linear Weight (if present in the table as kg/m, peso linear, etc. Return as a number).
    - Description (Only use this for generic observations, assembly positions, or codes like "Pos. 1", "Montante". Do NOT put dimensions here).
    - skipOptimization (Boolean. Set to true ONLY for Plates/Chapas that are bought pre-cut, as they don't need 1D bar nesting. Otherwise false).
    
    Return a JSON array ONLY.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
              weightKgM: { type: Type.NUMBER, description: "Linear weight in kg/m" },
              description: { type: Type.STRING },
              skipOptimization: { type: Type.BOOLEAN, description: "True if it's a plate (Chapa) and shouldn't be nested" },
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
      weightKgM: item.weightKgM || 0,
      description: item.description || '',
      skipOptimization: item.skipOptimization || false,
    }));
  } catch (error) {
    console.error("Gemini extraction error:", error);
    throw error;
  }
}
