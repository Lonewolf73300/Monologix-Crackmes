// Liste hiver 2026/27 transmise par Lou. Aucun email ni téléphone : il les confirmera.
// Quinze personnes embauchées, dont Gianni Drago. James est un manager possible, pas un poste.
// John Adrait et Maurice (Momo) Adrait ne font pas partie de cette liste.

export type EquipierPrevu = {
  firstName: string;
  lastName: string;
  role: string;
  statut: "embauche" | "non_confirme" | "optionnel";
  note?: string;
};

export const EQUIPE_HIVER_2026: EquipierPrevu[] = [
  { firstName: "Lola", lastName: "Hamon", role: "barmaid", statut: "embauche" },
  { firstName: "Gabin", lastName: "Heine", role: "limonadier", statut: "embauche" },
  { firstName: "Andrea", lastName: "Favarel", role: "runneuse / serveuse", statut: "embauche", note: "Andrea Macarena Olortegui Ramirez" },
  { firstName: "Clément", lastName: "Favarel", role: "chef de partie froid", statut: "embauche" },
  { firstName: "Loreleï", lastName: "Volt", role: "polyvalente", statut: "embauche" },
  { firstName: "Axel", lastName: "Sbrizzi", role: "snackeur", statut: "embauche" },
  { firstName: "Sébastien", lastName: "Thilliez", role: "snackeur", statut: "embauche" },
  { firstName: "Kevin", lastName: "Biribo", role: "plongeur", statut: "embauche", note: "retour" },
  { firstName: "Jérémie", lastName: "Pothin", role: "crêpier", statut: "embauche", note: "retour" },
  { firstName: "Mickaël", lastName: "Manfredi", role: "pizzaiolo", statut: "embauche", note: "retour" },
  { firstName: "Lucas", lastName: "Dos Santos Albuquerque", role: "commis de cuisine", statut: "embauche" },
  { firstName: "Matéo", lastName: "Levasseur", role: "second de cuisine", statut: "embauche", note: "retour" },
  { firstName: "Chloé", lastName: "Dété", role: "chef de rang", statut: "embauche", note: "retour" },
  { firstName: "Sébastien", lastName: "Papot", role: "chef de rang", statut: "embauche" },
  { firstName: "Gianni", lastName: "Drago", role: "chef de rang", statut: "embauche", note: "confirmé" },
  { firstName: "James", lastName: "Adrait", role: "manager optionnel", statut: "optionnel", note: "ne pas inviter" },
];
