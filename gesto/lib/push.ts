import webpush from "web-push";
import { db, logError } from "./db";

export const pushConfigured = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
type Sub = { id: number; endpoint: string; p256dh: string; auth: string };

// Envoie une notification système (Web Push) à tous les appareils d'une entreprise.
// "envoye" = le service push a accepté le message (il le délivre ensuite à l'appareil, même verrouillé).
export async function pushToCompany(companyId: number, payload: { title: string; body: string; url: string; tag: string }): Promise<"envoye" | "non_envoye" | "erreur"> {
  if (!pushConfigured()) return "non_envoye";
  const subs = db.prepare("SELECT id,endpoint,p256dh,auth FROM push_subs WHERE company_id=?").all(companyId) as Sub[];
  if (!subs.length) return "non_envoye";
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:contact@gesto.invalid", process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  let ok = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 86400, urgency: "high" });
      ok++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) db.prepare("DELETE FROM push_subs WHERE id=?").run(s.id); // abonnement expiré
      else logError("push", e);
    }
  }
  return ok > 0 ? "envoye" : "erreur";
}
