// Moteur de règles simple : diagnostic -> modules/échéances proposés.
export const TYPES = ["restaurant", "bar", "boutique", "agriculture", "artisan", "hôtel", "autre"] as const;
export const NB = ["0", "1-5", "6-10", "11-20", "20+"] as const;
export const SEASONS = ["à l'année", "saisonnier", "mixte"] as const;
export const PAINS = ["Paperasse des salariés", "URSSAF", "Caisse et conformité", "Comptabilité", "Stock et fournisseurs", "Recrutement", "Planning et heures", "Hygiène et sécurité"];
export const OBJECTIVES = ["Gagner du temps", "Être carré avec l'URSSAF", "Déléguer", "Mieux marger", "Préparer une transmission ou une ouverture"];

export function suggestions(c: { type: string; nb_sal: string; pains: string[] }) {
  const hasStaff = c.nb_sal !== "0";
  const out: { title: string; why: string }[] = [];
  if (c.type === "restaurant" && hasStaff) out.push({ title: "Créer tes contrats, DPAE et fiches horaires", why: "Restaurant avec salariés" });
  if (c.pains.includes("URSSAF")) out.push({ title: "Ajouter une échéance de vérification URSSAF", why: "Douleur : URSSAF" });
  if (c.pains.includes("Planning et heures")) out.push({ title: "Activer le pointage des salariés", why: "Douleur : planning et heures" });
  return out;
}
export function chapterFor(pains: string[]) {
  return pains[0] === "Paperasse des salariés" || !pains.length ? "/cours/chapitre-1" : "/cours/chapitre-1";
}
