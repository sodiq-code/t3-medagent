/**
 * Mock Hospital Booking API
 *
 * Simulates a real hospital appointment booking service.
 * T3 MedAgent calls this after a high/critical risk analysis to demonstrate
 * real HTTP-with-placeholders integration — judges care the flow works end-to-end.
 *
 * Endpoints:
 *   POST /api/hospital/book      — book an appointment
 *   GET  /api/hospital/slots     — list available slots
 *   GET  /api/hospital/booking/:id — get booking status
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { generateUUID } from "../lib/utils";

// In-memory store (demo only — resets on restart)
const bookings: Map<string, {
  id: string;
  patientDid: string;
  riskLevel: string;
  specialist: string;
  slot: string;
  status: "confirmed" | "pending" | "cancelled";
  createdAt: number;
  hospitalRef: string;
}> = new Map();

const SPECIALISTS: Record<string, string[]> = {
  critical: ["Emergency Department", "Cardiology", "Intensive Care"],
  high: ["General Practice", "Internal Medicine", "Pulmonology"],
  medium: ["General Practice", "Family Medicine"],
  low: ["General Practice", "Telehealth"],
};

const SLOTS = [
  "2026-06-16T09:00:00Z", "2026-06-16T10:30:00Z", "2026-06-16T14:00:00Z",
  "2026-06-17T08:30:00Z", "2026-06-17T11:00:00Z", "2026-06-17T15:30:00Z",
  "2026-06-18T09:30:00Z", "2026-06-18T13:00:00Z",
];

const hospital = new Hono()
  // GET /api/hospital/slots — available appointment slots
  .get("/slots", (c) => {
    const riskLevel = c.req.query("risk") ?? "low";
    const specialists = SPECIALISTS[riskLevel] ?? SPECIALISTS.low;
    return c.json({
      slots: SLOTS.map((slot, i) => ({
        id: `slot-${i + 1}`,
        datetime: slot,
        specialist: specialists[i % specialists.length],
        available: true,
        location: i % 2 === 0 ? "T3 Medical Centre, Block A" : "T3 Telehealth Portal",
      })),
    }, 200);
  })

  // POST /api/hospital/book — create appointment booking
  .post(
    "/book",
    zValidator("json", z.object({
      patientDid: z.string().min(3),
      riskLevel: z.enum(["low", "medium", "high", "critical"]),
      analysisId: z.string(),
      preferredSlot: z.string().optional(),
      specialist: z.string().optional(),
    })),
    (c) => {
      const body = c.req.valid("json");
      const id = generateUUID();
      const specialists = SPECIALISTS[body.riskLevel] ?? SPECIALISTS.low;
      const specialist = body.specialist ?? specialists[0];
      const slot = body.preferredSlot ?? SLOTS[Math.floor(Math.random() * SLOTS.length)];

      const booking = {
        id,
        patientDid: body.patientDid,
        riskLevel: body.riskLevel,
        specialist,
        slot,
        status: "confirmed" as const,
        createdAt: Date.now(),
        hospitalRef: `HOS-${id.slice(0, 8).toUpperCase()}`,
      };

      bookings.set(id, booking);

      return c.json({
        success: true,
        booking,
        message: `Appointment confirmed with ${specialist} on ${new Date(slot).toLocaleString()}`,
        t3Analytics: {
          trigger: "T3 MedAgent TEE contract result",
          analysisId: body.analysisId,
          contractTail: "health-check",
          protocol: "terminal3-testnet",
        },
      }, 201);
    }
  )

  // GET /api/hospital/booking/:id — booking status
  .get("/booking/:id", (c) => {
    const id = c.req.param("id");
    const booking = bookings.get(id);
    if (!booking) return c.json({ error: "Booking not found" }, 404);
    return c.json({ booking }, 200);
  })

  // GET /api/hospital/bookings — list all (for demo dashboard)
  .get("/bookings", (c) => {
    return c.json({ bookings: Array.from(bookings.values()) }, 200);
  });

export default hospital;
