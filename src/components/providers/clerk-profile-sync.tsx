"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";

const PROFILE_QUERY_KEYS = [
  "user",
  "profile",
  "dashboard",
  "progress",
  "review",
  "mentor-progress-context",
];

export function ClerkProfileSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const queryClient = useQueryClient();
  const lastSyncedProfile = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const profileSignature = JSON.stringify({
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      email: user.primaryEmailAddress?.emailAddress,
    });

    if (lastSyncedProfile.current === profileSignature) return;
    lastSyncedProfile.current = profileSignature;

    const controller = new AbortController();

    async function syncProfile() {
      try {
        const response = await fetch("/api/user/sync", {
          method: "POST",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Profile sync failed with status ${response.status}`);
        }

        const result = (await response.json()) as { changed?: boolean };
        if (!result.changed) return;

        await Promise.all(
          PROFILE_QUERY_KEYS.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey: [queryKey] })
          )
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Unable to sync Clerk profile with Athena", error);
        lastSyncedProfile.current = null;
      }
    }

    void syncProfile();

    return () => controller.abort();
  }, [
    isLoaded,
    isSignedIn,
    queryClient,
    user,
    user?.firstName,
    user?.imageUrl,
    user?.lastName,
    user?.primaryEmailAddress?.emailAddress,
  ]);

  return null;
}
