import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ??
  (process.env.NODE_ENV === "production" ? undefined : "admin");

export async function POST(request: NextRequest) {
  try {
    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { ok: false, error: "ADMIN_PASSWORD não configurado" },
        { status: 500 }
      );
    }
    const body = await request.json();
    const { user, password } = body;

    if (user === ADMIN_USER && password === ADMIN_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set("auth_session", "ok", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: "/",
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Usuário ou senha inválidos" }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: "Erro ao processar" }, { status: 500 });
  }
}
