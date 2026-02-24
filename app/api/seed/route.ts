import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Integration } from "@/models/Integration";

/**
 * POST /api/seed - Cria cliente inicial se o banco estiver vazio
 */
export async function POST() {
  try {
    await connectDB();
    const count = await Integration.countDocuments({ active: true });
    if (count > 0) {
      return NextResponse.json({
        message: "Banco já possui clientes",
        count,
      });
    }

    await Integration.create({
      slug: "completa-2025",
      name: "Completa 2025",
      plan_id: 4928,
      completa_api_url: "https://assine.completa.vc/api/v2/subscriptions",
      completa_origin: "https://completa.conecte.ai/api/NYoTwiBvcZKoeunF",
      active: true,
    });

    return NextResponse.json({
      message: "Cliente inicial criado: completa-2025",
    });
  } catch (error) {
    console.error("Erro no seed:", error);
    return NextResponse.json(
      { error: "Erro ao executar seed" },
      { status: 500 }
    );
  }
}
