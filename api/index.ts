import { app } from "../src/app.js";

export const runtime = "nodejs";
export const maxDuration = 30;

async function handle(request: Request): Promise<Response> {
  return app.fetch(request);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
