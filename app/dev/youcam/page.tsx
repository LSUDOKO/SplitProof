import { notFound } from "next/navigation";
import { YoucamDevTool } from "./tool";

/** Developer page (build plan M1): run one real photo through the full pipeline. Disabled in production. */
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <YoucamDevTool />;
}
