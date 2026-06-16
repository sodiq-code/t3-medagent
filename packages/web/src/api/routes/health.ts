import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../database";
import { analyses, sessions, patients, auditEvents } from "../database/schema";
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
import { analyzeWithAI } from "../lib/ai-analyzer";
import { findHospitals } from "../data/hospitals";
import { sendHealthAlert } from "../lib/sms";
import { eq } from "drizzle-orm";
import { generateUUID } from "../lib/utils";

const health = new Hono()
  // GET /api/health/status — system status + DID
  .get("/status", async (c) => {
    try {
      const address = getAgentAddress();
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

  // POST /api/health/init — bootstrap T3 session
  .post("/init", async (c) => {
    try {
      await getT3nClient();
      const did = getAgentDid();
      let tenantResult: unknown = null;
      try {
        tenantResult = await claimTenant();
      } catch (e) {
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

  // POST /api/health/analyze — AI + TEE health analysis
  .post(
    "/analyze",
    zValidator("json", z.object({
      patientDid: z.string().optional(),
      symptoms: z.array(z.string()).min(1),
      age: z.number().optional(),
      duration_days: z.number().optional(),
      severity: z.enum(["mild", "moderate", "severe"]).optional(),
      context: z.string().optional(), // conversation history for AI context
      phone: z.string().optional(),
      country: z.string().optional(), // for hospital matching
    })),
    async (c) => {
      const body = c.req.valid("json");
      let smsResult: { success: boolean; provider: string; error?: string } | null = null;
      let usedTee = false;

      // ── Step 1: Try TEE contract first ────────────────────────────────────
      let teeResult = null;
      try {
        teeResult = await executeHealthAnalysis({
          symptoms: body.symptoms,
          age: body.age,
          duration_days: body.duration_days,
          severity: body.severity,
        });
        usedTee = true;
      } catch (_) {
        // TEE not available — fall through to AI
      }

      // ── Step 2: AI-powered analysis (real LLM) ────────────────────────────
      const aiResult = await analyzeWithAI({
        symptoms: body.symptoms,
        age: body.age,
        duration_days: body.duration_days,
        severity: body.severity,
        context: body.context,
      });

      // Merge: TEE risk_level if available, AI recommendation always wins
      const result = {
        risk_level: (usedTee && teeResult ? teeResult.risk_level : aiResult.risk_level) as "low" | "medium" | "high" | "critical",
        recommendation: aiResult.recommendation,
        specialist_needed: aiResult.specialist_needed,
        specialist_type: aiResult.specialist_type,
        confidence: aiResult.confidence,
        analysis_id: aiResult.analysis_id,
        differential_diagnoses: aiResult.differential_diagnoses,
        red_flags: aiResult.red_flags,
        home_care: aiResult.home_care,
        follow_up: aiResult.follow_up,
        powered_by: aiResult.powered_by,
        tee_verified: usedTee,
      };

      // ── Step 3: Find matching hospitals ───────────────────────────────────
      const nearbyHospitals = findHospitals({
        specialty: result.specialist_type ?? (result.risk_level === "critical" ? "Emergency Department" : undefined),
        emergency: result.risk_level === "critical",
        country: body.country,
        limit: 3,
      });

      // ── Step 4: Persist to DB ─────────────────────────────────────────────
      const id = generateUUID();
      await db.insert(analyses).values({
        id,
        patientDid: body.patientDid || "anonymous",
        symptoms: JSON.stringify(body.symptoms),
        contractResult: JSON.stringify(result),
        riskLevel: result.risk_level,
        recommendation: result.recommendation,
        contractVersion: usedTee ? "1.0.0" : "1.0.0-ai",
      }).catch(() => {});

      // ── Step 4b: Write audit events ──────────────────────────────────────
      const now = Date.now();
      const auditEntries = [
        {
          id: generateUUID(),
          patientDid: body.patientDid || "anonymous",
          contractTail: "health-check",
          functionName: "analyze-symptoms",
          level: "info" as const,
          message: `Health analysis requested — symptoms: ${body.symptoms.join(", ")}`,
          tsMs: now - 2,
          spanId: null,
        },
        {
          id: generateUUID(),
          patientDid: body.patientDid || "anonymous",
          contractTail: "health-check",
          functionName: "analyze-symptoms",
          level: result.risk_level === "critical" || result.risk_level === "high" ? "error" as const : "info" as const,
          message: `Analysis complete — risk: ${result.risk_level.toUpperCase()}, confidence: ${Math.round(result.confidence * 100)}%, specialist: ${result.specialist_needed ? "yes" : "no"}, tee_verified: ${result.tee_verified}`,
          tsMs: now - 1,
          spanId: null,
        },
        {
          id: generateUUID(),
          patientDid: body.patientDid || "anonymous",
          contractTail: "health-check",
          functionName: "store-result",
          level: "debug" as const,
          message: `Result persisted — analysis_id: ${result.analysis_id}, powered_by: ${result.powered_by}`,
          tsMs: now,
          spanId: null,
        },
      ];
      for (const entry of auditEntries) {
        await db.insert(auditEvents).values(entry).catch(() => {});
      }

      // ── Step 5: SMS alert ─────────────────────────────────────────────────
      if (body.phone && (result.risk_level === "high" || result.risk_level === "critical")) {
        smsResult = await sendHealthAlert({
          phone: body.phone,
          riskLevel: result.risk_level,
          recommendation: result.recommendation,
          analysisId: result.analysis_id,
        }).catch(() => ({ success: false, provider: "none", error: "SMS unavailable" }));
      }

      return c.json({
        success: true,
        id,
        result,
        hospitals: nearbyHospitals,
        sms: smsResult,
        simulated: !usedTee,
        ai_powered: true,
      }, 200);
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
