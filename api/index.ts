/**
 * Vercel Serverless Function — minimal test
 */
import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

app.get("/ping", (c) => c.json({ message: `Pong! ${Date.now()}` }));
app.get("/health-check", (c) => c.json({ status: "ok", service: "T3 MedAgent" }));

export default handle(app);
