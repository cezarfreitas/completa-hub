import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VerificationLog } from "@/models/VerificationLog";

/**
 * GET /api/logs - Lista logs de verificação
 * ?slug=completa-2025 - Filtrar por integração
 * ?limit=50 - Limite (padrão 50)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 500);

    const query = slug ? { integrationSlug: slug } : {};
    const logs = await VerificationLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Erro ao listar logs:", error);
    return NextResponse.json(
      { error: "Erro ao listar logs" },
      { status: 500 }
    );
  }
}
