import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /console routes (except login and auth callback)
  const isConsoleRoute = pathname.startsWith("/console");
  const isLoginPage = pathname === "/console/login";
  const isAuthCallback = pathname.startsWith("/api/console/auth/callback");
  const isAuthRoute = pathname.startsWith("/api/console/auth/");
  const isWebhook = pathname.startsWith("/api/console/webhooks");

  if (!isConsoleRoute && !pathname.startsWith("/api/console")) {
    return NextResponse.next();
  }

  // Don't protect webhooks or auth routes (callback, verify-email, invite)
  if (isWebhook || isAuthRoute) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user and trying to access protected console route, redirect to login
  if (!user && isConsoleRoute && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/console/login";
    return NextResponse.redirect(url);
  }

  // If user is authenticated, verify they have a profile (invited users only)
  if (user && isConsoleRoute && !isLoginPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      // User authenticated but was never invited — sign them out and redirect
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/console/login";
      return NextResponse.redirect(url);
    }
  }

  // If user is logged in and on login page, redirect to dashboard
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/console/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/console/:path*", "/api/console/:path*"],
};
