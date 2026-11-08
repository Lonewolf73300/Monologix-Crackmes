"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PATRON = [
  { href: "/tableau-de-bord", label: "Accueil", icon: "⌂" },
  { href: "/salaries", label: "Employés", icon: "☺" },
  { href: "/documents", label: "Documents", icon: "▤" },
  { href: "/echeances", label: "Échéances", icon: "◷" },
];
const SALARIE = [{ href: "/salarie", label: "Accueil", icon: "⌂" }];

export default function Nav({ role }: { role: string }) {
  const path = usePathname();
  const items = role === "patron" ? PATRON : SALARIE;
  const on = (h: string) => path === h || path.startsWith(h + "/");
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-line bg-panel p-4 md:flex">
        <Link href={items[0].href} className="mb-6 text-2xl font-bold tracking-tight">Gesto<span className="text-accent">.</span></Link>
        <nav className="space-y-1">{items.map((i) => (
          <Link key={i.href} href={i.href} aria-current={on(i.href) ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${on(i.href) ? "bg-accent/15 text-accent" : "text-zinc-300 hover:bg-white/5"}`}><span aria-hidden>{i.icon}</span>{i.label}</Link>))}</nav>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-panel md:hidden">{items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={on(i.href) ? "page" : undefined} className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs ${on(i.href) ? "text-accent" : "text-zinc-400"}`}><span aria-hidden className="text-lg">{i.icon}</span>{i.label}</Link>))}</nav>
    </>
  );
}
