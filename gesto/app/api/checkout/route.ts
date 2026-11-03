import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { currentUser } from "@/lib/auth";
import { db, now, logError } from "@/lib/db";

// Offres : "cours" (paiement unique) ou "abonnement" (mensuel). Les IDs de prix Stripe viennent de l'environnement.
export async function POST(req: NextRequest) {
  const u = await currentUser();
  if (!u) return NextResponse.redirect(new URL("/connexion", req.url), 303);
  const key = process.env.STRIPE_SECRET_KEY;
  const form = await req.formData();
  const offer = String(form.get("offer"));
  const price = offer === "cours" ? process.env.STRIPE_PRICE_COURS : offer === "abonnement" ? process.env.STRIPE_PRICE_ABO : undefined;
  if (!key || !price) return new NextResponse("Paiement non configuré.", { status: 503 });
  if (!form.get("accept")) return new NextResponse("Tu dois accepter les conditions et le prélèvement.", { status: 400 });
  try {
    const stripe = new Stripe(key);
    const base = process.env.APP_URL || new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: offer === "cours" ? "payment" : "subscription",
      line_items: [{ price, quantity: 1 }], allow_promotion_codes: true, customer_email: u.email,
      client_reference_id: `${u.id}:${offer}`, success_url: `${base}/tableau-de-bord?paiement=ok`, cancel_url: `${base}/offres`,
    });
    await db.prepare("INSERT INTO purchases(user_id,offer,status,stripe_id,created) VALUES(?,?,'en_attente',?,?)").run(u.id, offer, session.id, now());
    return NextResponse.redirect(session.url!, 303);
  } catch (e) { logError("checkout", e); return new NextResponse("Erreur de paiement, réessaie.", { status: 502 }); }
}
