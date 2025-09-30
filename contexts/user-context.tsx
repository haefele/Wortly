"use client";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface UserContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: Doc<"users"> | undefined;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();
  const { user: clerkUser } = useUser();

  // When this state is set we know the server has stored the user.
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const storeUser = useMutation(api.users.store);
  const meResult = useQuery(api.users.getMe);

  useEffect(() => {
    if (!isAuthenticated) {
      setUserId(null);
      return;
    }

    async function createUser() {
      const userId = await storeUser();
      setUserId(userId);
    }
    createUser();
  }, [isAuthenticated, storeUser, clerkUser?.id]);

  const contextValue: UserContextType = {
    isLoading:
      convexLoading ||
      (isAuthenticated && userId === null) ||
      (isAuthenticated && meResult.data === undefined),
    isAuthenticated: isAuthenticated,
    user: meResult.data || undefined,
  };

  return <UserContext value={contextValue}>{children}</UserContext>;
}

export function useWortlyUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useWortlyUser must be used within a UserProvider");
  }
  return context;
}
