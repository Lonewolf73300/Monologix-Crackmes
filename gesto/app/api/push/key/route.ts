import { NextResponse } from "next/server";
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  return key ? NextResponse.json({ key }) : new NextResponse("Notifications non configurées", { status: 503 });
}
