import { Auth } from "convex/server";
import { DatabaseReader } from "../_generated/server";

export async function throwIfUnauthenticated(ctx: { auth: Auth }) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Not authenticated");
  }
  return identity;
}

export async function getCurrentUser(ctx: { auth: Auth; db: DatabaseReader }) {
  const identity = await throwIfUnauthenticated(ctx);

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (user === null) {
    throw new Error("User not found");
  }

  return user;
}
