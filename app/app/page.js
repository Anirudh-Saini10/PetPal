"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AppPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [sessionPresent, setSessionPresent] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error || !data.session) {
        router.replace("/login");
        return;
      }

      setSessionPresent(true);
      setChecking(false);

      // Fetch pets for the logged-in user
      await fetchPets(data.session.user.id);
    }

    async function fetchPets(userId) {
      setLoadingPets(true);
      const { data, error } = await supabase
        .from("pets")
        .select("name, species")
        .eq("user_id", userId);

      if (!isMounted) return;

      if (error) {
        console.error("Error fetching pets:", error);
        setPets([]);
      } else {
        setPets(data || []);
      }
      setLoadingPets(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;

      if (!currentSession) {
        router.replace("/login");
      } else {
        setSessionPresent(true);
        setChecking(false);
        fetchPets(currentSession.user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checking && !sessionPresent) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm text-gray-600">Checking your session...</p>
      </div>
    );
  }

  async function handleLogout() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">My Pets</h1>
        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-70"
        >
          {signingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      {loadingPets ? (
        <p className="text-sm text-gray-600">Loading pets...</p>
      ) : pets.length === 0 ? (
        <p className="text-sm text-gray-600">No pets yet</p>
      ) : (
        <ul className="space-y-2">
          {pets.map((pet, index) => (
            <li key={index} className="text-sm text-gray-900">
              {pet.name} - {pet.species}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


