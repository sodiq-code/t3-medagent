/**
 * AI-Powered Symptom Analyzer
 * Uses Runable AI Gateway (OpenAI-compatible) for real LLM analysis.
 * Falls back to rule-based engine if AI is unavailable.
 */

export interface SymptomInput {
  symptoms: string[];
  age?: number;
  duration_days?: number;
  severity?: "mild" | "moderate" | "severe";
  context?: string; // full conversation context
}

export interface AIAnalysisResult {
  risk_level: "low" | "medium" | "high" | "critical";
  recommendation: string;
  specialist_needed: boolean;
  specialist_type?: string;
  confidence: number;
  analysis_id: string;
  differential_diagnoses?: string[];
  red_flags?: string[];
  home_care?: string[];
  follow_up?: string;
  powered_by: "ai" | "rule-engine";
}

const AI_GATEWAY = process.env.AI_GATEWAY_BASE_URL ?? "https://api.runable.com/api/gateway/v3/ai";
const AI_KEY = process.env.AI_GATEWAY_API_KEY ?? "";

const SYSTEM_PROMPT = `You are T3 MedAgent, an AI-powered medical triage assistant running inside a Terminal 3 Trusted Execution Environment (TEE). 
You analyze patient symptoms and provide structured medical guidance.

IMPORTANT: Always respond with valid JSON only. No markdown, no extra text.

Response format:
{
  "risk_level": "low" | "medium" | "high" | "critical",
  "recommendation": "Clear, specific medical advice (2-3 sentences)",
  "specialist_needed": boolean,
  "specialist_type": "e.g. Cardiologist, ENT, Neurologist, Emergency Department" (if specialist_needed),
  "confidence": 0.0-1.0,
  "differential_diagnoses": ["condition1", "condition2", "condition3"],
  "red_flags": ["symptom that would escalate urgency"],
  "home_care": ["actionable self-care step"],
  "follow_up": "When to seek further care"
}

Risk levels:
- critical: Life-threatening, call emergency services NOW (chest pain + shortness of breath, stroke symptoms, severe allergic reaction)
- high: See doctor within 24 hours (high fever >39°C, severe pain, concerning combination)
- medium: Schedule appointment within 48-72 hours (persistent symptoms, moderate discomfort)
- low: Self-care sufficient, monitor (mild cold, minor aches, normal tiredness)

Always be specific, empathetic, and actionable. Never dismiss symptoms.`;

