/**
 * Hospital API — 1,200+ global hospital database
 * Powers intelligent appointment matching by specialty, region, country
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { generateUUID } from "../lib/utils";
import { HOSPITALS, findHospitals, generateSlots, TOTAL_HOSPITALS, type Hospital } from "../data/hospitals";

// In-memory booking store (demo — resets on restart)
const bookings: Map<string, {
  id: string;
  patientDid: string;
  riskLevel: string;
  hospitalId: string;
  hospitalName: string;
  specialist: string;
  slot: string;
  status: "confirmed" | "pending" | "cancelled";
  createdAt: number;
  hospitalRef: string;
  city: string;
  country: string;
  address: string;
}> = new Map();

const hospital = new Hono()
  // GET /api/hospital/stats — summary stats
  .get("/stats", (_c) => {
    return _c.json({
      total: TOTAL_HOSPITALS,
      countries: [...new Set(HOSPITALS.map(h => h.country))].length,
      regions: [...new Set(HOSPITALS.map(h => h.region))].length,
      emergency: HOSPITALS.filter(h => h.emergency).length,
      telehealth: HOSPITALS.filter(h => h.tier === "telehealth").length,
    });
  })

  // GET /api/hospital/search — search hospitals
  .get("/search", (c) => {
    const specialty = c.req.query("specialty");
    const country = c.req.query("country");
    const region = c.req.query("region");
    const emergency = c.req.query("emergency") === "true";
    const limit = parseInt(c.req.query("limit") ?? "10");

    const results = findHospitals({ specialty, country, region, emergency, limit });
    return c.json({ hospitals: results, total: results.length }, 200);
  })

  // GET /api/hospital/slots — available appointment slots
  .get("/slots", (c) => {
    const hospitalId = c.req.query("hospitalId");
    const riskLevel = c.req.query("risk") ?? "low";

    let h: Hospital | undefined;
    if (hospitalId) {
      h = HOSPITALS.find(hosp => hosp.id === hospitalId);
    }

    const slots = generateSlots(8);
    const specialist = h ? h.specialties[0] : (riskLevel === "critical" ? "Emergency Department" : "General Practitioner");

    return c.json({
      hospital: h ?? null,
      slots: slots.map((slot, i) => ({
        id: `slot-${i + 1}`,
        datetime: slot,
        specialist,
        available: true,
        type: i % 3 === 0 ? "in-person" : i % 3 === 1 ? "telehealth" : "in-person",
      })),
    }, 200);
  })

  // POST /api/hospital/book — create appointment booking
  .post(
    "/book",
    zValidator("json", z.object({
      patientDid: z.string().min(1),
      riskLevel: z.enum(["low", "medium", "high", "critical"]),
      analysisId: z.string(),
      hospitalId: z.string().optional(),
      preferredSlot: z.string().optional(),
      specialist: z.string().optional(),
      country: z.string().optional(),
    })),
    (c) => {
      const body = c.req.valid("json");
      const id = generateUUID();

      // Find best matching hospital
      const matches = findHospitals({
        emergency: body.riskLevel === "critical",
        country: body.country,
        specialty: body.specialist,
        limit: 1,
      });

      let h: Hospital | undefined;
      if (body.hospitalId) {
        h = HOSPITALS.find(hosp => hosp.id === body.hospitalId);
      }
      h = h ?? matches[0];

      const specialist = body.specialist ?? h?.specialties[0] ?? "General Practitioner";
      const slots = generateSlots(5);
      const slot = body.preferredSlot ?? slots[0];

      const booking = {
        id,
        patientDid: body.patientDid,
        riskLevel: body.riskLevel,
        hospitalId: h?.id ?? "unknown",
        hospitalName: h?.name ?? "T3 Telehealth",
        specialist,
        slot,
        status: "confirmed" as const,
        createdAt: Date.now(),
        hospitalRef: `HOS-${id.slice(0, 8).toUpperCase()}`,
        city: h?.city ?? "Global",
        country: h?.country ?? "Worldwide",
        address: h?.address ?? "Available online",
      };

      bookings.set(id, booking);

      return c.json({
        success: true,
        booking,
        message: `Appointment confirmed with ${specialist} at ${booking.hospitalName} on ${new Date(slot).toLocaleString()}`,
        t3Analytics: {
          trigger: "T3 MedAgent AI + TEE analysis",
          analysisId: body.analysisId,
          protocol: "terminal3-testnet",
          hospitalDatabase: `${TOTAL_HOSPITALS}+ hospitals`,
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

  // GET /api/hospital/bookings — list all
  .get("/bookings", (_c) => {
    return _c.json({ bookings: Array.from(bookings.values()), total: bookings.size }, 200);
  });

export default hospital;
