import { GoogleGenAI } from "@google/genai";
import { ProjectState } from "../types";

export async function analyzeProject(state: ProjectState) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("AI Pulse requires synchronization. Please set GEMINI_API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `
    Analyze this project management state and provide a high-level "Executive Pulse" summary (approx 150 words).
    Format as a professional report with:
    1. Overall Project Health
    2. Critical Risks (Overdue tasks, bugs)
    3. Strategic Recommendations
    
    Project Name: ${state.name}
    Tasks: ${state.tasks.length}
    Completed: ${state.tasks.filter(t => t.status === 'Completed').length}
    Overdue: ${state.tasks.filter(t => {
      const due = new Date(t.dueDate);
      return due < new Date() && t.status !== 'Completed';
    }).length}
    Defects: ${state.defects.length}
    Recent Actions: ${state.log.slice(-5).map(l => l.action + ' ' + l.taskName).join(', ')}
    
    Respond in Markdown. Be concise, technical, and executive.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
}
