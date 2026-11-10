import { Suspense } from "react";
import Boite from "./Boite";

export const metadata = { title: "Le Chamois — boîte d'équipe" };

export default function Page() {
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return (
    <Suspense fallback={<p className="p-6">Chargement…</p>}>
      <Boite supabaseConfigured={supabaseConfigured} />
    </Suspense>
  );
}
