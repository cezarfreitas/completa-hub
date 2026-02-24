import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/clientes", "/logs", "/cliente"];
const protectedApiPaths = ["/api/integrations", "/api/logs"];

function isProtected(pathname: string): boolean {
  if (protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (protectedApiPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  return false;
}

function isAuthRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health"
  );
}

const reservedApiSegments = ["integrations", "logs", "auth", "config-proxy", "seed", "dashboard"];

function isPublicApi(pathname: string): boolean {
  const match = pathname.match(/^\/api\/([^/]+)(?:\/([^/]+))?/);
  if (!match) return false;
  const [, segment1, segment2] = match;
  if (reservedApiSegments.includes(segment1)) return false;
  if (segment2 === "viabilidade" || segment2 === "documentacao") return true;
  if (!segment2 && segment1) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAuthRoute(pathname)) return NextResponse.next();
  if (isPublicApi(pathname)) return NextResponse.next();

  if (isProtected(pathname)) {
    const session = request.cookies.get("auth_session");
    if (!session?.value) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      const loginUrl = new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
