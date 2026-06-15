import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../database";
import { delegations } from "../database/schema";
import { createHealthDelegation, getAgentDid } from "../lib/t3-agent";
import { generateUUID } from "../lib/utils";
import { eq } from "drizzle-orm";

const delegate = new Hono()
  // POST /api/delegate/create — buildDelegationCredential + signAgentInvocation
  .post(
    "/create",
    zValidator("json", z.object({
      agentPublicKey: z.string().min(10),
      functions: z.array(z.string()).optional(),
      expiresInDays: z.number().default(7),
    })),
    async (c) => {
      const { agentPublicKey, functions } = c.req.valid("json");
      try {
        const credential = await createHealthDelegation(agentPublicKey, functions);
        const issuerDid = getAgentDid() || "unknown";

        // Serialize BigInt fields for JSON transport
        const safeCred = JSON.parse(
          JSON.stringify(credential, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
        );

        const id = generateUUID();
        await db.insert(delegations).values({
          id,
          issuerDid,
          agentPublicKey,
          functions: JSON.stringify(safeCred.functions ?? []),
          credential: JSON.stringify(safeCred),
          status: "active",
        });

        return c.json({ success: true, id, credential: safeCred }, 200);
      } catch (err) {
        return c.json({ success: false, error: String(err) }, 500);
      }
    }
  )

  // GET /api/delegate/list
  .get("/list", async (c) => {
    const rows = await db.select().from(delegations);
    return c.json({ delegations: rows }, 200);
  })

  // DELETE /api/delegate/:id — revoke
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.update(delegations)
      .set({ status: "revoked" })
      .where(eq(delegations.id, id));
    return c.json({ success: true }, 200);
  });

export default delegate;
