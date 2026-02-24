import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Integration } from "@/models/Integration";

/**
 * GET /api/integrations/[id] - Busca integração por ID (sem expor google_api_key no response)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const doc = await Integration.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      id: doc._id,
      slug: doc.slug,
      name: doc.name,
      plan_id: doc.plan_id,
      completa_api_url: doc.completa_api_url,
      completa_origin: doc.completa_origin,
      n8n_webhook_url: doc.n8n_webhook_url || null,
      n8n_config_url: doc.n8n_config_url || null,
      documentacao_api_url: doc.documentacao_api_url || null,
      documentacao_origin: doc.documentacao_origin || null,
      documentacao_plan_id: doc.documentacao_plan_id ?? null,
      active: doc.active,
      endpoint: `/api/${doc.slug}`,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    console.error("Erro ao buscar integração:", error);
    return NextResponse.json(
      { error: "Erro ao buscar integração" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrations/[id] - Atualiza integração
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (body.name != null) update.name = body.name;
    if (body.plan_id != null) update.plan_id = Number(body.plan_id);
    if (body.completa_api_url != null) update.completa_api_url = body.completa_api_url;
    if (body.completa_origin != null) update.completa_origin = body.completa_origin;
    if (body.n8n_webhook_url !== undefined) update.n8n_webhook_url = body.n8n_webhook_url || null;
    if (body.n8n_config_url !== undefined) update.n8n_config_url = body.n8n_config_url || null;
    if (body.documentacao_api_url !== undefined) update.documentacao_api_url = body.documentacao_api_url || null;
    if (body.documentacao_origin !== undefined) update.documentacao_origin = body.documentacao_origin || null;
    if (body.documentacao_plan_id !== undefined)
      update.documentacao_plan_id = body.documentacao_plan_id != null ? Number(body.documentacao_plan_id) : null;
    if (body.active !== undefined) update.active = body.active;

    const doc = await Integration.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );

    if (!doc) {
      return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      id: doc._id,
      slug: doc.slug,
      name: doc.name,
      endpoint: `/api/${doc.slug}`,
    });
  } catch (error) {
    console.error("Erro ao atualizar integração:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar integração" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/[id] - Remove integração (soft delete: active=false)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const doc = await Integration.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true }
    );

    if (!doc) {
      return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ message: "Integração desativada", slug: doc.slug });
  } catch (error) {
    console.error("Erro ao remover integração:", error);
    return NextResponse.json(
      { error: "Erro ao remover integração" },
      { status: 500 }
    );
  }
}
