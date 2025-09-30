import { DatabaseReader, mutation, query } from "./_generated/server";
import { Auth } from "convex/server";

export const store = mutation({
  args: {},
  handler: async ctx => {
    const identity = await throwIfUnauthenticated(ctx);

    let user = await ctx.db
      .query("users")
      .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (user !== null) {
      if (user.email !== identity.email || user.name !== identity.name) {
        await ctx.db.patch(user._id, { email: identity.email, name: identity.name });
      }

      return user._id;
    } else {
      return await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        email: identity.email,
        name: identity.name,
        role: "User",
      });
    }
  },
});

export const getMe = query({
  args: {},
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    return user;
  },
});

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
