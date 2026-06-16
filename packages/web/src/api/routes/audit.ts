import { Hono } from "hono";
import { db } from "../database";
import { auditEvents } from "../database/schema";
import { generateUUID } from "../lib/utils";
import { desc } from "drizzle-orm";

const audit = new Hono()
  // GET /api/audit/events — serve audit log from DB (written by analyze route)
  .get("/events", async (c) => {
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
