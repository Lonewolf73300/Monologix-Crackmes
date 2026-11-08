"use client";
import { useActionState } from "react";

export function Form({ action, children, submit, danger = false }: { action: (s: unknown, f: FormData) => Promise<{ error?: string; ok?: boolean } | void>; children: React.ReactNode; submit: string; danger?: boolean }) {
  const [st, fn, pending] = useActionState(action as never, null as { error?: string; ok?: boolean } | null);
  return (
    <form action={fn} className="space-y-4">
      {children}
      {st?.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{st.error}</p>}
      {st?.ok && <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">Enregistré.</p>}
      <button disabled={pending} className={`${danger ? "btn w-full bg-red-600 py-3.5 text-base text-white hover:bg-red-700" : "btn-primary w-full py-3.5 text-base"} disabled:opacity-50`}>{pending ? "…" : submit}</button>
    </form>
  );
}
export const inputCls = "mt-1.5 w-full rounded-lg border border-line bg-panel px-3.5 py-3 text-base outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";
export function Field({ label, name, type = "text", ...r }: { label: string; name: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="block text-sm font-medium text-zinc-300">{label}<input name={name} type={type} className={inputCls} {...r} /></label>;
}
