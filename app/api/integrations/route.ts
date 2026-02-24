import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Integration } from "@/models/Integration";
import { getAllIntegrations } from "@/lib/integrations";

/**
 * GET /api/integrations - Lista integrações
 * ?admin=1 - Retorna lista completa com id para gerenciamento
 * ?slug=xxx - Retorna dados públicos de um cliente (para portal)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "1";
    const slug = searchParams.get("slug");

    if (slug) {
      const doc = await Integration.findOne({
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        active: true,
      });
      if (!doc) {
        return NextResponse.json(
          { error: "Cliente não encontrado" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        slug: doc.slug,
        name: doc.name,
        endpoint: `/api/${doc.slug}`,
        endpoint_viabilidade: `/api/${doc.slug}/viabilidade`,
        endpoint_documentacao: `/api/${doc.slug}/documentacao`,
        n8n_webhook_url: doc.n8n_webhook_url || null,
        n8n_config_url: doc.n8n_config_url || null,
        documentacao_api_url: doc.documentacao_api_url || null,
        documentacao_origin: doc.documentacao_origin || null,
        documentacao_plan_id: doc.documentacao_plan_id ?? null,
      });
    }

    if (admin) {
      const docs = await Integration.find({ active: true }).sort({
        createdAt: -1,
      });
      return NextResponse.json(
        docs.map((d) => ({
          id: d._id,
          slug: d.slug,
          name: d.name,
          plan_id: d.plan_id,
          completa_api_url: d.completa_api_url,
          completa_origin: d.completa_origin,
          n8n_webhook_url: d.n8n_webhook_url || null,
          n8n_config_url: d.n8n_config_url || null,
          documentacao_api_url: d.documentacao_api_url || null,
          documentacao_origin: d.documentacao_origin || null,
          documentacao_plan_id: d.documentacao_plan_id ?? null,
          endpoint: `/api/${d.slug}`,
          endpoint_viabilidade: `/api/${d.slug}/viabilidade`,
          endpoint_documentacao: `/api/${d.slug}/documentacao`,
        }))
      );
    }

    const list = await getAllIntegrations();
    return NextResponse.json(list);
  } catch (error) {
    console.error("Erro ao listar integrações:", error);
    return NextResponse.json(
      { error: "Erro ao listar integrações" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations - Cria nova integração
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      slug,
      name,
      plan_id,
      completa_api_url,
      completa_origin,
      n8n_webhook_url,
      n8n_config_url,
      documentacao_api_url,
      documentacao_origin,
      documentacao_plan_id,
    } = body;

    if (!slug || !name || !plan_id || !completa_api_url || !completa_origin) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios: slug, name, plan_id, completa_api_url, completa_origin",
        },
        { status: 400 }
      );
    }

    const slugNormalized = String(slug).toLowerCase().replace(/\s+/g, "-");
    const exists = await Integration.findOne({ slug: slugNormalized });
    if (exists) {
      return NextResponse.json(
        { error: `Cliente com identificador "${slugNormalized}" já existe` },
        { status: 409 }
      );
    }

    const doc = await Integration.create({
      slug: slugNormalized,
      name,
      plan_id: Number(plan_id),
      completa_api_url,
      completa_origin,
      n8n_webhook_url: n8n_webhook_url || undefined,
      n8n_config_url: n8n_config_url || undefined,
      documentacao_api_url: documentacao_api_url || undefined,
      documentacao_origin: documentacao_origin || undefined,
      documentacao_plan_id: documentacao_plan_id != null ? Number(documentacao_plan_id) : undefined,
      active: true,
    });

    return NextResponse.json({
      id: doc._id,
      slug: doc.slug,
      name: doc.name,
      endpoint: `/api/${doc.slug}`,
    });
  } catch (error) {
    console.error("Erro ao criar integração:", error);
    return NextResponse.json(
      { error: "Erro ao criar integração" },
      { status: 500 }
    );
  }
}
