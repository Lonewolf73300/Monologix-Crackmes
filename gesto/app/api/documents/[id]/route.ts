import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, decrypt, logError } from "@/lib/db";
import { buildDoc, KIND_LABEL, type Emp, type Kind } from "@/lib/documents";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u || u.role !== "patron" || !u.company_id) return new NextResponse("Non autorisé", { status: 401 });
  const { id } = await params;
  const row = db.prepare("SELECT d.kind,d.status,e.enc FROM documents d JOIN employees e ON e.id=d.employee_id WHERE d.id=? AND d.company_id=?").get(Number(id), u.company_id) as { kind: Kind; status: string; enc: string } | undefined;
  if (!row) return new NextResponse("Introuvable", { status: 404 });
  const apercu = req.nextUrl.searchParams.get("apercu");
  if (!apercu && row.status !== "valide") return new NextResponse("Document non validé : relis-le et valide-le d'abord.", { status: 403 });
  try {
    const co = db.prepare("SELECT name FROM companies WHERE id=?").get(u.company_id) as { name: string };
    const buf = await buildDoc(row.kind, decrypt<Emp>(row.enc), co.name);
    const name = `${KIND_LABEL[row.kind]}${apercu ? " (à relire)" : ""}.docx`;
    return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}` } });
  } catch (e) { logError("document", e); return new NextResponse("Erreur de génération, réessaie.", { status: 500 }); }
}
