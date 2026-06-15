/**
 * Vercel Serverless Function entry point.
 * Wraps the Hono app with the official hono/vercel adapter.
 */
import { handle } from "hono/vercel";
import app from "../packages/web/src/api/index";

export default handle(app);
