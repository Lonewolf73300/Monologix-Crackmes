import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from "docx";

export type Emp = { name: string; post: string; start: string; hours: string; salary: string; contractType: string; end?: string };
export type Kind = "contrat" | "fiche_horaire" | "checklist_dpae";
export const KIND_LABEL: Record<Kind, string> = { contrat: "Contrat de travail", fiche_horaire: "Fiche horaire", checklist_dpae: "Checklist DPAE" };
export const MENTION = "Modèle préparé par Gesto, à relire et valider par le commerçant avant usage ; ce n'est pas un conseil juridique. À faire relire par un juriste en cas de doute.";

const p = (t: string, bold = false) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, bold })] });
const h = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [new TextRun(t)] });
const fr = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "…");

export async function buildDoc(kind: Kind, e: Emp, company: string): Promise<Buffer> {
  const c: (Paragraph | Table)[] = [new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(KIND_LABEL[kind])] }), p(MENTION)];
  if (kind === "contrat") {
    const cdd = e.contractType === "CDD";
    c.push(
      h("Entre les soussignés"),
      p(`L'employeur : ${company}`), p(`Le salarié : ${e.name}`),
      h("Article 1 — Engagement"),
      p(`${e.name} est engagé(e) en qualité de ${e.post} à compter du ${fr(e.start)}, dans le cadre d'un contrat à durée ${cdd ? "déterminée" : "indéterminée"}.`),
      ...(cdd ? [p(`Terme du contrat : ${fr(e.end ?? "")}. Motif de recours : à préciser par l'employeur (obligatoire pour un CDD).`)] : []),
      h("Article 2 — Durée du travail"), p(`Durée hebdomadaire : ${e.hours} heures, répartie selon le planning remis au salarié.`),
      h("Article 3 — Rémunération"), p(`Rémunération mensuelle brute : ${e.salary} €, hors avantages éventuels.`),
      h("Article 4 — Convention collective et mutuelle"), p("Convention collective applicable et affiliation à la mutuelle d'entreprise : à compléter par l'employeur."),
      h("Article 5 — Période d'essai"), p("Durée éventuelle de la période d'essai : à compléter selon la convention collective."),
      h("Signatures"), p("Fait en deux exemplaires, le …… à ……"), p("L'employeur :                                   Le salarié :"),
    );
  } else if (kind === "fiche_horaire") {
    const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const cell = (t: string) => new TableCell({ children: [p(t)], width: { size: 20, type: WidthType.PERCENTAGE } });
    c.push(p(`Salarié : ${e.name} — ${e.post} — Employeur : ${company}`), p(`Durée contractuelle : ${e.hours} h / semaine. Semaine du : ……`),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
        new TableRow({ children: ["Jour", "Arrivée", "Pause", "Départ", "Total"].map(cell) }),
        ...days.map((d) => new TableRow({ children: [d, "", "", "", ""].map(cell) })),
      ] }), p(""), p("Total semaine : ……  h        Visa salarié :            Visa employeur :"));
  } else {
    const items = [
      `Déclarer ${e.name} (DPAE) auprès de l'URSSAF avant le ${fr(e.start)} (jusqu'à 8 jours avant l'embauche).`,
      "Conserver l'accusé de réception de la DPAE.",
      "Faire signer le contrat écrit (obligatoire pour un CDD : dans les 2 jours ouvrables suivant l'embauche).",
      "Inscrire le salarié sur le registre unique du personnel.",
      "Affilier le salarié à la mutuelle d'entreprise.",
      "Planifier la visite d'information et de prévention (médecine du travail).",
      "Afficher les horaires collectifs ou tenir un décompte du temps de travail.",
      "Remettre au salarié une copie du contrat et de ses horaires.",
    ];
    c.push(p(`Salarié : ${e.name} — début : ${fr(e.start)}`), p("Gesto ne fait pas la déclaration à ta place : tu la réalises toi-même sur net-entreprises.fr / urssaf.fr."), ...items.map((i) => p("☐  " + i)));
  }
  return Packer.toBuffer(new Document({ sections: [{ children: c }] }));
}
