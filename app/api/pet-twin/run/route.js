import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { pet_id } = await req.json();

  const { data: pet } = await supabase
    .from("pets")
    .select("id")
    .eq("id", pet_id)
    .eq("user_id", user.id)
    .single();

  if (!pet) {
    return NextResponse.json(
      { error: "Pet not found or access denied" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    mood: "Stable",
    health_score: 70,
    reason: "Baseline health state",
  });
}
