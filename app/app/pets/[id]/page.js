"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function PetProfilePage() {
  const router = useRouter();
  const params = useParams();
  const petId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pet, setPet] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPet() {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (!isMounted) return;

      if (sessionError || !sessionData.session) {
        router.replace("/login");
        return;
      }

      const userId = sessionData.session.user.id;

      const { data, error: petError } = await supabase
        .from("pets")
        .select("id, name, species, breed, birth_date, user_id")
        .eq("id", petId)
        .eq("user_id", userId)
        .single();

      if (!isMounted) return;

      if (petError || !data) {
        setError("Pet not found or you do not have access.");
        setLoading(false);
        return;
      }

      setPet(data);
      setLoading(false);
    }

    if (petId) {
      loadPet();
    } else {
      setError("Pet not found.");
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [petId, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm text-gray-600">Loading pet...</p>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm text-red-600">
          {error || "Pet not found or you do not have access."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">{pet.name}</h1>
      <div className="space-y-2 text-sm text-gray-800">
        <p>
          <span className="font-medium">Species:</span> {pet.species}
        </p>
        {pet.breed ? (
          <p>
            <span className="font-medium">Breed:</span> {pet.breed}
          </p>
        ) : null}
        {pet.birth_date ? (
          <p>
            <span className="font-medium">Birth date:</span> {pet.birth_date}
          </p>
        ) : null}
      </div>
    </div>
  );
}


