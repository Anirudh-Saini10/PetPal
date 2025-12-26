"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AddHealthEventPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params?.id;

  const [sessionUserId, setSessionUserId] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
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

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!sessionUserId || !petId) {
      setError("Not authorized.");
      return;
    }

    setSubmitting(true);

    const { error: insertError } = await supabase.from("health_events").insert({
      pet_id: petId,
      user_id: sessionUserId,
      type,
      description: description || null,
      event_date: eventDate,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.replace(`/app/pets/${petId}`);
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
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Add Health Event
      </h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700"
          >
            Type
          </label>
          <input
            id="type"
            type="text"
            required
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            rows={3}
          />
        </div>

        <div>
          <label
            htmlFor="event_date"
            className="block text-sm font-medium text-gray-700"
          >
            Event date
          </label>
          <input
            id="event_date"
            type="date"
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
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
          {submitting ? "Saving..." : "Add event"}
        </button>
      </form>
    </div>
  );
}


