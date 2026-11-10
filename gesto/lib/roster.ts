export type RosterInput = { firstName: string; lastName: string; role: string; contact: string };

const norm = (h: string) => h.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ");
const cell = (v: string) => v.trim().replace(/^"(.*)"$/, "$1").trim();

function contactOf(email: string, phone: string, contact: string): string {
  if (email) return email.toLowerCase();
  if (phone) return phone;
  return contact;
}

export function contactError(contact: string): string | null {
  const v = contact.trim();
  if (!v) return "Indique un email ou un téléphone.";
  if (v.toLowerCase() === "email_in_thread") return "Email pas encore confirmé (email_in_thread). Lou doit le remplacer avant toute invitation.";
  if (v.includes("@")) return /^\S+@\S+\.\S+$/.test(v) ? null : "Email invalide.";
  if (v.replace(/\D/g, "").length < 8) return "Téléphone trop court, ou email invalide.";
  return null;
}

// CSV : séparateur virgule ou point-virgule. En-têtes : prenom, nom, role, et email ou telephone.
export function parseRosterCsv(text: string): { rows: RosterInput[]; errors: string[] } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { rows: [], errors: ["Fichier vide."] };
  const sep = lines[0].includes(";") && !lines[0].includes(",") ? ";" : lines[0].includes(";") ? ";" : ",";
  const head = lines[0].split(sep).map(norm);
  const at = (...names: string[]) => head.findIndex((h) => names.includes(h));
  const iFirst = at("prenom", "firstname", "first name", "first");
  const iLast = at("nom", "lastname", "last name", "last");
  const iRole = at("role", "poste", "fonction");
  const iEmail = at("email", "e mail", "mail", "courriel");
  const iPhone = at("telephone", "tel", "phone", "mobile");
  const iContact = at("contact", "email ou telephone", "email or phone");
  const iStatut = at("statut", "status", "inviter");
  if (iFirst < 0 || iLast < 0 || iRole < 0 || (iEmail < 0 && iPhone < 0 && iContact < 0)) {
    return { rows: [], errors: ["En-têtes attendus : prenom, nom, role, et une colonne email ou telephone."] };
  }
  const rows: RosterInput[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  lines.slice(1, 201).forEach((line, n) => {
    const cols = line.split(sep).map(cell);
    const row: RosterInput = {
      firstName: (cols[iFirst] ?? "").slice(0, 40),
      lastName: (cols[iLast] ?? "").slice(0, 40),
      role: (cols[iRole] ?? "").slice(0, 80),
      contact: contactOf(iEmail >= 0 ? cols[iEmail] ?? "" : "", iPhone >= 0 ? cols[iPhone] ?? "" : "", iContact >= 0 ? cols[iContact] ?? "" : "").slice(0, 80),
    };
    const where = `Ligne ${n + 2}`;
    const statut = iStatut >= 0 ? norm(cols[iStatut] ?? "") : "";
    if (["non confirme", "ne pas inviter", "optionnel", "optionnel manager"].includes(statut)) {
      errors.push(`${where} : ${row.firstName} ${row.lastName} n'est pas à inviter (${cols[iStatut]}).`);
      return;
    }
    if (!row.firstName || !row.lastName || !row.role) { errors.push(`${where} : prénom, nom et rôle sont obligatoires.`); return; }
    const bad = contactError(row.contact);
    if (bad) { errors.push(`${where} : ${bad}`); return; }
    const key = `${row.firstName.toLowerCase()}|${row.lastName.toLowerCase()}`;
    if (seen.has(key)) { errors.push(`${where} : ${row.firstName} ${row.lastName} est en double dans le fichier.`); return; }
    seen.add(key);
    rows.push(row);
  });
  if (lines.length > 201) errors.push("200 personnes maximum par import.");
  return { rows, errors };
}
