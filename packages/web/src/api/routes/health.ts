import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../database";
import { analyses, sessions, patients } from "../database/schema";
import {
  getT3nClient,
  getTenantClient,
  executeHealthAnalysis,
  claimTenant,
  createPatientMap,
  verifyNodeAttestation,
  getAgentDid,
  getAgentAddress,
} from "../lib/t3-agent";
import { sendHealthAlert } from "../lib/sms";
import { eq } from "drizzle-orm";
import { generateUUID } from "../lib/utils";

const health = new Hono()
  // GET /api/health/status — system status + DID (lazy-inits session on first call)
  .get("/status", async (c) => {
    try {
      const address = getAgentAddress();
      // Lazy-init: auto-authenticate if session not yet started
      let did = getAgentDid();
      if (!did) {
        try { await getT3nClient(); did = getAgentDid(); } catch (_) {}
      }
      return c.json({
        status: "online",
        agentAddress: address,
        agentDid: did,
        network: "testnet",
        nodeUrl: "https://cn-api.sg.testnet.t3n.terminal3.io",
        timestamp: Date.now(),
      }, 200);
    } catch (err) {
      return c.json({ status: "offline", error: String(err) }, 200);
    }
  })

  // POST /api/health/init — bootstrap T3 session + claim tenant
  .post("/init", async (c) => {
    try {
      await getT3nClient(); // handshake + authenticate
      const did = getAgentDid();
      let tenantResult: unknown = null;
      try {
        tenantResult = await claimTenant();
      } catch (e) {
        // tenant may already be claimed — not fatal
        tenantResult = { status: "already-claimed", note: String(e) };
      }
      return c.json({
        success: true,
        agentDid: did,
        agentAddress: getAgentAddress(),
        tenantClaim: tenantResult,
      }, 200);
    } catch (err) {
      return c.json({ success: false, error: String(err) }, 500);
    }
  })

  // POST /api/health/analyze — execute health contract
  .post(
    "/analyze",
    zValidator("json", z.object({
      patientDid: z.string().optional(),
      symptoms: z.array(z.string()).min(1),
      age: z.number().optional(),
      duration_days: z.number().optional(),
      severity: z.enum(["mild", "moderate", "severe"]).optional(),
      // Optional: patient phone number for SMS alert
      phone: z.string().optional(),
    })),
    async (c) => {
      const body = c.req.valid("json");
      let smsResult: { success: boolean; provider: string; error?: string } | null = null;

      try {
        const result = await executeHealthAnalysis({
          symptoms: body.symptoms,
          age: body.age,
          duration_days: body.duration_days,
          severity: body.severity,
        });

        // Persist to DB
        const id = generateUUID();
        await db.insert(analyses).values({
          id,
          patientDid: body.patientDid || "anonymous",
          symptoms: JSON.stringify(body.symptoms),
          contractResult: JSON.stringify(result),
          riskLevel: result.risk_level,
          recommendation: result.recommendation,
          contractVersion: "1.0.0",
        });

        // ── SMS Alert: send to patient if phone provided ─────────────────
        // Best-effort — never blocks the response
        if (body.phone) {
          smsResult = await sendHealthAlert({
            phone: body.phone,
            riskLevel: result.risk_level,
            recommendation: result.recommendation,
            analysisId: result.analysis_id,
          });
        }

        // ── Auto-book hospital appointment for high/critical risk ────────
        let hospitalBooking: unknown = null;
        if (result.risk_level === "high" || result.risk_level === "critical") {
          try {
            const bookRes = await fetch(
              new URL("/api/hospital/book", c.req.url).toString(),
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  patientDid: body.patientDid || "anonymous",
                  riskLevel: result.risk_level,
                  analysisId: result.analysis_id,
                }),
              }
            );
            hospitalBooking = await bookRes.json();
          } catch {
            // non-fatal
          }
        }

        return c.json({ success: true, id, result, sms: smsResult, hospitalBooking }, 200);
      } catch (err) {
        // Contract not deployed yet — return AI-simulated result
        const simulated = simulateHealthAnalysis(body.symptoms);
        const id = generateUUID();
        await db.insert(analyses).values({
          id,
          patientDid: body.patientDid || "anonymous",
          symptoms: JSON.stringify(body.symptoms),
          contractResult: JSON.stringify(simulated),
          riskLevel: simulated.risk_level,
          recommendation: simulated.recommendation,
          contractVersion: "1.0.0-simulated",
        }).catch(() => {});

        // SMS for simulated results too (high/critical urgency)
        if (body.phone && (simulated.risk_level === "high" || simulated.risk_level === "critical")) {
          smsResult = await sendHealthAlert({
            phone: body.phone,
            riskLevel: simulated.risk_level,
            recommendation: simulated.recommendation,
            analysisId: simulated.analysis_id,
          });
        }

        return c.json({ success: true, id, result: simulated, simulated: true, sms: smsResult }, 200);
      }
    }
  )

  // GET /api/health/analyses — recent analyses
  .get("/analyses", async (c) => {
    const patientDid = c.req.query("patientDid");
    const rows = patientDid
      ? await db.select().from(analyses).where(eq(analyses.patientDid, patientDid))
      : await db.select().from(analyses);
    return c.json({ analyses: rows }, 200);
  })

  // GET /api/health/verify — DKG attestation
  .get("/verify", async (c) => {
    const result = await verifyNodeAttestation();
    return c.json(result, 200);
  });

export default health;

// ─── Simulation fallback (when contract not yet deployed) ────────────────────
function simulateHealthAnalysis(symptoms: string[]): {
  risk_level: "low" | "medium" | "high" | "critical";
  recommendation: string;
  specialist_needed: boolean;
  confidence: number;
  analysis_id: string;
} {
  const critical = ["chest pain", "difficulty breathing", "loss of consciousness"];
  const high = ["severe headache", "high fever", "vomiting blood"];
  const medium = ["persistent cough", "dizziness", "abdominal pain"];

  const lower = symptoms.map(s => s.toLowerCase());
  let risk_level: "low" | "medium" | "high" | "critical" = "low";

  if (lower.some(s => critical.some(c => s.includes(c)))) risk_level = "critical";
  else if (lower.some(s => high.some(h => s.includes(h)))) risk_level = "high";
  else if (lower.some(s => medium.some(m => s.includes(m)))) risk_level = "medium";

  const recommendations: Record<string, string> = {
    critical: "EMERGENCY: Seek immediate medical attention. Call emergency services now.",
    high: "See a doctor within 24 hours. Monitor symptoms closely.",
    medium: "Schedule a medical appointment within the next few days.",
    low: "Rest, hydrate, and monitor symptoms. Consult a doctor if symptoms persist >3 days.",
  };

  return {
    risk_level,
    recommendation: recommendations[risk_level],
    specialist_needed: risk_level === "critical" || risk_level === "high",
    confidence: 0.82,
    analysis_id: `sim-${Date.now()}`,
  };
}
