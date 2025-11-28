import { GoogleGenAI } from "@google/genai";
import { Lesson, Difficulty } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateLesson = async (topic: string, difficulty: Difficulty): Promise<Lesson | null> => {
  if (!ai) {
    console.warn("Gemini API Key is missing. Feature disabled.");
    return null;
  }

  let prompt = "";
  if (difficulty === Difficulty.EASY) {
    prompt = `Generate a simple English typing practice text about "${topic}". Ensure the output is strictly in English, even if the topic is in Chinese. Use simple words, short sentences. No markdown. Lowercase mainly. Approx 30 words.`;
  } else if (difficulty === Difficulty.MEDIUM) {
    prompt = `Generate a standard English typing paragraph about "${topic}". Ensure the output is strictly in English, even if the topic is in Chinese. Good grammar, mixed case, punctuation. Approx 60 words. No markdown.`;
  } else {
    prompt = `Generate a complex English text about "${topic}". Ensure the output is strictly in English, even if the topic is in Chinese. Include numbers, symbols, and technical terms if applicable. Approx 80 words. No markdown.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim().replace(/\n/g, ' ');
    
    if (!text) return null;

    return {
      id: `ai-${Date.now()}`,
      title: `AI生成: ${topic} (English)`,
      category: 'ai',
      difficulty,
      content: text
    };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return null;
  }
};