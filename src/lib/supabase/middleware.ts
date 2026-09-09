import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Thin Proxy Model: Next.js 16 expects proxy.ts to be lightweight.
  // We only do optimistic cookie checks here using getSession() (which decodes locally).
  // The authoritative verification happens via getUser() in the layout.tsx files.
  const { data: { session } } = await supabase.auth.getSession();

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/signup') ||
                      request.nextUrl.pathname.startsWith('/reset-password');
                      
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                           request.nextUrl.pathname.startsWith('/onboarding') ||
                           request.nextUrl.pathname.startsWith('/checkin') ||
                           request.nextUrl.pathname.startsWith('/admin') ||
                           request.nextUrl.pathname.startsWith('/session') ||
                           request.nextUrl.pathname.startsWith('/plan') ||
                           request.nextUrl.pathname.startsWith('/progress') ||
                           request.nextUrl.pathname.startsWith('/settings') ||
                           request.nextUrl.pathname.startsWith('/chat') ||
                           request.nextUrl.pathname.startsWith('/parent');

  const isUpdatePasswordRoute = request.nextUrl.pathname.startsWith('/update-password');

  if (session) {
    // Verified via live test: JWT AMR for recovery and signup are identical (both 'otp').
    // We now rely on a secure cookie 'requires_password_reset' set by the PKCE callback.
    const isRecoverySession = request.cookies.get('requires_password_reset')?.value === 'true';

    // 1. Recovery Session Lock
    if (isRecoverySession && !isUpdatePasswordRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/update-password';
      return NextResponse.redirect(url);
    }

    // 2. Auth Routes Redirect
    if (isAuthRoute && !isRecoverySession) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  } else {
    // 3. Unauthenticated Guard
    if (isProtectedRoute || isUpdatePasswordRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
