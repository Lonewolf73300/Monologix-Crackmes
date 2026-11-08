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
    <div className="mt-4 rounded-lg border border-line bg-panel p-4 text-sm">
      {state === "actif" && <p className="text-green-700">Notifications système activées sur cet appareil. <button onClick={disable} className="ml-2 underline text-zinc-400">Désactiver</button></p>}
      {state === "inactif" && <button onClick={enable} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">Activer les rappels sur cet appareil</button>}
      {state === "refuse" && <p className="text-red-700">Notifications refusées : autorise-les dans les réglages du navigateur.</p>}
      {state === "indisponible" && <p className="text-zinc-400">{msg}</p>}
      {state === "chargement" && <p className="text-zinc-500">…</p>}
      {msg && state !== "indisponible" && <p className="mt-2 text-red-700">{msg}</p>}
    </div>
  );
}
