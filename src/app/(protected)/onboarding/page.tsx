"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProgressStepper } from "@/components/onboarding/progress-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useCurrentUser();

  useEffect(() => {
    if (loading || !data) return;

    if (data.user.onboardingCompleted) {
      router.replace("/dashboard");
      return;
    }

    const step = data.onboarding?.currentStep ?? "plan";
    if (step === "plan") {
      router.replace("/onboarding/plan");
    } else if (step === "quiz") {
      router.replace("/onboarding/quiz");
    } else if (step === "schedule") {
      router.replace("/onboarding/schedule");
    } else if (step === "completed") {
      router.replace("/onboarding/complete");
    }
  }, [data, loading, router]);

  if (error || (!loading && !data)) {
    return (
      <div className="flex flex-col items-center gap-8 pt-12">
        <ProgressStepper currentStep="quiz" />
        <Card className="w-full max-w-lg border-border/80 bg-card shadow-sm">
          <CardHeader className="items-center text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl text-athena-navy dark:text-foreground">
              We couldn&apos;t load your setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-center">
            <p className="text-sm leading-6 text-muted-foreground">
              Athena could not connect to your profile. Try again to continue
              onboarding from where you left off.
            </p>
            <Button onClick={() => void refetch()} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const destinationLabel = data?.user.onboardingCompleted
    ? "Opening your dashboard..."
    : "Preparing your onboarding...";

  return (
    <div
      className="flex flex-col items-center gap-8 pt-12"
      role="status"
      aria-live="polite"
    >
      <ProgressStepper currentStep="quiz" />
      <div className="flex items-center gap-3 rounded-md border border-border/80 bg-card px-5 py-3 text-sm text-muted-foreground shadow-sm">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span>{loading ? "Setting things up..." : destinationLabel}</span>
      </div>
    </div>
  );
}
