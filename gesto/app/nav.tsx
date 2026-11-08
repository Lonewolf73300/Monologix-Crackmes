"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./brand";

const I = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  users: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21c0-4 3.5-6 8-6s8 2 8 6",
  file: "M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8",
  cal: "M4 6h16v15H4zM4 10h16M8 3v6M16 3v6",
};
const PATRON = [
  { href: "/tableau-de-bord", label: "Accueil", icon: I.home },
  { href: "/salaries", label: "Employés", icon: I.users },
  { href: "/documents", label: "Documents", icon: I.file },
  { href: "/echeances", label: "Échéances", icon: I.cal },
];
const SALARIE = [{ href: "/salarie", label: "Accueil", icon: I.home }];
const Ico = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;

export default function Nav({ role }: { role: string }) {
  const path = usePathname();
  const items = role === "patron" ? PATRON : SALARIE;
  const on = (h: string) => path === h || path.startsWith(h + "/");
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-night p-5 md:flex">
        <Link href={items[0].href} className="mb-8 mt-2"><Logo light /></Link>
        <nav className="space-y-2">{items.map((i) => (
          <Link key={i.href} href={i.href} aria-current={on(i.href) ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-[15px] ${on(i.href) ? "border-gold/60 bg-gold/15 font-semibold text-gold" : "border-transparent text-slate-300 hover:bg-white/5"}`}><Ico d={i.icon} />{i.label}</Link>))}</nav>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex rounded-t-3xl border-t border-line bg-white px-2 shadow-[0_-8px_24px_rgba(15,23,42,.08)] md:hidden">{items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={on(i.href) ? "page" : undefined} className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium ${on(i.href) ? "text-accent" : "text-slate-500"}`}>
          {on(i.href) && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-accent" />}<Ico d={i.icon} />{i.label}</Link>))}</nav>
    </>
  );
}
