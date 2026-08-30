import { getActor } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCertificateTemplate } from "@/lib/certificateTemplate.server";
import TemplateEditor from "./TemplateEditor";

export const metadata = { title: "Certificate Design" };

export default async function CertificateTemplatePage() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (actor.role !== "admin") redirect("/instructor");

  const template = await getCertificateTemplate();
  return <TemplateEditor initial={template} />;
}
