import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/api/admin/:path*",
    "/api/orders/:path*",
  ],
};

const PUBLIC_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@bastaha.com";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-me",
  });

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/api/orders") ||
    isAdminRoute;

  if (!token && isProtectedRoute) {
    const url = new URL("/auth/login", request.url);
    const callback = request.nextUrl.pathname + request.nextUrl.search;
    url.searchParams.set("callbackUrl", callback);
    const lang = request.nextUrl.searchParams.get("lang");
    if (lang) url.searchParams.set("lang", lang);
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && token) {
    const email = (token.email as string | undefined)?.toLowerCase();
    const role = token.role as string | undefined;
    const isAdmin = role === "admin" || email === PUBLIC_ADMIN_EMAIL.toLowerCase();
    if (!isAdmin) {
      const url = new URL("/auth/login", request.url);
      const lang = request.nextUrl.searchParams.get("lang");
      if (lang) url.searchParams.set("lang", lang);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}
