"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, setToken, removeToken, setUserRole } from "@/lib/auth";
import { keepAlive, getUserInfo } from "@/lib/um-api";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    keepAlive()
      .then(async (res) => {
        setToken(res.accessToken);
        try {
          const user = await getUserInfo();
          setUserRole(user.role);
        } catch { /* ignore */ }
        setChecked(true);
      })
      .catch(() => {
        removeToken();
        router.replace("/login");
      });
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
