import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to sanitize Gemini response text
function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
  }
  return cleaned;
}

// Fallback rule-based triage evaluator when Gemini API key is missing or calls encounter quotas
function runFallbackTriage(symptoms: string, age?: number) {
  const lower = (symptoms || "").toLowerCase();
  
  const emergencyKeywords = [
    "chest pain", "chest tightness", "can't breathe", "difficulty breathing",
    "shortness of breath", "unconscious", "stroke", "seizure", "severe bleeding",
    "coughing blood", "anaphylaxis", "severe allergic", "suicidal", "crushing pain",
    "blue lips", "cardiac", "heart attack", "choking"
  ];
  
  const moderateKeywords = [
    "fever", "high temperature", "vomiting", "sprain", "fracture", "deep cut",
    "burn", "asthma", "migraine", "severe headache", "abdominal pain", "stomach pain",
    "rash", "dizziness", "ear infection", "urinary", "blurred vision", "swelling"
  ];

  const isEmergency = emergencyKeywords.some(kw => lower.includes(kw));
  const isModerate = moderateKeywords.some(kw => lower.includes(kw));

  if (isEmergency) {
    return {
      urgency: "Emergency",
      triageScore: 9,
      recommendedDepartment: "Emergency Care / Acute Triage",
      triageNotes: "Immediate medical assessment advised. High priority indicators detected in symptom report.",
      estimatedMinutes: 3,
      precautions: [
        "Please alert reception staff or triage nurse immediately.",
        "Remain seated in the designated high-observation area near Station 1.",
        "Do not ingest solid food or heavy liquids while awaiting immediate vitals check."
      ],
      aiProvider: "MediFlow Clinical Rules Engine (High Priority Fallback)"
    };
  }

  if (isModerate) {
    return {
      urgency: "Moderate",
      triageScore: 6,
      recommendedDepartment: "Urgent Outpatient / General Practice",
      triageNotes: "Clinical evaluation required. Symptoms indicate moderate discomfort needing prioritized physician attention.",
      estimatedMinutes: 12,
      precautions: [
        "Rest in waiting bay B with adequate ventilation.",
        "Drink small sips of water if not experiencing nausea.",
        "Keep your token card visible for the next broadcast call."
      ],
      aiProvider: "MediFlow Clinical Rules Engine (Moderate Fallback)"
    };
  }

  return {
    urgency: "Normal",
    triageScore: 3,
    recommendedDepartment: "Standard Consultation / Primary Care",
    triageNotes: "Routine consultation protocol. Symptoms represent non-life-threatening standard complaints.",
    estimatedMinutes: 20,
    precautions: [
      "Wait comfortably in the main lounge area.",
      "Monitor your live queue position on your mobile token screen.",
      "Have your medical identification ready for Room entry."
    ],
    aiProvider: "MediFlow Clinical Rules Engine (Standard Fallback)"
  };
}

