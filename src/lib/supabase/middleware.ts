import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isBlockedDomain } from "@/lib/blocked-domains";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && pathname.startsWith("/dashboard")) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/login";
    dest.searchParams.set("next", pathname);
    return NextResponse.redirect(dest);
  }

  if (!user && pathname.startsWith("/complete-profile")) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/login";
    dest.searchParams.set("next", "/complete-profile");
    return NextResponse.redirect(dest);
  }

  if (user && user.email && isBlockedDomain(user.email)) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/complete-profile")) {
      await supabase.auth.signOut();
      const dest = request.nextUrl.clone();
      dest.pathname = "/login";
      dest.searchParams.set("error", "blocked_domain");
      return NextResponse.redirect(dest);
    }
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/dashboard";
    return NextResponse.redirect(dest);
  }

  return supabaseResponse;
}
