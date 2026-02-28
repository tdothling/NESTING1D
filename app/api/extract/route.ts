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
    - Description (Only use this for generic observations, assembly positions, or codes like "Pos. 1", "Montante". Do NOT put dimensions here).
    - skipOptimization (Boolean. Set to true ONLY for Plates/Chapas that are bought pre-cut, as they don't need 1D bar nesting. Otherwise false).
    
    IMPORTANT - Profile Type and Dimensions:
    You MUST also extract the profile type and its geometric dimensions. Use these exact type codes:
    - "ue" = U Enrijecido (has height, width, lipHeight, thickness)
    - "u_simples" = U Simples / U dobrado sem enrijecedor (has height, width, thickness)
    - "cartola" = Perfil Cartola (has height, width, lipHeight, thickness)
    - "z" = Perfil Z (has height, width, thickness)
    - "cantoneira" = Cantoneira de abas iguais (has width, thickness)
    - "barra_chata" = Barra Chata (has width, thickness)
    - "barra_redonda" = Barra Redonda (has diameter)
    - "chapa" = Chapa de Aço (has width in profileWidth, length/comprimento in profileHeight, thickness in profileThickness)
    - "w_hp" = Perfil W or HP laminado. For W/HP, the weight per meter IS ALREADY IN THE NAME (e.g. "W 200x19.3" means 19.3 kg/m). Extract this as weightKgM directly. No geometric dimensions needed.
    
    Parse the dimensions from the material name. For example:
    - "Ue 200x75x25x3.00" → profileType:"ue", profileHeight:200, profileWidth:75, profileLipHeight:25, profileThickness:3.00
    - "L 2x3/16" → profileType:"cantoneira", profileWidth:50.8 (2" in mm), profileThickness:4.76 (3/16" in mm)
    - "BR Ø1" → profileType:"barra_redonda", profileDiameter:25.4
    - "W 310x38.7" → profileType:"w_hp", weightKgM:38.7 (the number after x IS the weight in kg/m)

    CRITICAL FOR W/HP: The number after 'x' in the name IS the linear weight in kg/m. Always extract it as weightKgM.

    All dimensions MUST be in millimeters. Convert inches to mm (1" = 25.4mm).
    
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
                            description: { type: Type.STRING },
                            skipOptimization: { type: Type.BOOLEAN, description: "True if it's a plate (Chapa) and shouldn't be nested" },
                            weightKgM: { type: Type.NUMBER, description: "Linear weight in kg/m. For W/HP profiles, extract from the name (e.g. W200x19.3 = 19.3 kg/m)" },
                            profileType: { type: Type.STRING, description: "Profile type code: ue, u_simples, cartola, z, cantoneira, barra_chata, barra_redonda, chapa, w_hp" },
                            profileHeight: { type: Type.NUMBER, description: "Web height in mm" },
                            profileWidth: { type: Type.NUMBER, description: "Flange/leg width in mm" },
                            profileThickness: { type: Type.NUMBER, description: "Wall/plate thickness in mm" },
                            profileLipHeight: { type: Type.NUMBER, description: "Stiffener lip height in mm (Ue, Cartola)" },
                            profileFlangeThickness: { type: Type.NUMBER, description: "Flange thickness in mm (W/HP only)" },
                            profileDiameter: { type: Type.NUMBER, description: "Diameter in mm (round bar)" },
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
