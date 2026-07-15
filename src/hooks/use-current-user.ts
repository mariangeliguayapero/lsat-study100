"use client";

import { useQuery } from "@tanstack/react-query";

type UserData = {
  user: {
    id: string;
    clerkId: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    skillScore: number | null;
    onboardingCompleted: boolean;
  };
  onboarding: {
    currentStep: "plan" | "quiz" | "schedule" | "completed";
    quizQuestionIndex: number;
    lessonPreference: "view_now" | "queue_for_later" | null;
  } | null;
};

async function responseError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) {
      return new Error(body.error);
    }
  } catch {
    // The fallback below also covers non-JSON error responses.
  }

  return new Error(fallback);
}

async function fetchUser(): Promise<UserData> {
  const res = await fetch("/api/user/me", { cache: "no-store" });
  if (res.status === 404) {
    const syncRes = await fetch("/api/user/sync", { method: "POST" });
    if (!syncRes.ok) {
      throw await responseError(syncRes, "Failed to create your Athena profile");
    }

    const syncData = (await syncRes.json()) as { user?: unknown };
    if (!syncData.user) {
      throw new Error("Failed to create your Athena profile");
    }

    const retryRes = await fetch("/api/user/me", { cache: "no-store" });
    if (!retryRes.ok) {
      throw await responseError(retryRes, "Failed to load your Athena profile");
    }
    return retryRes.json();
  }
  if (!res.ok) {
    throw await responseError(res, "Failed to load your Athena profile");
  }
  return res.json();
}

export function useCurrentUser() {
  const { data, isLoading, error, refetch } = useQuery<UserData>({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
