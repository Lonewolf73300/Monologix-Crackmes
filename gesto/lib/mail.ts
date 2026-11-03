import { logError } from "./db";
// Envoie via Resend si RESEND_API_KEY est défini ; sinon retourne "non_envoye" (jamais de faux envoi).
export async function sendMail(to: string, subject: string, text: string): Promise<"envoye" | "non_envoye" | "erreur"> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "non_envoye";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "Gesto <onboarding@resend.dev>", to, subject, text }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}`);
    return "envoye";
  } catch (e) { logError("mail", e); return "erreur"; }
}
