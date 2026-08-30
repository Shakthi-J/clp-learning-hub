import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        // @ts-ignore
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }: any) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: any) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  const getRole = async () => {
    if (!user) return null;
    const { data } = await supabase.from("patients").select("role").eq("auth_user_id", user.id).maybeSingle();
    return data?.role ?? null;
  };

  if (pathname.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    const role = await getRole();
    if (role !== "admin") {
      return NextResponse.redirect(new URL(role === "instructor" ? "/instructor" : "/my-learning", request.url));
    }
  }

  if (pathname.startsWith("/instructor")) {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    const role = await getRole();
    // Admins can view instructor screens; patients cannot.
    if (role !== "instructor" && role !== "admin") {
      return NextResponse.redirect(new URL("/my-learning", request.url));
    }
  }

  const patientRoutes = ["/my-learning", "/learn", "/certificates", "/profile"];
  if (patientRoutes.some((r) => pathname.startsWith(r))) {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname === "/login" || pathname === "/signup") && user) {
    const role = await getRole();
    if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
    if (role === "instructor") return NextResponse.redirect(new URL("/instructor", request.url));
    return NextResponse.redirect(new URL("/my-learning", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
