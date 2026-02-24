import { connectDB } from "./mongodb";
import { Integration } from "@/models/Integration";

export interface IntegrationConfig {
  slug: string;
  name: string;
  plan_id: number;
  completa_api_url: string;
  completa_origin: string;
  n8n_webhook_url?: string | null;
}

export async function getIntegration(
  slug: string
): Promise<IntegrationConfig | null> {
  await connectDB();
  const doc = await Integration.findOne({ slug, active: true });
  if (!doc) return null;
  return {
    slug: doc.slug,
    name: doc.name,
    plan_id: doc.plan_id,
    completa_api_url: doc.completa_api_url,
    completa_origin: doc.completa_origin,
    n8n_webhook_url: doc.n8n_webhook_url || null,
  };
}

export async function getAllSlugs(): Promise<string[]> {
  await connectDB();
  const docs = await Integration.find({ active: true }).select("slug");
  return docs.map((d) => d.slug);
}

export async function getAllIntegrations(): Promise<
  Array<{ slug: string; name: string; endpoint: string }>
> {
  await connectDB();
  const docs = await Integration.find({ active: true })
    .select("slug name")
    .lean<Array<{ slug: string; name: string }>>();
  return docs.map((d) => ({
    slug: d.slug,
    name: d.name,
    endpoint: `/api/${d.slug}`,
    endpoint_viabilidade: `/api/${d.slug}/viabilidade`,
    endpoint_documentacao: `/api/${d.slug}/documentacao`,
  }));
}
