import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Creamos una respuesta base que Next.js modificará si hay que actualizar cookies
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 2. Iniciamos el cliente de Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Actualizamos la petición (request) y la respuesta (response) al mismo tiempo
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Verificamos el usuario de forma 100% segura contra el servidor
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // --- REGLAS DEL PATOVICA ---

  // Regla A: Si no hay usuario activo y quiere entrar a cualquier lado de /panel -> Lo pateamos al login
  if (!user && request.nextUrl.pathname.startsWith('/panel')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Regla B: Si YA está logueado e intenta ir a /login -> Lo mandamos directo al panel
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/panel'
    return NextResponse.redirect(url)
  }

  // Si pasa las reglas, lo dejamos seguir su camino
  return supabaseResponse
}

// 4. Configuramos en qué rutas debe ejecutarse este middleware
export const config = {
  matcher: [
    /*
     * Ejecuta el middleware en todas las rutas EXCEPTO en:
     * - api (Tus endpoints, como el de subir fotos)
     * - _next/static o _next/image (Archivos internos de Next.js)
     * - Archivos estáticos como imágenes (.png, .jpg), logos o el favicon
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}