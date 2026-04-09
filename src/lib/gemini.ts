import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function generateQuestions(core: 1 | 2, count: number = 15): Promise<Question[]> {
  try {
    const ai = getAI();
    const coreTitle = core === 1 ? "220-1101 (Core 1)" : "220-1102 (Core 2)";
    const coreTopics = core === 1 
      ? "Mobile Devices, Networking, Hardware, Virtualization and Cloud Computing, Hardware and Network Troubleshooting"
      : "Operating Systems, Security, Software Troubleshooting, Operational Procedures";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ${count} unique multiple-choice questions for the CompTIA A+ ${coreTitle} exam.
      Topics to cover: ${coreTopics}.
      Each question must have exactly 4 options and one correct answer index (0-3).
      Provide a brief explanation for the correct answer.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                minItems: 4,
                maxItems: 4
              },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["id", "question", "options", "correctAnswer", "explanation", "category"]
          }
        }
      }
    });

    const questions = JSON.parse(response.text) as any[];
    return questions.map(q => ({
      ...q,
      core,
      id: q.id || Math.random().toString(36).substring(7)
    }));
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}

export async function getExplanation(question: string, correctAnswer: string, userAnswer: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a CompTIA A+ expert. A student is studying for their exam.
      Question: ${question}
      Correct Answer: ${correctAnswer}
      Student's Answer: ${userAnswer}
      
      Provide a brief, encouraging explanation of why the correct answer is right and why the student's answer might be wrong (if they were different). Keep it under 100 words.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error getting explanation from Gemini:", error);
    if (error instanceof Error && error.message.includes("GEMINI_API_KEY")) {
      return "AI Tutor requires a Gemini API key. Please configure it in the Secrets panel.";
    }
    return "Could not fetch AI explanation at this time.";
  }
}
