import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { evaluatePetState } from "@/lib/petStateEngine";

export async function POST(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized. Missing or invalid authorization header." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid token." },
        { status: 401 }
      );
    }

    // Get pet_id from request body
    const body = await request.json();
    const { pet_id } = body;

    if (!pet_id) {
      return NextResponse.json(
        { error: "Bad request. pet_id is required." },
        { status: 400 }
      );
    }

    // Verify the pet belongs to the user
    const { data: pet, error: petError } = await supabase
      .from("pets")
      .select("id, user_id")
      .eq("id", pet_id)
      .eq("user_id", user.id)
      .single();

    if (petError || !pet) {
      return NextResponse.json(
        { error: "Pet not found or access denied." },
        { status: 404 }
      );
    }

    // Run the Pet Twin state engine
    const petState = await evaluatePetState(pet_id, user.id);

    return NextResponse.json(petState, { status: 200 });
  } catch (error) {
    console.error("Error running Pet Twin state engine:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

