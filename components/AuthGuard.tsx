"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, setToken, removeToken, setUserRole } from "@/lib/auth";
import axios from "axios";
import { replacedByAnotherSignIn, sentTokenOf } from "@/lib/session-end";
import { keepAlive, umFailureOf, getUserInfo } from "@/lib/um-api";

/** How often a signed-in page re-checks its token with UM. */
export const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    // Resolves false when UM refused the token (session ended), true otherwise.
    const check = async (): Promise<boolean> => {
      let res: Awaited<ReturnType<typeof keepAlive>>;
      try {
        res = await keepAlive();
      } catch (error: unknown) {
        // Only the keep-alive call itself is classified: an error anywhere
        // else below must not be mistaken for "UM is unreachable".
        if (umFailureOf(error) === "unreachable") {
          setChecked(true);
          return true;
        }
        const sent = sentTokenOf(axios.isAxiosError(error) ? error.config : undefined);
        if (replacedByAnotherSignIn(sent, getToken())) {
          // Another tab signed in again; its session is not ours to end.
          setChecked(true);
          return true;
        }
        removeToken();
        router.replace("/login");
        return false;
      }
      setToken(res.accessToken);
      try {
        const user = await getUserInfo();
        setUserRole(user.role);
      } catch { /* ignore */ }
      setChecked(true);
      return true;
    };

    let intervalId: ReturnType<typeof setInterval> | undefined;
    let unmounted = false;
    void check().then((signedIn) => {
      if (!signedIn || unmounted) return;
      intervalId = setInterval(() => void check(), KEEP_ALIVE_INTERVAL_MS);
    });
    return () => {
      unmounted = true;
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, [router]);

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
