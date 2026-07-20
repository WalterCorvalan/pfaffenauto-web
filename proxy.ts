import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sesion = request.cookies.get("pfaffen_session");

  // Regla A: Si quiere entrar a /panel y NO tiene la cookie de sesión -> Lo mandamos al login
  if (!sesion && pathname.startsWith('/panel')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Regla B: Si YA tiene sesión (está logueado) e intenta ir a /login -> Lo mandamos directo al panel
  if (sesion && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/panel';
    return NextResponse.redirect(url);
  }

  // Si pasa las reglas, dejamos que la petición continúe con normalidad
  return NextResponse.next();
}

// Configuramos las rutas en las que actúa el proxy
export const config = {
  matcher: [
    /*
     * Ejecuta el proxy en todas las rutas EXCEPTO en:
     * - api (Endopoints internos)
     * - _next/static, _next/image
     * - Archivos estáticos (.png, .jpg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}