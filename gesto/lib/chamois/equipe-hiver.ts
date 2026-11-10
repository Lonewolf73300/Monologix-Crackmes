// Liste hiver 2026/27 transmise par Lou. Aucun email ni téléphone : il les confirmera.
// Seize personnes embauchées, plus trois en attente (Fabrice, le frère de Lou, Titi).
// James est un manager possible, pas un poste. John Adrait et Maurice (Momo) Adrait n'y sont pas.

export type EquipierPrevu = {
  firstName: string;
  lastName: string;
  role: string;
  statut: "embauche" | "non_confirme" | "optionnel" | "en_attente";
  note?: string;
  /** Affichage quand le prénom ou le nom n'est pas connu. */
  label?: string;
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
  { firstName: "David", lastName: "Remy", role: "chef de cuisine", statut: "embauche", note: "promesse d'embauche du 16 septembre 2026" },
  { firstName: "Fabrice", lastName: "", role: "guide motoneige", statut: "en_attente", note: "nom probablement Dufresne, non confirmé" },
  { firstName: "", lastName: "", role: "poste à confirmer", statut: "en_attente", label: "Frère de Lou", note: "prénom, nom et poste non confirmés" },
  { firstName: "Titi", lastName: "", role: "poste à confirmer", statut: "en_attente", note: "surnom seulement. Lou parle de Sébastien Thilliez : lignes non fusionnées" },
  { firstName: "James", lastName: "Adrait", role: "manager optionnel", statut: "optionnel", note: "ne pas inviter" },
];

export function nomAffiche(p: EquipierPrevu) {
  return p.label || [p.firstName, p.lastName].filter(Boolean).join(" ");
}

/** Cibles salle et cuisine. Le bar et le snack sont en dehors. Seules les embauches comptent. */
export const CIBLES = [
  { groupe: "Salle", poste: "Chefs de rang", cible: 4, roles: ["chef de rang"] },
  { groupe: "Salle", poste: "Runners", cible: 2, roles: ["runneuse / serveuse", "runner", "serveuse / runneuse"] },
  { groupe: "Cuisine", poste: "Chef de cuisine", cible: 1, roles: ["chef de cuisine"] },
  { groupe: "Cuisine", poste: "Second", cible: 1, roles: ["second de cuisine"] },
  { groupe: "Cuisine", poste: "Chef de partie froid", cible: 1, roles: ["chef de partie froid"] },
  { groupe: "Cuisine", poste: "Commis", cible: 1, roles: ["commis de cuisine", "commis"] },
  { groupe: "Cuisine", poste: "Plongeur", cible: 1, roles: ["plongeur"] },
  { groupe: "Cuisine", poste: "Pizzaïolo", cible: 1, roles: ["pizzaiolo"] },
  { groupe: "Cuisine", poste: "Crêpier", cible: 1, roles: ["crêpier"] },
] as const;

export function pourvus(roles: readonly string[]) {
  return EQUIPE_HIVER_2026.filter((p) => p.statut === "embauche" && roles.includes(p.role));
}
