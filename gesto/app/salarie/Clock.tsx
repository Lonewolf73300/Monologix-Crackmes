"use client";
import { useEffect, useState } from "react";

// Horloge en direct (heure de Paris), rendue après montage pour éviter tout décalage serveur/navigateur.
export default function Clock() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const f = () => setT(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }));
    f(); const id = setInterval(f, 10_000); return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums" suppressHydrationWarning>{t ?? "--:--"}</span>;
}
