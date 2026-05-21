import type { IDatabase } from "../db";
import { extractToken } from "./auth";
import { verifyJwt } from "../jwt";

export async function handleToggleStar(
  author: string,
  name: string,
  request: Request,
  db: IDatabase,
  jwtSecret: string
): Promise<Response> {
  const token = extractToken(request);
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await verifyJwt(token, jwtSecret);
  if (!payload) {
    return new Response("Invalid token", { status: 401 });
  }

  const starred = db.toggleStar(payload.sub, author, name);
  const count = db.getStarCount(author, name);

  return new Response(JSON.stringify({ starred, count }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGetStars(
  author: string,
  name: string,
  request: Request,
  db: IDatabase,
  jwtSecret: string
): Promise<Response> {
  const token = extractToken(request);
  let viewer_starred = false;

  if (token) {
    const payload = await verifyJwt(token, jwtSecret);
    if (payload) {
      viewer_starred = db.isStarredBy(payload.sub, author, name);
    }
  }

  const count = db.getStarCount(author, name);

  return new Response(JSON.stringify({ count, viewer_starred }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
