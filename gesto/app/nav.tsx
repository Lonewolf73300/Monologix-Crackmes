"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Logo } from "./brand";
import { logout } from "./actions";

const I = {
  home: "M4 10.5 12 4l8 6.5V20H4z M9.5 20v-5h5v5",
  users: "M15.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM5 20c.8-3.4 3.6-5 7-5s6.2 1.6 7 5",
  file: "M7 3.5h7l4 4V20.5H7zM13.5 3.5V8H18M9.5 12.5h6M9.5 16h6",
  cal: "M4.5 6h15v14h-15zM4.5 10h15M8.5 3.5v4M15.5 3.5v4",
};
const ITEMS = [
  { href: "/tableau-de-bord", label: "Aujourd'hui", icon: I.home },
  { href: "/salaries", label: "Employés", icon: I.users },
  { href: "/documents", label: "Documents", icon: I.file },
  { href: "/echeances", label: "Échéances", icon: I.cal },
];
const Ico = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;

export default function Nav({ company, email }: { company: string; email: string }) {
  const path = usePathname();
  const on = (h: string) => path === h || path.startsWith(h + "/");
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-night px-4 py-6 text-white md:flex">
        <Link href="/tableau-de-bord" className="px-2"><Logo light /></Link>
        <p className="mt-8 px-3 font-mono text-[10px] uppercase tracking-label text-white/35">Paperasse & échéances</p>
        <nav className="mt-2 space-y-0.5">{ITEMS.map((i) => (
          <Link key={i.href} href={i.href} aria-current={on(i.href) ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${on(i.href) ? "bg-white/[.07] text-white" : "text-white/55 hover:text-white"}`}>
            {on(i.href) && <span className="absolute inset-y-2 left-0 w-[2px] rounded bg-gold" />}<Ico d={i.icon} />{i.label}</Link>))}</nav>
        <div className="mt-auto flex items-center gap-3 border-t border-white/10 px-2 pt-4">
          <Avatar name={company} dark />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{company}</p><p className="truncate text-xs text-white/40">{email}</p></div>
          <form action={logout}><button title="Déconnexion" aria-label="Déconnexion" className="rounded p-1.5 text-white/45 hover:bg-white/10 hover:text-white"><Ico d="M14 4.5h5v15h-5M10 8l-4 4 4 4M6 12h9" /></button></form>
        </div>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">{ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={on(i.href) ? "page" : undefined} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${on(i.href) ? "font-medium text-[#141414]" : "text-zinc-500"}`}>
          <Ico d={i.icon} />{i.label}<span className={`h-1 w-1 rounded-full ${on(i.href) ? "bg-accent" : "bg-transparent"}`} /></Link>))}</nav>
    </>
  );
}
