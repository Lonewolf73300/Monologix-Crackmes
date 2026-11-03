"use client";
import { useActionState } from "react";

export function Form({ action, children, submit }: { action: (s: unknown, f: FormData) => Promise<{ error?: string; ok?: boolean } | void>; children: React.ReactNode; submit: string }) {
  const [st, fn, pending] = useActionState(action as never, null as { error?: string; ok?: boolean } | null);
  return (
    <form action={fn} className="space-y-4">
      {children}
      {st?.error && <p role="alert" className="rounded-lg bg-red-950 p-3 text-sm text-red-300">{st.error}</p>}
      {st?.ok && <p className="rounded-lg bg-green-950 p-3 text-sm text-green-300">Enregistré.</p>}
      <button disabled={pending} className="w-full rounded-xl bg-accent px-6 py-4 text-lg font-semibold text-black disabled:opacity-50">{pending ? "…" : submit}</button>
    </form>
  );
}
export const inputCls = "mt-1 w-full rounded-xl border border-line bg-panel px-4 py-3 text-base";
export function Field({ label, name, type = "text", ...r }: { label: string; name: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="block text-sm text-zinc-300">{label}<input name={name} type={type} className={inputCls} {...r} /></label>;
}
