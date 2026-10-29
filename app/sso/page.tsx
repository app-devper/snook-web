"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { continueFromUm } from "@/lib/sign-in";

function launchFailure(error: unknown): string {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 401) return "This link from UM has expired or was already used. Open Snook from UM again, or sign in.";
  if (status === 429) return "Too many attempts. Wait a moment and try again.";
  return "Your account cannot open Snook from UM. Please sign in.";
}

/** Signs in with the one-time ticket UM put in the address (um-api ADR-0011). */
export default function SsoPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const ticket = new URLSearchParams(window.location.search).get("ticket");
    window.history.replaceState(null, "", "/sso");
    if (!ticket) {
      router.replace("/login");
      return;
    }
    continueFromUm(ticket)
      .then(() => router.replace("/dashboard"))
      .catch((e: unknown) => setError(launchFailure(e)));
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-900 to-green-950 p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Snooker Manager</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p role={error ? "alert" : "status"} className="text-sm text-muted-foreground">
            {error || "Opening Snook from UM…"}
          </p>
          {error && (
            <Button asChild>
              <Link href="/login" replace>Go to sign in</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
