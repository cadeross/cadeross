import { notFound } from "next/navigation";
import Lab from "./Lab";

/* Development only: each live demo alone on the page, for filming with
   Stageshow's film.mjs (?demo=<id>). Not built into production. */
export default async function Page({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { demo } = await searchParams;
  return <Lab demo={demo ?? "harbor-servers"} />;
}
