"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Logo } from "./brand";
import { Icon, type IconName } from "./icons";
import { logout } from "./actions";

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/tableau-de-bord", label: "Accueil", icon: "home" },
  { href: "/salaries", label: "Employés", icon: "users" },
  { href: "/documents", label: "Documents", icon: "file" },
  { href: "/echeances", label: "Échéances", icon: "calendar" },
];

export default function Nav({ company, email }: { company: string; email: string }) {
  const path = usePathname();
  const on = (h: string) => path === h || path.startsWith(h + "/");
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-night px-4 py-7 text-white lg:flex">
        <Link href="/tableau-de-bord" className="px-3"><Logo light /></Link>
        <nav className="mt-10 space-y-1.5">{ITEMS.map((i) => (
          <Link key={i.href} href={i.href} aria-current={on(i.href) ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-[15px] transition-colors ${on(i.href) ? "border-gold/60 bg-gradient-to-r from-[#3b301b] to-[#2a2417] font-semibold text-white" : "border-transparent text-white/65 hover:bg-white/5 hover:text-white"}`}>
            <Icon name={i.icon} className={`h-5 w-5 ${on(i.href) ? "text-gold" : ""}`} />{i.label}</Link>))}</nav>
        <div className="mt-auto flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <Avatar name={company} size={38} dark />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{company}</p><p className="truncate text-xs text-white/45">{email}</p></div>
          <form action={logout}><button title="Déconnexion" aria-label="Déconnexion" className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"><Icon name="logout" className="h-[18px] w-[18px]" /></button></form>
        </div>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 gap-1 rounded-t-3xl border-t border-line bg-white px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5 shadow-[0_-10px_30px_rgba(16,24,40,.08)] lg:hidden">{ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={on(i.href) ? "page" : undefined}
          className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold ${on(i.href) ? "bg-green-50 text-accent" : "text-zinc-500"}`}>
          <Icon name={i.icon} className="h-[22px] w-[22px]" />{i.label}</Link>))}</nav>
    </>
  );
}
