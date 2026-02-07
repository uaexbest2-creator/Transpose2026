
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function detectParkingZone(imageData: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData.split(',')[1],
          },
        },
        {
          text: "Identify the UAE parking zone from this image. Return a JSON object with 'city', 'zoneCode', and 'type' (Standard/Premium/ZoneA-K). Also include 'pricePerHour' if visible. Use the context of Dubai or Abu Dhabi parking signs.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          city: { type: Type.STRING },
          zoneCode: { type: Type.STRING },
          type: { type: Type.STRING },
          pricePerHour: { type: Type.STRING },
          rulesSummary: { type: Type.STRING }
        },
        required: ["city", "zoneCode"]
      }
    }
  });

  // Adding trim() before parsing as a defensive measure
  return JSON.parse(response.text.trim());
}

export async function getParkingAdvice(query: string, location?: { lat: number; lng: number }) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are a UAE parking expert assistant. You help users understand parking rules in Dubai, Abu Dhabi, and other emirates. Use Google Search to check for current parking holidays (Friday, Sunday, Eid) or changes in RTA/Mawaqif regulations. Keep advice concise and helpful."
    },
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
}
