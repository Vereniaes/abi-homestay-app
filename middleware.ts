import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// helper --------------------------------------------------------------------------
// function middleware untuk verifikasi sesi pengguna dan proteksi rute aplikasi
// input param : request (NextRequest)
// output : NextResponse (redirect atau next)
// end of helper ------------------------------------------------------------------
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("abi_session")?.value;
  let isAuthenticated = false;
  let userRole = "";

  if (sessionCookie) {
    try {
      const parsed = JSON.parse(sessionCookie);
      if (parsed && parsed.id) {
        isAuthenticated = true;
        userRole = parsed.role || "";
      }
    } catch {
      isAuthenticated = false;
    }
  }

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";

  if (!isAuthenticated && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isLoginPage) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // helper --------------------------------------------------------------------------
  // proteksi rute khusus role ADMIN: /laporan, /pengaturan, /users
  // non-admin yang mengakses rute ini akan dialihkan ke beranda
  // end of helper ------------------------------------------------------------------
  if (isAuthenticated && userRole !== "ADMIN") {
    const isAdminRoute =
      pathname.startsWith("/laporan") ||
      pathname.startsWith("/pengaturan") ||
      pathname.startsWith("/users");

    if (isAdminRoute) {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, icons)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
