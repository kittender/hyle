import type { IDatabase } from "../db";
import { extractToken } from "./auth";
import { verifyJwt } from "../jwt";
import { notifyNewReview } from "./notifications";

export async function handleSubmitReview(
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

  try {
    const body = (await request.json()) as { rating: number; body?: string };

    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      return new Response(JSON.stringify({ error: "Rating must be an integer between 1 and 5" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const review = db.upsertReview(payload.sub, author, name, body.rating, body.body);

    // Send notification
    const reviewer = db.getUser(payload.sub);
    if (reviewer) {
      notifyNewReview(author, name, reviewer.username, body.rating, body.body, db).catch(err =>
        console.error("Notification error:", err)
      );
    }

    return new Response(JSON.stringify(review), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }
}

export function handleGetReviews(author: string, name: string, db: IDatabase): Response {
  const reviews = db.getReviews(author, name);

  return new Response(JSON.stringify(reviews), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
