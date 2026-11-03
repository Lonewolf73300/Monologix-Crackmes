import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db, logError } from "@/lib/db";

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY, wh = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !wh) return new NextResponse("Non configuré", { status: 503 });
  try {
    const stripe = new Stripe(key);
    const ev = stripe.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", wh);
    if (ev.type === "checkout.session.completed") {
      const s = ev.data.object as Stripe.Checkout.Session;
      await db.prepare("UPDATE purchases SET status='paye' WHERE stripe_id=?").run(s.id);
    }
    return NextResponse.json({ received: true });
  } catch (e) { logError("webhook", e); return new NextResponse("Signature invalide", { status: 400 }); }
}
