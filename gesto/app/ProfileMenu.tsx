"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./brand";
import { Icon } from "./icons";
import { logout } from "./actions";

// Menu profil réel : identité, Paramètres, déconnexion. variant « icon » (maquette 1) ou « pill » (maquette 3).
export default function ProfileMenu({ name, company, email, photo, variant }: { name: string; company: string; email: string; photo?: string | null; variant: "icon" | "pill" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div ref={ref} className="relative">
      {variant === "icon" ? (
        <button onClick={() => setOpen(!open)} aria-label="Mon compte" aria-expanded={open} className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"><Icon name="user" className="h-6 w-6" /></button>
      ) : (
        <button onClick={() => setOpen(!open)} aria-label="Mon compte" aria-expanded={open} className="flex items-center gap-3 rounded-full bg-black/45 py-1.5 pl-1.5 pr-4 text-left text-white backdrop-blur hover:bg-black/55">
          <Avatar name={name} src={photo} size={42} dark />
          <span className="leading-tight"><span className="block text-[15px] font-semibold">{name}</span><span className="block text-sm text-white/70">{company}</span></span>
          <Icon name="chevronDown" className="h-5 w-5 text-white/80" />
        </button>
      )}
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-white text-[#0f172a] shadow-lift">
          <div className="border-b border-line px-4 py-3"><p className="font-semibold">{company}</p><p className="truncate text-sm text-zinc-500">{email}</p></div>
          <Link href="/parametres" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"><Icon name="settings" className="h-5 w-5 text-zinc-500" />Paramètres</Link>
          <form action={logout}><button className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50"><Icon name="logout" className="h-5 w-5" />Se déconnecter</button></form>
        </div>)}
    </div>
  );
}
