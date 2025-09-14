"use client";

import { useWortlyUser } from "@/hooks/use-wortly-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAdminAccess() {
  const { user, isLoading } = useWortlyUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== "Admin") {
      router.push("/");
    }
  }, [user, isLoading, router]);

  return {
    user,
    isLoading,
    isAdmin: user?.role === "Admin",
  };
}
