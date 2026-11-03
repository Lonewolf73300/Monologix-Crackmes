import { requirePatronNoCompany } from "./guard";
import Wizard from "./Wizard";
export default async function Page() {
  await requirePatronNoCompany();
  return <main className="mx-auto max-w-md px-5 pb-10"><Wizard /></main>;
}
