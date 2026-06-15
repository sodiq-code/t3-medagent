import { Hono } from "hono";
import { db } from "../database";
import { auditEvents } from "../database/schema";
import { getContractLogs } from "../lib/t3-agent";
import { generateUUID } from "../lib/utils";
import { desc } from "drizzle-orm";

const audit = new Hono()
  // GET /api/audit/events — fetch & sync audit log from T3 contracts.logs()
  .get("/events", async (c) => {
    try {
      // Pull fresh from T3 node
      const logs = await getContractLogs();
      // Sync to local DB
      for (const log of logs) {
        await db.insert(auditEvents).values({
          id: generateUUID(),
          contractTail: "health-check",
          functionName: "analyze-symptoms",
          level: log.level,
          message: log.message,
          tsMs: log.ts_ms,
          spanId: log.span_id,
        }).onConflictDoNothing().catch(() => {});
      }
    } catch {
      // contracts.logs() may fail if contract not yet deployed — use DB cache
    }

    const events = await db.select()
      .from(auditEvents)
      .orderBy(desc(auditEvents.tsMs))
      .limit(100);

    return c.json({ events }, 200);
  })

  // GET /api/audit/summary
  .get("/summary", async (c) => {
    const events = await db.select().from(auditEvents);
    const byLevel = events.reduce((acc, e) => {
      acc[e.level] = (acc[e.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return c.json({
      total: events.length,
      byLevel,
      lastEvent: events[0]?.tsMs || null,
    }, 200);
  });

export default audit;
