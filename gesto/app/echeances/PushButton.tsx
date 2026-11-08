"use client";
import { useEffect, useState } from "react";

const b64 = (s: string) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
export default function PushButton() {
  const [state, setState] = useState<"chargement" | "inactif" | "actif" | "indisponible" | "refuse">("chargement");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) { setState("indisponible"); setMsg("Ce navigateur ne gère pas les notifications système. Sur iPhone : ajoute Gesto à l'écran d'accueil (Partager > Sur l'écran d'accueil), puis rouvre-le depuis l'icône."); return; }
      if ((await fetch("/api/push/key")).status === 503) { setState("indisponible"); setMsg("Les notifications système ne sont pas encore configurées côté Gesto."); return; }
      const reg = await navigator.serviceWorker.register("/sw.js");
      setState((await reg.pushManager.getSubscription()) ? "actif" : "inactif");
    })().catch(() => { setState("indisponible"); setMsg("Erreur au chargement des notifications."); });
  }, []);
  async function enable() {
    try {
      if ((await Notification.requestPermission()) !== "granted") { setState("refuse"); return; }
      const { key } = await (await fetch("/api/push/key")).json();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) });
      const r = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!r.ok) throw new Error();
      setState("actif");
    } catch { setMsg("Activation impossible, réessaie."); }
  }
  async function disable() {
    const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription();
    if (sub) { await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe(); }
    setState("inactif");
  }
  return (
    <div className={`mt-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${state === "actif" ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${state === "actif" ? "bg-green-600" : "bg-blue-600"} text-white`}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-bold text-[#0f172a]">Rappels sur ce téléphone</p>
        {state === "actif" && <p className="text-green-800">Activés : tu recevras tes rappels même écran verrouillé.</p>}
        {state === "inactif" && <p className="text-blue-900">Reçois tes échéances à l&apos;heure, même écran verrouillé.</p>}
        {state === "refuse" && <p className="text-red-700">Notifications refusées : autorise-les dans les réglages du navigateur.</p>}
        {state === "indisponible" && <p className="text-zinc-500">{msg}</p>}
        {state === "chargement" && <p className="text-zinc-500">Vérification…</p>}
        {msg && state !== "indisponible" && <p className="mt-1 text-red-700">{msg}</p>}
      </div>
      {state === "actif" && <button onClick={disable} className="btn-ghost px-4 py-2 text-sm">Désactiver</button>}
      {state === "inactif" && <button onClick={enable} className="btn-primary px-4 py-2.5 text-sm">Activer les rappels sur cet appareil</button>}
    </div>
  );
}
