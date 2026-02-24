import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/config-proxy?url=xxx - Busca configuração de URL externa (evita CORS)
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "Parâmetro url é obrigatório" },
      { status: 400 }
    );
  }
  try {
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar config:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar configuração",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
