import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
export async function requirePatronNoCompany() {
  const u = await currentUser();
  if (!u) redirect("/connexion");
  if (u.role !== "patron") redirect("/salarie");
}
