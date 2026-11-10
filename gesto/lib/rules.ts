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

// Exactement trois priorités, toujours dans le même ordre pour les mêmes réponses.
export function priorities(c: { type: string; nb_sal: string; season: string; pains: string[]; objective: string }): string[] {
  const out: string[] = [];
  const add = (s: string) => { if (out.length < 3 && !out.includes(s)) out.push(s); };
  const pains = c.pains ?? [];
  if (pains.includes("Paperasse des salariés") || pains.includes("URSSAF")) add("Préparer les fiches et les brouillons de contrat avant le premier jour, puis les relire.");
  if (pains.includes("URSSAF")) add("Poser le rappel de déclaration préalable à l'embauche, et la faire toi-même sur urssaf.fr.");
  if (pains.includes("Planning et heures") || pains.includes("Recrutement")) add("Ajouter l'équipe réelle, une personne ou un fichier CSV, et transmettre les codes d'invitation à la main.");
  if (pains.includes("Hygiène et sécurité")) add("Faire remonter les contrôles du service dans un rapport d'équipe, sans les présenter comme une certification.");
  if (pains.includes("Stock et fournisseurs")) add("Noter les dates d'approvisionnement dans les échéances. Gesto n'envoie aucune commande.");
  if (pains.includes("Caisse et conformité") || pains.includes("Comptabilité")) add("Garder les échéances datées ici, et les faire vérifier par le comptable.");
  if (c.season === "saisonnier") add("Pour un CDD de saison, indiquer le motif et la date de fin avant de valider le brouillon.");
  if (c.objective === "Déléguer") add("Écrire les consignes du patron, et lire les réponses de l'équipe sur le téléphone.");
  if (c.objective === "Gagner du temps") add("Traiter d'abord le document ou l'échéance encore ouvert.");
  if (c.objective === "Être carré avec l'URSSAF") add("Valider un contrat seulement quand la convention collective est indiquée.");
  if (c.nb_sal === "0") add("Commencer sans fiche inventée : l'équipe s'ajoute quand tu as les vrais prénoms.");
  if (c.type === "restaurant") add("Réserver l'outil au service du restaurant : équipe, consignes, paperasse.");
  add("Relire chaque document : ce sont des brouillons, pas des contrats à signer.");
  add("Les rappels s'affichent dans l'application. L'e-mail ne part que si une clé d'envoi est configurée.");
  add("Chaque compte ne voit que son restaurant. Un salarié ne voit pas les fiches des autres.");
  return out.slice(0, 3);
}
