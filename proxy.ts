import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// panel-v2 es OTRO proyecto Supabase, con su propio login — antes de
// "startsWith('/panel')" hay que sacarlo del camino, si no matchea también
// "/panel-v2" y lo redirige con la sesión/DB de panel-v1 (login equivocado).
function esRutaPanelV2(pathname: string) {
  return pathname === '/panel-v2' || pathname.startsWith('/panel-v2/');
}

async function proxyPanelV1(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

  if (!user && pathname.startsWith('/panel')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/panel';
    return NextResponse.redirect(url);
  }

  return response;
}

async function proxyPanelV2(request: NextRequest) {
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

  if (!user && pathname !== '/panel-v2/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/panel-v2/login';
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/panel-v2/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/panel-v2';
    return NextResponse.redirect(url);
  }

  return response;
}

export async function proxy(request: NextRequest) {
  if (esRutaPanelV2(request.nextUrl.pathname)) {
    return proxyPanelV2(request);
  }
  return proxyPanelV1(request);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}