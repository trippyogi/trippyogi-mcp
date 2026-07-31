import { handle } from "hono/vercel";
import { app } from "../src/app.js";

export const runtime = "nodejs";
export const maxDuration = 30;

export default handle(app);
