import { DatabaseReader, internalMutation, mutation, query } from "./_generated/server";
import { Auth } from "convex/server";
import { v } from "convex/values";
import { addDays, getStartOfDay, subtractDays } from "./lib/dates";

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

export const getUserStreak = query({
  args: {},
  handler: async ctx => {
    const user = await getCurrentUser(ctx);

    const streak = user.streak;

    // If no streak data, return 0
    if (!streak || streak.count === 0) {
      return { streakDays: 0, needsPracticeToday: null };
    }

    const today = getStartOfDay(Date.now());
    const yesterday = subtractDays(today, 1);

    // User practiced today - streak is active and satisfied for today
    if (streak.date === today) {
      return { streakDays: streak.count, needsPracticeToday: false };
    }

    // User practiced yesterday - streak is still active but needs practice today
    if (streak.date === yesterday) {
      return { streakDays: streak.count, needsPracticeToday: true };
    }

    // User practiced before yesterday - streak is broken
    return { streakDays: 0, needsPracticeToday: null };
  },
});

export const updateStreak = internalMutation({
  args: {
    userId: v.id("users"),
    completedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const completedDayStart = getStartOfDay(args.completedAt);
    const streak = user.streak;

    // If this is the same day as the last practice, don't update
    if (user.streak?.date === completedDayStart) {
      return;
    }

    // Determine the new streak count
    let newCount: number;

    if (!streak) {
      // First practice session ever
      newCount = 1;
    } else {
      const dayAfterLastPractice = addDays(streak.date, 1);

      if (completedDayStart === dayAfterLastPractice) {
        // Consecutive day - increment streak
        newCount = streak.count + 1;
      } else {
        // Gap in practice - start new streak
        newCount = 1;
      }
    }

    await ctx.db.patch(user._id, {
      streak: {
        count: newCount,
        date: completedDayStart,
      },
    });
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
