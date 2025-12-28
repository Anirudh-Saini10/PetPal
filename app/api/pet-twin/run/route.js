import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  // Get authorization header
  const authHeader = req.headers.get("authorization");
  
  let supabase;
  let user;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    // Use token from Authorization header
    const token = authHeader.replace("Bearer ", "");
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data: { user: authUser }, error } = await client.auth.getUser(token);
    
    if (error || !authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    user = authUser;
    supabase = client;
  } else {
    // Fallback to cookies
    const cookieStore = await cookies();
    supabase = createServerClient(
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
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    user = authUser;
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
