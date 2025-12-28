import { supabase } from "./supabaseClient";

/**
 * Evaluates and updates the Pet Twin state for a given pet
 * @param {string} petId - The pet's ID
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} The updated pet state
 */
export async function evaluatePetState(petId, userId) {
  // Fetch recent health events
  const { data: healthEvents, error: eventsError } = await supabase
    .from("health_events")
    .select("type, event_date")
    .eq("pet_id", petId)
    .eq("user_id", userId)
    .order("event_date", { ascending: false });

  if (eventsError) {
    throw new Error(`Failed to fetch health events: ${eventsError.message}`);
  }

  // Fetch reminders
  const { data: reminders, error: remindersError } = await supabase
    .from("reminders")
    .select("completed, remind_at")
    .eq("pet_id", petId)
    .eq("user_id", userId);

  if (remindersError) {
    throw new Error(`Failed to fetch reminders: ${remindersError.message}`);
  }

  // Calculate health score
  let healthScore = 70;
  const now = new Date();
  const factors = {
    recentCheckup: false,
    recentVaccination: false,
    recentIllness: false,
    overdueCount: 0,
    completedCount: 0,
  };

  // Process health events
  if (healthEvents && healthEvents.length > 0) {
    for (const event of healthEvents) {
      const eventDate = new Date(event.event_date);
      const daysDiff = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));

      const typeLower = event.type?.toLowerCase() || "";

      if (typeLower.includes("checkup") && daysDiff <= 30) {
        healthScore += 10;
        factors.recentCheckup = true;
      } else if (typeLower.includes("vaccination") && daysDiff <= 90) {
        healthScore += 5;
        factors.recentVaccination = true;
      } else if (typeLower.includes("illness") && daysDiff <= 30) {
        healthScore -= 20;
        factors.recentIllness = true;
      }
    }
  }

  // Process reminders
  if (reminders && reminders.length > 0) {
    for (const reminder of reminders) {
      if (reminder.completed) {
        healthScore += 5;
        factors.completedCount++;
      } else {
        const remindDate = new Date(reminder.remind_at);
        if (remindDate < now) {
          healthScore -= 10;
          factors.overdueCount++;
        }
      }
    }
  }

  // Clamp health score between 0-100
  healthScore = Math.max(0, Math.min(100, healthScore));

  // Derive mood
  let mood;
  if (healthScore >= 80) {
    mood = "Happy";
  } else if (healthScore >= 60) {
    mood = "Stable";
  } else if (healthScore >= 40) {
    mood = "Concerned";
  } else {
    mood = "Critical";
  }

  // Generate reason (dominant factor)
  let reason;
  if (factors.recentIllness) {
    reason = "Recent illness detected";
  } else if (factors.overdueCount > 0) {
    reason = `${factors.overdueCount} overdue reminder${factors.overdueCount > 1 ? "s" : ""}`;
  } else if (factors.recentCheckup) {
    reason = "Recent checkup completed";
  } else if (factors.recentVaccination) {
    reason = "Recent vaccination recorded";
  } else if (factors.completedCount > 0) {
    reason = `${factors.completedCount} reminder${factors.completedCount > 1 ? "s" : ""} completed`;
  } else {
    reason = "Baseline health status";
  }

  // Upsert pet_state
  const { data, error: upsertError } = await supabase
    .from("pet_state")
    .upsert(
      {
        pet_id: petId,
        user_id: userId,
        mood: mood,
        health_score: healthScore,
        reason: reason,
        last_evaluated: new Date().toISOString(),
      },
      {
        onConflict: "pet_id,user_id",
      }
    )
    .select()
    .single();

  if (upsertError) {
    throw new Error(`Failed to update pet state: ${upsertError.message}`);
  }

  return data;
}

