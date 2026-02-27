import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        if (!ai) {
            return NextResponse.json({ error: "Server API Key not configured" }, { status: 500 });
        }

        const body = await req.json();
        const { base64Data, mimeType } = body;

        if (!base64Data || !mimeType) {
            return NextResponse.json({ error: "Missing image/pdf data" }, { status: 400 });
        }

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

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
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
        if (!text) return NextResponse.json([]);

        const data = JSON.parse(text);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Server API extraction error:", error);
        return NextResponse.json({ error: error.message || "Failed to extract data" }, { status: 500 });
    }
}
