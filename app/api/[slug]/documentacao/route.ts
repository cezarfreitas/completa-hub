import { NextRequest, NextResponse } from "next/server";
import { getIntegration, getAllSlugs } from "@/lib/integrations";
import { connectDB } from "@/lib/mongodb";
import { VerificationLog } from "@/models/VerificationLog";

/**
 * POST /api/[slug]/documentacao - Recebe payload de documentação (nós somos o webhook)
 * Payload esperado:
 * - id_conectai (obrigatório, da viabilidade)
 * - Nome, Sobrenome, Rua, Numero, Bairro, Cidade, Cep, Estado
 * - Nascimento, Whatsapp, Email, RG ou CNH, CPF
 * - Foto Documento, Selfie Documento (URLs)
 * - Data de Vencimento
 * - Outro Telefone, Plano, Data criação Oportunidade, Data criação Lead, Data Ganho (opcionais)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const config = await getIntegration(slug);

    if (!config) {
      const disponiveis = await getAllSlugs();
      return NextResponse.json(
        {
          error: `Cliente "${slug}" não encontrado`,
          disponiveis,
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    if (!body.id_conectai && !body.id_conecteai) {
      return NextResponse.json(
        {
          error: "Campo id_conectai ou id_conecteai é obrigatório",
        },
        { status: 400 }
      );
    }

    const payload = {
      ...body,
      id_conectai: body.id_conectai ?? body.id_conecteai,
    };

    try {
      await connectDB();
      await VerificationLog.create({
        integrationSlug: slug,
        request: body,
        response: {
          ok: true,
          message: "Documentação recebida",
          payload,
        },
      });
    } catch (logErr) {
      console.error("Erro ao salvar log:", logErr);
    }

    return NextResponse.json({
      ok: true,
      message: "Documentação recebida",
      payload,
    });
  } catch (error) {
    console.error("Erro no fluxo documentação:", error);
    return NextResponse.json(
      {
        error: "Erro interno ao processar a requisição",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
