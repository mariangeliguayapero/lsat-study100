"use client";

import { useClerk } from "@clerk/nextjs";
import { Pencil } from "lucide-react";

export function ProfileNameEditor({
  displayName,
}: {
  displayName: string | null;
}) {
  const { openUserProfile } = useClerk();

  return (
    <div className="flex items-center gap-2">
      <p className="text-base font-semibold">{displayName ?? "LSAT Prep"}</p>
      <button
        type="button"
        onClick={() => openUserProfile()}
        aria-label="Edit profile name and photo"
        title="Edit profile name and photo"
        className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
