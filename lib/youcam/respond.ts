import "server-only";
import { YoucamError, friendlyMessage } from "./errors";

/** Uniform error body for every YouCam-backed route; never leaks payloads or the key. */
export function errorResponse(e: unknown): Response {
  const err = e instanceof YoucamError ? e : new YoucamError("unknown_error", 500, String(e));
  if (!(e instanceof YoucamError)) console.error(e);
  const status = err.status >= 400 && err.status < 600 ? err.status : 500;
  return Response.json({ status: "error", code: err.code, message: friendlyMessage(err.code) }, { status });
}
