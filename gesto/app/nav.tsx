"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, SideLogo } from "./brand";
import { Icon, type IconName } from "./icons";
import { logout } from "./actions";

const MAIN: { href: string; label: string; short: string; icon: IconName }[] = [
  { href: "/tableau-de-bord", label: "Accueil", short: "Accueil", icon: "home" },
  { href: "/salaries", label: "Mon équipe", short: "Équipe", icon: "users" },
  { href: "/documents", label: "Documents", short: "Documents", icon: "file" },
  { href: "/echeances", label: "Échéances", short: "Échéances", icon: "calendar" },
];
const SIDE = [...MAIN, { href: "/parametres", label: "Paramètres", short: "Paramètres", icon: "settings" as IconName }];

export default function Nav({ company, type, banner }: { company: string; type: string; banner?: string | null }) {
  const path = usePathname();
  const on = (h: string) => path === h || path.startsWith(h + "/");
  return (
    <>
      {/* Maquette 3 : barre latérale sombre, onglet actif doré */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[300px] flex-col bg-gradient-to-b from-[#161a22] to-[#0f1218] px-4 py-8 text-white lg:flex">
        <Link href="/tableau-de-bord" className="self-center"><SideLogo /></Link>
        <nav className="mt-12 space-y-2">{SIDE.map((i) => (
          <Link key={i.href} href={i.href} aria-current={on(i.href) ? "page" : undefined}
            className={`flex items-center gap-4 rounded-xl border px-5 py-3.5 text-[17px] transition-colors ${on(i.href) ? "border-gold/70 bg-gradient-to-r from-[#5a4826] to-[#3a2f1a] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,.08)]" : "border-transparent text-white/85 hover:bg-white/5"}`}>
            <Icon name={i.icon} className={`h-6 w-6 ${on(i.href) ? "text-gold" : "text-white/80"}`} />{i.label}</Link>))}</nav>
        <div className="mt-auto flex items-center gap-3 border-t border-white/10 px-2 pt-5">
          <Avatar name={company} src={banner} size={52} dark />
          <div className="min-w-0 flex-1"><p className="truncate text-[17px] font-semibold">{company}</p><p className="truncate text-sm capitalize text-white/60">{type || "Commerce"}</p></div>
          <form action={logout}><button title="Se déconnecter" aria-label="Se déconnecter" className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"><Icon name="logout" className="h-5 w-5" /></button></form>
        </div>
      </aside>
      {/* Maquette 1 : barre d'onglets, pastille active */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 gap-2 rounded-t-[28px] border-t border-line bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 shadow-[0_-10px_30px_rgba(16,24,40,.08)] backdrop-blur lg:hidden">{MAIN.map((i) => (
        <Link key={i.href} href={i.href} aria-current={on(i.href) ? "page" : undefined}
          className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[13px] ${on(i.href) ? "bg-blue-50 font-semibold text-blue-600" : "text-zinc-500"}`}>
          <Icon name={i.icon} className="h-6 w-6" filled={on(i.href) && i.icon === "home"} />{i.short}</Link>))}</nav>
    </>
  );
}
