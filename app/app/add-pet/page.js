"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AddPetPage() {
  const router = useRouter();
  const [sessionUserId, setSessionUserId] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [breed, setBreed] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error || !data.session) {
        router.replace("/login");
        return;
      }

      setSessionUserId(data.session.user.id);
      setCheckingSession(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;

      if (!currentSession) {
        router.replace("/login");
      } else {
        setSessionUserId(currentSession.user.id);
        setCheckingSession(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!sessionUserId) {
      setError("Not authenticated.");
      return;
    }

    setSubmitting(true);

    const { error: insertError } = await supabase.from("pets").insert({
      name,
      species,
      breed: breed || null,
      birth_date: birthDate || null,
      user_id: sessionUserId,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.replace("/app");
  }

  if (checkingSession) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <p className="text-sm text-gray-600">Checking session...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Add a Pet</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        <div>
          <label
            htmlFor="species"
            className="block text-sm font-medium text-gray-700"
          >
            Species
          </label>
          <select
            id="species"
            required
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          >
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="breed"
            className="block text-sm font-medium text-gray-700"
          >
            Breed (optional)
          </label>
          <input
            id="breed"
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        <div>
          <label
            htmlFor="birth_date"
            className="block text-sm font-medium text-gray-700"
          >
            Birth date (optional)
          </label>
          <input
            id="birth_date"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
        >
          {submitting ? "Adding..." : "Add pet"}
        </button>
      </form>
    </div>
  );
}


