import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gesto — Ta paperasse, c'est fini.",
  manifest: "/manifest.webmanifest",
  description: "Gesto enlève la paperasse aux commerçants et restaurateurs et t'évite les oublis.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen font-sans antialiased">
        <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">Gesto<span className="text-accent">.</span></Link>
          <Link href="/cours/chapitre-1" className="text-sm text-zinc-300 hover:text-white">Chapitre 1 gratuit</Link>
        </header>
        {children}
        <footer className="mx-auto max-w-3xl px-5 py-10 text-xs text-zinc-500">
          Gesto prépare, rappelle et organise. Gesto ne déclare rien à ta place et ne remplace ni un avocat, ni un expert-comptable.{" "}
          <Link href="/mentions-legales" className="underline">Ce que Gesto fait et ne fait pas</Link>
        </footer>
      </body>
    </html>
  );
}
