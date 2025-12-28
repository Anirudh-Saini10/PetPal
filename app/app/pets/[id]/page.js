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
  const [reminders, setReminders] = useState([]);
  const [updatingReminder, setUpdatingReminder] = useState(null);

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
      // Fetch reminders for this pet
      await loadReminders(petId, userId);
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

    async function loadReminders(petId, userId) {
      const { data, error: remindersError } = await supabase
        .from("reminders")
        .select("id, title, remind_at, completed")
        .eq("pet_id", petId)
        .eq("user_id", userId);

      if (!isMounted) return;

      if (remindersError) {
        console.error("Error fetching reminders:", remindersError);
        setReminders([]);
      } else {
        setReminders(data || []);
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

  // Classify reminders
  const now = new Date();
  const upcoming = reminders.filter(
    (r) => !r.completed && new Date(r.remind_at) >= now
  );
  const overdue = reminders.filter(
    (r) => !r.completed && new Date(r.remind_at) < now
  );
  const completed = reminders.filter((r) => r.completed);

  async function markReminderAsDone(reminderId) {
    setUpdatingReminder(reminderId);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      router.replace("/login");
      return;
    }

    const userId = sessionData.session.user.id;

    const { error } = await supabase
      .from("reminders")
      .update({ completed: true })
      .eq("id", reminderId)
      .eq("pet_id", petId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating reminder:", error);
    } else {
      // Refresh reminders
      const { data, error: remindersError } = await supabase
        .from("reminders")
        .select("id, title, remind_at, completed")
        .eq("pet_id", petId)
        .eq("user_id", userId);

      if (!remindersError) {
        setReminders(data || []);
      }
    }

    setUpdatingReminder(null);
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
        <button
          type="button"
          onClick={() => router.push(`/app/pets/${pet.id}/add-event`)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Add Health Event
        </button>
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

      <div className="mt-6 space-y-2 text-sm text-gray-800">
        <h2 className="text-lg font-semibold text-gray-900">Reminders</h2>
        {reminders.length === 0 ? (
          <p className="text-gray-600">No reminders yet</p>
        ) : (
          <div className="space-y-4">
            {upcoming.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900">Upcoming</h3>
                <ul className="mt-2 space-y-2">
                  {upcoming.map((reminder, index) => (
                    <li key={index} className="flex items-start justify-between">
                      <div>
                        <p>
                          <span className="font-medium">{reminder.title}</span>
                        </p>
                        <p className="text-gray-600">
                          Due: {reminder.remind_at}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => markReminderAsDone(reminder.id)}
                        disabled={updatingReminder === reminder.id}
                        className="ml-4 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {updatingReminder === reminder.id ? "Updating..." : "Mark as done"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {overdue.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900">Overdue</h3>
                <ul className="mt-2 space-y-2">
                  {overdue.map((reminder, index) => (
                    <li key={index} className="flex items-start justify-between">
                      <div>
                        <p>
                          <span className="font-medium">{reminder.title}</span>
                        </p>
                        <p className="text-gray-600">
                          Due: {reminder.remind_at}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => markReminderAsDone(reminder.id)}
                        disabled={updatingReminder === reminder.id}
                        className="ml-4 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {updatingReminder === reminder.id ? "Updating..." : "Mark as done"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900">Completed</h3>
                <ul className="mt-2 space-y-2">
                  {completed.map((reminder, index) => (
                    <li key={index}>
                      <p>
                        <span className="font-medium">{reminder.title}</span>
                      </p>
                      <p className="text-gray-600">
                        Due: {reminder.remind_at}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


