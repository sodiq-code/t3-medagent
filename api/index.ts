/**
 * Vercel Edge Function — T3 MedAgent API
 */
import { handle } from "hono/vercel";
import app from "../packages/web/src/api/index";

export const config = { runtime: "edge" };

export default handle(app);
