import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function esRutaPanel(pathname: string) {
  return pathname === '/panel' || pathname.startsWith('/panel/');
}

async function proxyPanel(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  // Sin env vars todavía (proyecto Supabase nuevo no creado) — dejamos pasar
  // sin chequear sesión en vez de romper con una excepción en cada request.
  if (!process.env.NEXT_PUBLIC_SUPABASE2_URL || !process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE2_URL!,
    process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && pathname !== '/panel/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/panel/login';
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/panel/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/panel';
    return NextResponse.redirect(url);
  }

  return response;
}

export async function proxy(request: NextRequest) {
  if (esRutaPanel(request.nextUrl.pathname)) {
    return proxyPanel(request);
  }
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
