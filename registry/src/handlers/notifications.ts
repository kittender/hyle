import type { IDatabase } from "../db";
import type { User } from "../types";

interface ResendEmailRequest {
  from: string;
  to: string;
  subject: string;
  html: string;
}

async function sendEmailViaResend(request: ResendEmailRequest): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured, skipping email notification");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    return response.ok;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

export async function notifyNewStar(
  substrate_author: string,
  substrate_name: string,
  star_count: number,
  db: IDatabase
): Promise<void> {
  const user = db.getUserByUsername(substrate_author);
  if (!user?.email) return;

  const prefs = db.getNotificationPrefs(user.id);
  if (!prefs?.email_on_star) return;

  await sendEmailViaResend({
    from: "noreply@hyle.dev",
    to: user.email,
    subject: `Your substrate ${substrate_name} received a star!`,
    html: `
      <h2>${substrate_name} received a star!</h2>
      <p>Your substrate now has ${star_count} stars.</p>
      <p><a href="https://hyle.dev/substrates/${substrate_author}/${substrate_name}">View substrate</a></p>
    `,
  });
}

export async function notifyNewReview(
  substrate_author: string,
  substrate_name: string,
  reviewer: string,
  rating: number,
  body?: string,
  db?: IDatabase
): Promise<void> {
  if (!db) return;
  const user = db.getUserByUsername(substrate_author);
  if (!user?.email) return;

  const prefs = db.getNotificationPrefs(user.id);
  if (!prefs?.email_on_review) return;

  await sendEmailViaResend({
    from: "noreply@hyle.dev",
    to: user.email,
    subject: `${reviewer} reviewed your substrate ${substrate_name}`,
    html: `
      <h2>New review for ${substrate_name}</h2>
      <p><strong>${reviewer}</strong> left a ${rating}-star review:</p>
      <blockquote>${body || "(No comment)"}</blockquote>
      <p><a href="https://hyle.dev/substrates/${substrate_author}/${substrate_name}">View reviews</a></p>
    `,
  });
}

export async function notifyNewVersion(
  substrate_author: string,
  substrate_name: string,
  version: string,
  db?: IDatabase
): Promise<void> {
  if (!db) return;
  const user = db.getUserByUsername(substrate_author);
  if (!user?.email) return;

  const prefs = db.getNotificationPrefs(user.id);
  if (!prefs?.email_on_new_version) return;

  await sendEmailViaResend({
    from: "noreply@hyle.dev",
    to: user.email,
    subject: `New version ${version} of ${substrate_name} published`,
    html: `
      <h2>New version of ${substrate_name}</h2>
      <p>Version <strong>${version}</strong> has been published.</p>
      <p><a href="https://hyle.dev/substrates/${substrate_author}/${substrate_name}">View substrate</a></p>
    `,
  });
}
