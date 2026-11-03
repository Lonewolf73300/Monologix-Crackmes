import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

const secret = () => {
  const s = process.env.GESTO_SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production" && process.env.GESTO_ALLOW_DEV_KEY !== "1") throw new Error("GESTO_SESSION_SECRET manquant en production.");
  return "dev-only-secret-change-me";
};
const sign = (v: string) => crypto.createHmac("sha256", secret()).update(v).digest("hex");

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16);
  return salt.toString("hex") + ":" + crypto.scryptSync(pw, salt, 64).toString("hex");
}
export function checkPassword(pw: string, stored: string): boolean {
  const [s, h] = stored.split(":");
  const a = crypto.scryptSync(pw, Buffer.from(s, "hex"), 64);
  return crypto.timingSafeEqual(a, Buffer.from(h, "hex"));
}
export async function startSession(userId: number) {
  const exp = Date.now() + 30 * 864e5;
  const v = `${userId}.${exp}`;
  (await cookies()).set("gesto_session", `${v}.${sign(v)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(exp) });
}
export async function endSession() { (await cookies()).delete("gesto_session"); }

export type User = { id: number; email: string; role: string; company_id: number | null };
export async function currentUser(): Promise<User | null> {
  const c = (await cookies()).get("gesto_session")?.value;
  if (!c) return null;
  const [id, exp, sig] = c.split(".");
  const expected = sign(`${id}.${exp}`);
  if (!sig || sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(exp) < Date.now()) return null;
  return (await db.prepare("SELECT id,email,role,company_id FROM users WHERE id=?").get(Number(id)) as User) ?? null;
}
export async function requirePatron(): Promise<User & { company_id: number }> {
  const u = await currentUser();
  if (!u) redirect("/connexion");
  if (u.role !== "patron") redirect("/salarie");
  if (!u.company_id) redirect("/diagnostic");
  return u as User & { company_id: number };
}
