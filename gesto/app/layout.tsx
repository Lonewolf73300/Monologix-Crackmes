import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Nav from "./nav";
import { Logo } from "./brand";

export const metadata: Metadata = {
  title: "Gesto — Ta paperasse, c'est fini.",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false, nocache: true }, // privé tant que la conformité (SIREN, mentions, CGV, RGPD) n'est pas bouclée
  description: "Gesto enlève la paperasse aux commerçants et restaurateurs et t'évite les oublis.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#101112" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser().catch(() => null);
  const patron = user?.role === "patron" && user.company_id ? user : null;
  const company = patron ? ((await db.prepare("SELECT name FROM companies WHERE id=?").get(patron.company_id).catch(() => null)) as { name: string } | null)?.name ?? "" : "";
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen font-sans">
        {patron && <Nav company={company} email={patron.email} />}
        {!user && (
          <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
            <Link href="/"><Logo /></Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/cours/chapitre-1" className="text-zinc-400 hover:text-[#141414]">Chapitre 1 gratuit</Link>
              <Link href="/connexion" className="font-medium hover:underline">Connexion</Link>
            </nav>
          </header>)}
        <div className={patron ? "pb-24 pt-6 md:pb-0 md:pl-64 md:pt-10" : ""}>
          {children}
          <footer className={`mx-auto max-w-5xl px-5 py-10 text-xs text-zinc-500 ${user?.role === "salarie" ? "hidden" : ""}`}>
            Gesto prépare, rappelle et organise. Gesto ne déclare rien à ta place et ne remplace ni un avocat, ni un expert-comptable.{" "}
            <Link href="/mentions-legales" className="underline underline-offset-2">Ce que Gesto fait et ne fait pas</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
