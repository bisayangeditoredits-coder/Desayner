import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis, ratelimit;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(30, '10 s'),
    analytics: true,
  });
}

/**
 * Next.js Middleware — runs on every request before page renders.
 *
 * Responsibilities:
 * 1. Refreshes the Supabase session token (keeps users logged in).
 * 2. Protects /settings and /messages — redirects unauthenticated users to /login.
 * 3. Redirects authenticated users away from /login and /signup.
 */
export async function proxy(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do NOT remove this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Rate Limiting (API Routes) ───────────────────────────────
  if (pathname.startsWith('/api') && ratelimit) {
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again in a few seconds.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            }
          }
        );
      }
    } catch (err) {
      console.error('Rate limit error:', err);
    }
  }

  // ── Protected Routes ─────────────────────────────────────────
  // If user is NOT logged in and tries to access protected routes,
  // redirect them to /login.
  const isProtected = pathname.startsWith('/settings') || pathname.startsWith('/messages');
  if (isProtected && !user) {
    const returnTo = pathname + request.nextUrl.search;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('redirectTo', returnTo);
    return NextResponse.redirect(loginUrl);
  }

  // ── Auth Routes ───────────────────────────────────────────────
  // If user IS logged in and tries to visit /login or /signup,
  // redirect them straight to the dashboard.
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  if (isAuthRoute && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/';
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run middleware on all routes EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public assets (png, svg, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export default proxy;
