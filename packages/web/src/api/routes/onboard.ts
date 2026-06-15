import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../database";
import { patients } from "../database/schema";
import { sendOtp, verifyOtp, submitPatientProfile, createPatientMap } from "../lib/t3-agent";
import { generateUUID } from "../lib/utils";
import { eq } from "drizzle-orm";

const onboard = new Hono()
  // POST /api/onboard/otp-request — send OTP via T3 SDK
  .post(
    "/otp-request",
    zValidator("json", z.object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }).refine(d => d.email || d.phone, { message: "email or phone required" })),
    async (c) => {
      const { email, phone } = c.req.valid("json");
      try {
        const requestId = await sendOtp(email, phone);
        return c.json({ success: true, requestId }, 200);
      } catch (err) {
        return c.json({ success: false, error: String(err) }, 500);
      }
    }
  )

  // POST /api/onboard/otp-verify — verify OTP code
  .post(
    "/otp-verify",
    zValidator("json", z.object({
      otpCode: z.string().min(4).max(8),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })),
    async (c) => {
      const { otpCode, email, phone } = c.req.valid("json");
      try {
        const verified = await verifyOtp(otpCode, email, phone);
        return c.json({ success: true, verified }, 200);
      } catch (err) {
        return c.json({ success: false, error: String(err) }, 500);
      }
    }
  )

  // POST /api/onboard/profile — submit patient profile via submitUserInput
  .post(
    "/profile",
    zValidator("json", z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      countryOfResidence: z.string().optional(),
      age: z.number().optional(),
    })),
    async (c) => {
      const body = c.req.valid("json");
      try {
        const profile = {
          first_name: body.firstName,
          last_name: body.lastName,
          email_address: body.email,
          phone_number: body.phone,
          country_of_residence: body.countryOfResidence,
          role: "patient",
        };

        const result = await submitPatientProfile(profile);
        const patientId = generateUUID();

        // Create T3 KV map for this patient
        let mapName: string | undefined;
        try {
          mapName = await createPatientMap(patientId);
        } catch {
          mapName = `patient-${patientId}`;
        }

        // Persist to DB
        await db.insert(patients).values({
          id: patientId,
          did: result.did,
          firstName: body.firstName,
          lastName: body.lastName,
          emailAddress: body.email,
          phoneNumber: body.phone,
          countryOfResidence: body.countryOfResidence,
          otpVerified: true,
          profileSubmitted: true,
          mapName,
        });

        return c.json({
          success: true,
          patientId,
          did: result.did,
          mapName,
          tenantAdmit: result.tenantAdmit,
        }, 200);
      } catch (err) {
        return c.json({ success: false, error: String(err) }, 500);
      }
    }
  )

  // GET /api/onboard/patient/:id
  .get("/patient/:id", async (c) => {
    const id = c.req.param("id");
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    if (!patient) return c.json({ error: "not found" }, 404);
    return c.json({ patient }, 200);
  });

export default onboard;
