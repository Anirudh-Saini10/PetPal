"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AppPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [sessionPresent, setSessionPresent] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            App placeholder
          </h1>
          <p className="text-sm text-gray-600">
            You are logged in. This is a protected route at <code>/app</code>{" "}
            that only authenticated users can access.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-70"
        >
          {signingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
}


