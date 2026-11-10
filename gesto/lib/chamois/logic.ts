// Boîte d'équipe du Chamois. Données minimales : prénom, nom, email, rôle, textes.
// Pas de salaire, pas de santé, pas de pièce d'identité.

export type Role = "patron" | "manager" | "salarie";
export type Priority = "basse" | "normale" | "haute";
export type Audience =
  | { type: "tous" }
  | { type: "role"; role: "manager" | "salarie" }
  | { type: "personne"; accountId: string };

export type Account = {
  id: string;
  restaurantId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  password: string | null;
  active: boolean;
  inviteToken: string | null;
};

export type Directive = {
  id: string;
  restaurantId: string;
  authorId: string;
  body: string;
  priority: Priority;
  due: string | null;
  audience: Audience;
  createdAt: string;
  /** Affichage seulement. Aucune règle n'est exécutée. */
  kind?: "recurrent" | "meteo" | "planning";
  test?: boolean;
};

export type ReadMark = { directiveId: string; accountId: string; at: string };

export type Note = {
  id: string;
  restaurantId: string;
  directiveId: string | null;
  authorId: string;
  kind: "reponse" | "fait" | "rapport";
  body: string;
  status: "ouvert" | "vu" | "traite";
  createdAt: string;
};

export type Restaurant = { id: string; name: string; managersMaySend: boolean };

export type Db = {
  restaurant: Restaurant;
  accounts: Account[];
  directives: Directive[];
  reads: ReadMark[];
  notes: Note[];
};

export const ROLE_LABEL: Record<Role, string> = { patron: "Patron", manager: "Manager", salarie: "Salarié" };
export const PRIORITY_LABEL: Record<Priority, string> = { basse: "Basse", normale: "Normale", haute: "Haute" };

export function fullName(a: Account) { return `${a.firstName} ${a.lastName}`.trim(); }

export function seed(): Db {
  return {
    restaurant: { id: "le-chamois", name: "Le Chamois", managersMaySend: false },
    accounts: [{
      id: "lou",
      restaurantId: "le-chamois",
      firstName: "Lou",
      lastName: "Adrait",
      email: "lou@chamois.demo",
      role: "patron",
      password: "demo-lou",
      active: true,
      inviteToken: null,
    }],
    directives: [],
    reads: [],
    notes: [],
  };
}

export function canSend(db: Db, account: Account) {
  if (!account.active) return false;
  if (account.role === "patron") return true;
  return account.role === "manager" && db.restaurant.managersMaySend;
}

export function targets(db: Db, d: Directive): Account[] {
  const people = db.accounts.filter((a) => a.restaurantId === d.restaurantId && a.active && a.id !== d.authorId);
  const audience = d.audience;
  if (audience.type === "tous") return people;
  if (audience.type === "role") return people.filter((a) => a.role === audience.role);
  return people.filter((a) => a.id === audience.accountId);
}

export function incoming(db: Db, account: Account) {
  return db.directives
    .filter((d) => d.restaurantId === account.restaurantId && targets(db, d).some((t) => t.id === account.id))
    .sort((a, b) => Number(b.priority === "haute") - Number(a.priority === "haute") || b.createdAt.localeCompare(a.createdAt));
}

export function sent(db: Db, account: Account) {
  return db.directives.filter((d) => d.authorId === account.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function inbox(db: Db, account: Account) {
  const notes = db.notes.filter((n) => n.restaurantId === account.restaurantId);
  const visible = account.role === "salarie" ? notes.filter((n) => n.authorId === account.id) : notes;
  return visible.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function readBy(db: Db, d: Directive, accountId: string) {
  return db.reads.find((r) => r.directiveId === d.id && r.accountId === accountId) ?? null;
}

export function audienceLabel(db: Db, d: Directive) {
  const audience = d.audience;
  if (audience.type === "tous") return "Tout le monde";
  if (audience.type === "role") return audience.role === "manager" ? "Les managers" : "Les salariés";
  const person = db.accounts.find((a) => a.id === audience.accountId);
  return person ? fullName(person) : "Une personne";
}
