require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runTest() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: "Hello",
        });
        console.log("Response with gemini-1.5-flash:", response.text);
    } catch (e) {
        console.error("Error with gemini-1.5-flash:", e.message);
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Hello",
        });
        console.log("Response with gemini-2.5-flash:", response.text);
    } catch (e) {
        console.error("Error with gemini-2.5-flash:", e.message);
    }
}
runTest();