export async function analyzeWithAI(input: SymptomInput): Promise<AIAnalysisResult> {
  const symptomsText = input.symptoms.join(", ");
  const contextText = input.context ? `\n\nConversation context: ${input.context}` : "";
  const ageText = input.age ? ` Patient age: ${input.age}.` : "";
  const durationText = input.duration_days ? ` Duration: ${input.duration_days} days.` : "";
  const severityText = input.severity ? ` Self-reported severity: ${input.severity}.` : "";

  const userMessage = `Patient symptoms: ${symptomsText}.${ageText}${durationText}${severityText}${contextText}

Analyze these symptoms and provide structured medical guidance.`;

  try {
    const response = await fetch(`${AI_GATEWAY}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("[AI] Gateway error:", response.status, errText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content) as Partial<AIAnalysisResult>;

    return {
      risk_level: (parsed.risk_level as AIAnalysisResult["risk_level"]) ?? "medium",
      recommendation: parsed.recommendation ?? "Please consult a healthcare professional.",
      specialist_needed: parsed.specialist_needed ?? false,
      specialist_type: parsed.specialist_type,
      confidence: parsed.confidence ?? 0.85,
      analysis_id: `ai-${Date.now()}`,
      differential_diagnoses: parsed.differential_diagnoses ?? [],
      red_flags: parsed.red_flags ?? [],
      home_care: parsed.home_care ?? [],
      follow_up: parsed.follow_up,
      powered_by: "ai",
    };
  } catch (err) {
    console.warn("[AI] Falling back to rule engine:", err);
    return ruleBasedAnalysis(input);
  }
}

// ─── Rule-based fallback ──────────────────────────────────────────────────────
function ruleBasedAnalysis(input: SymptomInput): AIAnalysisResult {
  const lower = input.symptoms.map(s => s.toLowerCase()).join(" ");

  // Critical patterns
  const criticalPatterns = [
    { match: ["chest pain", "shortness of breath"], diag: "Possible acute coronary syndrome", spec: "Emergency Department" },
    { match: ["chest pain", "arm pain"], diag: "Possible myocardial infarction", spec: "Emergency Department" },
    { match: ["sudden severe headache"], diag: "Possible subarachnoid hemorrhage", spec: "Emergency Department" },
    { match: ["difficulty breathing", "throat swelling"], diag: "Possible anaphylaxis", spec: "Emergency Department" },
    { match: ["loss of consciousness"], diag: "Syncope/Emergency condition", spec: "Emergency Department" },
    { match: ["stroke", "facial drooping", "arm weakness", "speech difficulty"], diag: "Possible stroke (FAST)", spec: "Emergency Department" },
    { match: ["vomiting blood", "coughing blood"], diag: "Hemoptysis/Hematemesis", spec: "Emergency Department" },
  ];

  for (const { match, diag, spec } of criticalPatterns) {
    if (match.some(m => lower.includes(m))) {
      return {
        risk_level: "critical",
        recommendation: `🚨 EMERGENCY: ${diag} suspected. Call emergency services (911/999) immediately. Do not drive yourself.`,
        specialist_needed: true,
        specialist_type: spec,
        confidence: 0.92,
        analysis_id: `rule-${Date.now()}`,
        differential_diagnoses: [diag],
        red_flags: ["Worsening symptoms", "Any loss of consciousness"],
        home_care: ["Stay calm", "Call emergency services", "Do not eat or drink"],
        follow_up: "Immediate emergency care required",
        powered_by: "rule-engine",
      };
    }
  }

  // High risk patterns
  const highPatterns = [
    { match: ["high fever", "fever", "temperature"], spec: "General Practitioner", diag: "Febrile illness — requires evaluation" },
    { match: ["severe headache", "neck stiffness", "light sensitivity"], spec: "Neurologist", diag: "Possible meningitis" },
    { match: ["severe abdominal pain", "right side pain"], spec: "Gastroenterologist", diag: "Possible appendicitis/GI emergency" },
    { match: ["difficulty swallowing", "throat closing"], spec: "ENT Specialist", diag: "Throat obstruction — urgent" },
    { match: ["severe chest tightness", "asthma"], spec: "Pulmonologist", diag: "Possible severe asthma exacerbation" },
    { match: ["diabetes", "high blood sugar", "ketones"], spec: "Endocrinologist", diag: "Possible diabetic emergency" },
  ];

  for (const { match, diag, spec } of highPatterns) {
    if (match.some(m => lower.includes(m))) {
      return {
        risk_level: "high",
        recommendation: `${diag}. Visit a doctor or urgent care within 24 hours. Monitor closely for worsening.`,
        specialist_needed: true,
        specialist_type: spec,
        confidence: 0.82,
        analysis_id: `rule-${Date.now()}`,
        differential_diagnoses: [diag],
        red_flags: ["Symptoms worsen rapidly", "Fever above 39°C (102°F)"],
        home_care: ["Rest", "Stay hydrated", "Monitor temperature"],
        follow_up: "See a doctor within 24 hours",
        powered_by: "rule-engine",
      };
    }
  }

  // Medium risk
  const mediumPatterns = [
    "persistent cough", "headache", "fever", "fatigue", "nausea",
    "dizziness", "abdominal pain", "rash", "joint pain", "back pain",
    "ear pain", "sore throat", "eye pain", "urinary pain",
  ];

  const mediumMatch = mediumPatterns.find(m => lower.includes(m));
  if (mediumMatch || input.duration_days && input.duration_days >= 3) {
    const durationNote = input.duration_days && input.duration_days >= 3
      ? ` (persisting ${input.duration_days} days — warrants evaluation)`
      : "";
    return {
      risk_level: "medium",
      recommendation: `Symptoms suggest ${mediumMatch || "ongoing illness"} that requires medical attention${durationNote}. Schedule a GP appointment within 48-72 hours.`,
      specialist_needed: false,
      confidence: 0.75,
      analysis_id: `rule-${Date.now()}`,
      differential_diagnoses: ["Viral infection", "Bacterial infection", "Inflammatory condition"],
      red_flags: ["High fever", "Severe worsening", "New neurological symptoms"],
      home_care: ["Rest well", "Stay hydrated (8+ glasses/day)", "Over-the-counter pain relief if needed", "Monitor temperature"],
      follow_up: "If no improvement in 48h, see a doctor",
      powered_by: "rule-engine",
    };
  }

  // Low risk
  return {
    risk_level: "low",
    recommendation: `Symptoms appear mild. Rest, maintain good hydration, and monitor for any changes. Self-care is appropriate for now.`,
    specialist_needed: false,
    confidence: 0.78,
    analysis_id: `rule-${Date.now()}`,
    differential_diagnoses: ["Common cold", "Mild viral infection", "Fatigue/stress"],
    red_flags: ["Fever above 38°C", "Symptoms lasting more than 5 days", "New severe symptoms"],
    home_care: ["Get adequate sleep (7-9 hours)", "Stay hydrated", "Light exercise if tolerated", "Balanced nutrition"],
    follow_up: "If symptoms persist beyond 5 days or worsen, consult a doctor",
    powered_by: "rule-engine",
  };
}
