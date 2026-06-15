/**
 * Vercel Serverless Function — T3 MedAgent API
 * Runtime: nodejs22.x
 *
 * Bridges Node.js IncomingMessage/ServerResponse → Web Request/Response
 * so Hono's app.fetch() works without the Edge-only hono/vercel adapter.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../packages/web/src/api/index";

export const config = { runtime: "nodejs22.x" };

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    // Build URL
    const proto =
      (req.headers["x-forwarded-proto"] as string) || "https";
    const host =
      (req.headers["x-forwarded-host"] as string) ||
      req.headers.host ||
      "localhost";
    const url = new URL(req.url ?? "/", `${proto}://${host}`);

    // Collect body
    const body = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on("data", (c: Buffer) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });

    // Build Web Request
    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (val) headers.set(key, Array.isArray(val) ? val.join(", ") : val);
    }

    const webReq = new Request(url.toString(), {
      method: req.method ?? "GET",
      headers,
      body:
        req.method !== "GET" && req.method !== "HEAD" && body.length > 0
          ? body
          : undefined,
    });

    // Call Hono
    const webRes = await app.fetch(webReq);

    // Write response
    res.statusCode = webRes.status;
    webRes.headers.forEach((val, key) => res.setHeader(key, val));
    const buf = Buffer.from(await webRes.arrayBuffer());
    res.end(buf);
  } catch (err) {
    console.error("[api/index]", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}
