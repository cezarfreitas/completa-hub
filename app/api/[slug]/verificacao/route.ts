import { NextRequest, NextResponse } from "next/server";
import { getIntegration, getAllSlugs } from "@/lib/integrations";
import { runVerificationFlow } from "@/lib/verification-flow";
import { connectDB } from "@/lib/mongodb";
import { VerificationLog } from "@/models/VerificationLog";

/**
 * POST /api/[slug]/viabilidade - Consultar viabilidade e cadastrar (pre-subscription)
 * Mesmo fluxo do n8n: Geocode → API Completa → retorna Cobertura, id_conecteai, etc.
 * Campos: rua, numero, bairro, cidade, cep, nome, whatsapp
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
    const { rua, numero, bairro, cidade, cep, nome, whatsapp } = body;

    if (!rua || !numero || !bairro || !cidade || !cep || !nome || !whatsapp) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios: rua, numero, bairro, cidade, cep, nome, whatsapp",
        },
        { status: 400 }
      );
    }

    const result = await runVerificationFlow(body, config);

    try {
      await connectDB();
      await VerificationLog.create({
        integrationSlug: slug,
        request: body,
        response: result,
      });
    } catch (logErr) {
      console.error("Erro ao salvar log:", logErr);
    }

    if ("error" in result) {
      return NextResponse.json(
        result,
        { status: result.error.includes("não encontrado") ? 400 : 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro no fluxo:", error);
    return NextResponse.json(
      {
        error: "Erro interno ao processar a requisição",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

