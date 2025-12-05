import { GoogleGenAI } from "@google/genai";
import { MetricData } from "../types";

// Helper to format data for the AI prompt
const formatDataForAI = (data: MetricData[]) => {
  return data.map(d => 
    `${d.definition.name}: ${d.currentValue}${d.definition.suffix || ''} (Change: ${d.changePercent.toFixed(2)}%)`
  ).join('\n');
};

export const analyzeMarketData = async (data: MetricData[]): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      return "Clave de API no configurada. Por favor, asegúrese de que la variable de entorno API_KEY está disponible.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const formattedMetrics = formatDataForAI(data);

    const prompt = `
      Actúa como un experto analista macroeconómico de Wall Street.
      Analiza los siguientes datos de mercado actuales y proporciona un resumen ejecutivo breve (máximo 3 párrafos).
      
      Datos del Dashboard:
      ${formattedMetrics}
      
      En tu análisis:
      1. Identifica la tendencia general (Alcista/Bajista/Neutral).
      2. Destaca las 3 anomalías o movimientos más importantes hoy.
      3. Sugiere qué sector podría verse beneficiado.
      
      Mantén el tono profesional, conciso y directo.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "El servicio de análisis de IA no está disponible temporalmente o la clave API es inválida.";
  }
};