// Health route
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// AI Symptom Triage endpoint
app.post("/api/triage", async (req, res) => {
  const { symptoms, age, name, customApiKey } = req.body;

  if (!symptoms || typeof symptoms !== "string" || symptoms.trim().length === 0) {
    res.status(400).json({ error: "Symptoms description is required." });
    return;
  }

  const effectiveKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    // Graceful intelligent fallback
    const fallback = runFallbackTriage(symptoms, age);
    res.json(fallback);
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const prompt = `You are a medical triage assistant for MediFlow AI clinic queue system.
Patient Name: ${name || "Anonymous"}
Patient Age: ${age || "Unspecified"}
Reported Symptoms: "${symptoms}"

Evaluate the clinical urgency strictly into one of three categories:
1. "Emergency" (Immediate danger to life or limb: chest pain, respiratory distress, severe bleeding, anaphylaxis, acute trauma)
2. "Moderate" (Significant distress or risk: high fever, intense migraine, severe sprain, deep lacerations, asthma flare)
3. "Normal" (Standard non-urgent complaints: mild cold, skin rash check, prescription renewal, minor headache, routine follow-up)

Respond with ONLY a raw valid JSON object (no markdown, no code block fences, no extraneous text) with the following structure:
{
  "urgency": "Emergency" | "Moderate" | "Normal",
  "triageScore": <number between 1 and 10, where 10 is immediate resuscitation and 1 is routine checkup>,
  "recommendedDepartment": "<Department string, e.g. 'Emergency Triage', 'Urgent Outpatient', 'General Practice', 'ENT/Pediatrics'>",
  "triageNotes": "<Clear 1-2 sentence clinical rationale for the classification>",
  "estimatedMinutes": <estimated recommended wait time integer in minutes: 3-5 for Emergency, 10-15 for Moderate, 20-30 for Normal>,
  "precautions": ["<Precaution 1>", "<Precaution 2>", "<Precaution 3>"]
}`;

    let rawText = "";
    let providerName = "Google Gemini";

    // Attempt primary model first, fallback to alternate flash models if 503 high demand occurs
    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let succeeded = false;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        if (response.text && response.text.trim().length > 0) {
          rawText = response.text;
          providerName = modelName.includes("3.8")
            ? "Google Gemini 3.8 Flash (Live)"
            : modelName.includes("3.1")
            ? "Google Gemini 3.1 Flash Lite (Live)"
            : "Google Gemini Flash (Live)";
          succeeded = true;
          break;
        }
      } catch (callErr: any) {
        // Log as warning rather than uncaught error to track demand spikes cleanly
        console.warn(`Gemini model ${modelName} unavailable (${callErr?.status || callErr?.code || callErr?.message || "high demand"}). Trying fallback...`);
      }
    }

    if (!succeeded || !rawText) {
      const fallback = runFallbackTriage(symptoms, age);
      res.json({
        ...fallback,
        fallbackNotice: "Evaluated using clinical fallback rules engine due to transient high demand on cloud AI."
      });
      return;
    }

    const cleanJson = cleanJsonOutput(rawText);
    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      // If parsing fails, fall back to rule engine
      const fallback = runFallbackTriage(symptoms, age);
      res.json(fallback);
      return;
    }

    // Validate fields defensively
    const validUrgencies = ["Emergency", "Moderate", "Normal"];
    const urgency = validUrgencies.includes(parsed.urgency) ? parsed.urgency : "Moderate";
    const triageScore = typeof parsed.triageScore === "number" ? Math.min(10, Math.max(1, parsed.triageScore)) : 5;
    const recommendedDepartment = parsed.recommendedDepartment || "General Consultation";
    const triageNotes = parsed.triageNotes || "Assessed by Gemini AI triage protocol.";
    const estimatedMinutes = typeof parsed.estimatedMinutes === "number" ? parsed.estimatedMinutes : (urgency === "Emergency" ? 4 : urgency === "Moderate" ? 14 : 25);
    const precautions = Array.isArray(parsed.precautions) && parsed.precautions.length > 0 
      ? parsed.precautions 
      : ["Please remain in the waiting lounge.", "Notify staff if pain worsens."];

    res.json({
      urgency,
      triageScore,
      recommendedDepartment,
      triageNotes,
      estimatedMinutes,
      precautions,
      aiProvider: providerName
    });
  } catch (err: any) {
    console.warn("AI Triage fallback engaged:", err?.message || err);
    // Smooth fallback so UI never breaks
    const fallback = runFallbackTriage(symptoms, age);
    res.json({
      ...fallback,
      fallbackNotice: "Evaluated using clinical fallback rules engine."
    });
  }
});

// Download ZIP endpoint
app.get("/api/download-zip", (req, res) => {
  const zipPath = path.join(process.cwd(), "public", "mediflow-project.zip");
  res.download(zipPath, "mediflow-project.zip", (err) => {
    if (err) {
      console.error("Error downloading zip:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to download zip file" });
      }
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MediFlow AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
