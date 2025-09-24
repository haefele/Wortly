"use client";

import { useWortlyUser } from "@/contexts/user-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAdminAccess() {
  const { user, isLoading } = useWortlyUser();
  const router = useRouter();

  const isAdmin = user && user?.role === "Admin";

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  return {
    user,
    isLoading,
    isAdmin: isAdmin,
    hasAccess: !isLoading && isAdmin,
  };
}
