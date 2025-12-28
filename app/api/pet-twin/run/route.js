import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { pet_id } = await req.json();

  // Ownership check
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

  // Temporary Pet Twin result (we persist next)
  return NextResponse.json({
    mood: "Stable",
    health_score: 70,
    reason: "Baseline health state",
  });
}
