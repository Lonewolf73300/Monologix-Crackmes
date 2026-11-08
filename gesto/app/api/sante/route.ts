import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushConfigured } from "@/lib/push";

// Contrôle de configuration (protégé par CRON_SECRET). Ne renvoie que des oui/non, jamais de valeur secrète.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Non autorisé", { status: 401 });
  let base = false;
  try { await db.prepare("SELECT 1 AS ok").get(); base = true; } catch { /* base injoignable */ }
  const has = (k: string) => !!process.env[k];
  const checks = {
    base_postgres: base,
    cle_chiffrement_salaries: has("GESTO_DATA_KEY"),
    secret_session: has("GESTO_SESSION_SECRET"),
    cle_cron: true,
    notifications_systeme_vapid: pushConfigured(),
    email_repli_resend: has("RESEND_API_KEY"),
    paiement_stripe: has("STRIPE_SECRET_KEY") && has("STRIPE_PRICE_COURS") && has("STRIPE_PRICE_ABO") && has("STRIPE_WEBHOOK_SECRET"),
    fonctions_masquees_activees: process.env.GESTO_EXTRAS === "1",
  };
  const bloquants = ["base_postgres", "cle_chiffrement_salaries", "secret_session", "notifications_systeme_vapid"] as const;
  return NextResponse.json({ pret_pour_rappels: bloquants.every((k) => checks[k]), checks });
}
