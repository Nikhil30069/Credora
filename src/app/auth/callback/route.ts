import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isBlockedDomain } from "@/lib/blocked-domains";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * PKCE OAuth callback: session cookies MUST be set on the redirect Response.
 * Using only `cookies()` from `next/headers` here often fails to attach Set-Cookie
 * to the redirect, which looks like an infinite load after Google consent.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next") ?? "/dashboard";
  const errorParam = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (errorParam) {
    const login = new URL("/login", origin);
    login.searchParams.set("error", errorParam);
    return NextResponse.redirect(login);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.redirect(new URL("/login?error=server_config", origin));
  }

  const successDest = new URL(nextPath, origin);
  const response = NextResponse.redirect(successDest);

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeErr) {
    const login = new URL("/login", origin);
    login.searchParams.set("error", exchangeErr.message);
    return NextResponse.redirect(login);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    await supabase.auth.signOut();
    response.headers.set("Location", new URL("/login?error=no_email", origin).toString());
    return response;
  }

  if (isBlockedDomain(user.email)) {
    await supabase.auth.signOut();
    response.headers.set("Location", new URL("/login?error=blocked_domain", origin).toString());
    return response;
  }

  return response;
}
