"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";

export function useWortlyUser() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const { user } = useUser();
    
    // When this state is set we know the server has stored the user.
    const [userId, setUserId] = useState<Id<"users"> | null>(null);
    const storeUser = useMutation(api.functions.users.store);
    const me = useQuery(api.functions.users.getMe);

    useEffect(() => {

        if (!isAuthenticated)
            return;

        async function createUser() {
            const userId = await storeUser();
            setUserId(userId);
        }
        createUser();
        
        return () => setUserId(null);
    }, [isAuthenticated, storeUser, user?.id]);

    return {
        isLoading: isLoading || (isAuthenticated && userId === null) || (isAuthenticated && me === undefined),
        isAuthenticated: isAuthenticated,
        user: me,
    }
}