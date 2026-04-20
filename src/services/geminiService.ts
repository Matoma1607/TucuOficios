import { GoogleGenAI } from "@google/genai";

export async function generateWelcomeNote(professionalName: string, jobTitle: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Eres el asistente de TucuOficios. Genera un mensaje de bienvenida cálido y breve (máximo 3 oraciones) para ${professionalName}, quien acaba de publicar su oficio como "${jobTitle}".
      Usa un tono tucumano amigable pero profesional. El mensaje debe decir que estamos revisando su publicación y que pronto estará visible.`,
    });
    return response.text || "¡Bienvenido a TucuOficios! Estamos revisando tu publicación.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "¡Bienvenido a TucuOficios! Pronto revisaremos tu publicación.";
  }
}
