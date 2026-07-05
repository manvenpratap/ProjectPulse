import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Analysis API
  app.post("/api/analyze", async (req, res) => {
    try {
      const { state } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const prompt = `
        Analyze this project management state and provide a high-level "Executive Pulse" summary (approx 150 words).
        Format as a professional report with:
        1. Overall Project Health
        2. Critical Risks (Overdue tasks, bugs)
        3. Strategic Recommendations
        
        Project Name: ${state.name}
        Tasks: ${state.tasks.length}
        Completed: ${state.tasks.filter((t: any) => t.status === 'Completed').length}
        Overdue: ${state.tasks.filter((t: any) => {
          const due = new Date(t.dueDate);
          return due < new Date() && t.status !== 'Completed';
        }).length}
        Defects: ${state.defects?.length || 0}
        Recent Actions: ${state.log?.slice(-5).map((l: any) => l.action + ' ' + l.taskName).join(', ') || 'No logs yet'}
        
        Respond in Markdown. Be concise, technical, and executive.
      `;

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze project" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
