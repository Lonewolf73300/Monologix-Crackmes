import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, now, logError } from "@/lib/db";
import { KINDS, MAX_BYTES, MIMES, type MediaKind } from "@/lib/media";

type Ctx = { params: Promise<{ kind: string }> };
const valid = (k: string): k is MediaKind => (KINDS as readonly string[]).includes(k);

// Lecture : réservée aux utilisateurs du commerce (patron et salariés).
export async function GET(_: NextRequest, { params }: Ctx) {
  const { kind } = await params;
  const u = await currentUser();
  if (!u || !u.company_id) return new NextResponse("Non autorisé", { status: 401 });
  if (!valid(kind)) return new NextResponse("Introuvable", { status: 404 });
  const m = (await db.prepare("SELECT mime,data FROM company_media WHERE company_id=? AND kind=?").get(u.company_id, kind)) as { mime: string; data: Buffer } | undefined;
  if (!m) return new NextResponse("Introuvable", { status: 404 });
  return new NextResponse(new Uint8Array(m.data), { headers: { "Content-Type": m.mime, "Cache-Control": "private, max-age=86400" } });
}

// Envoi / retrait : réservé au patron. Formulaire multipart (champ « photo »), redirige vers les paramètres.
export async function POST(req: NextRequest, { params }: Ctx) {
  const { kind } = await params;
  const u = await currentUser();
  if (!u || u.role !== "patron" || !u.company_id) return new NextResponse("Non autorisé", { status: 401 });
  if (!valid(kind)) return new NextResponse("Introuvable", { status: 404 });
  const back = (q: string) => NextResponse.redirect(new URL(`/parametres?${q}`, req.url), 303);
  try {
    const f = await req.formData();
    if (f.get("remove")) {
      await db.prepare("DELETE FROM company_media WHERE company_id=? AND kind=?").run(u.company_id, kind);
      return back("retire=1");
    }
    const file = f.get("photo");
    if (!(file instanceof File) || file.size === 0) return back("erreur=fichier");
    if (!MIMES.includes(file.type)) return new NextResponse("Format refusé : JPEG, PNG ou WebP.", { status: 415 });
    if (file.size > MAX_BYTES) return new NextResponse("Photo trop lourde : 3 Mo maximum.", { status: 413 });
    const data = Buffer.from(await file.arrayBuffer());
    await db.prepare("INSERT INTO company_media(company_id,kind,mime,data,updated) VALUES(?,?,?,?,?) ON CONFLICT(company_id,kind) DO UPDATE SET mime=excluded.mime, data=excluded.data, updated=excluded.updated RETURNING company_id")
      .run(u.company_id, kind, file.type, data, now());
    return back("ok=1");
  } catch (e) { logError("media", e); return back("erreur=envoi"); }
}
