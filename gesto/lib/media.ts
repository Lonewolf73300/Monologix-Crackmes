import { db } from "./db";

export const KINDS = ["banniere", "profil"] as const;
export type MediaKind = (typeof KINDS)[number];
export const MAX_BYTES = 3 * 1024 * 1024;
export const MIMES = ["image/jpeg", "image/png", "image/webp"];

// URL des photos du commerce (avec version pour le cache), ou null si aucune photo envoyée.
export async function mediaUrls(companyId: number): Promise<Record<MediaKind, string | null>> {
  const rows = (await db.prepare("SELECT kind,updated FROM company_media WHERE company_id=?").all(companyId)) as { kind: MediaKind; updated: string }[];
  const out: Record<MediaKind, string | null> = { banniere: null, profil: null };
  for (const r of rows) out[r.kind] = `/api/media/${r.kind}?v=${encodeURIComponent(r.updated)}`;
  return out;
}
