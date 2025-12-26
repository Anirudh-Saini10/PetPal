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
  const [healthEvents, setHealthEvents] = useState([]);

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

      // Fetch health events for this pet
      await loadHealthEvents(petId, userId);
    }

    async function loadHealthEvents(petId, userId) {
      const { data, error: eventsError } = await supabase
        .from("health_events")
        .select("type, description, event_date")
        .eq("pet_id", petId)
        .eq("user_id", userId)
        .order("event_date", { ascending: false });

      if (!isMounted) return;

      if (eventsError) {
        console.error("Error fetching health events:", eventsError);
        setHealthEvents([]);
      } else {
        setHealthEvents(data || []);
      }
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

  function calculateAge(birthDate) {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return years - 1;
    }
    return years;
  }

  const age = calculateAge(pet.birth_date);

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

      <div className="mt-6 space-y-2 text-sm text-gray-800">
        <h2 className="text-lg font-semibold text-gray-900">Pet Twin</h2>
        <p>
          <span className="font-medium">Age:</span>{" "}
          {age !== null ? `${age} years` : "Unknown age"}
        </p>
        <p>
          <span className="font-medium">Mood:</span> Happy
        </p>
      </div>

      <div className="mt-6 space-y-2 text-sm text-gray-800">
        <h2 className="text-lg font-semibold text-gray-900">Health Timeline</h2>
        {healthEvents.length === 0 ? (
          <p className="text-gray-600">No health events yet</p>
        ) : (
          <ul className="space-y-3">
            {healthEvents.map((event, index) => (
              <li key={index} className="border-b border-gray-200 pb-2">
                <p>
                  <span className="font-medium">Type:</span> {event.type}
                </p>
                {event.description ? (
                  <p>
                    <span className="font-medium">Description:</span> {event.description}
                  </p>
                ) : null}
                <p>
                  <span className="font-medium">Event date:</span> {event.event_date}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


