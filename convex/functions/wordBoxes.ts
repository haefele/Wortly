import { query } from "@/_generated/server";
import { getCurrentUser } from "@/lib/authHelpers";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

export const getMyWordBoxes = query({
    args: {},
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);

        const boxes = await ctx.db
            .query("wordBoxes")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();

        return boxes;
    },
});

export const getWords = query({
    args: { 
        boxId: v.id("wordBoxes"),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const box = await ctx.db.get(args.boxId);
        if (!box || box.userId !== user._id) {
            throw new Error("Word box not found");
        }

        const assignmentResults = await ctx.db
            .query("wordBoxAssignments")
            .withIndex("by_boxId", (q) => q.eq("boxId", args.boxId))
            .order("desc")
            .paginate(args.paginationOpts);

        const wordsWithDetails = [];
        for (const assignment of assignmentResults.page) {
            const word = await ctx.db.get(assignment.wordId);
            if (word) {
                wordsWithDetails.push({
                    ...word,
                    addedAt: assignment.addedAt,
                });
            }
        }

        return {
            page: wordsWithDetails,
            isDone: assignmentResults.isDone,
            continueCursor: assignmentResults.continueCursor,
        };
    },
});

export const getWordBox = query({
    args: {
        boxId: v.id("wordBoxes"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const box = await ctx.db.get(args.boxId);
        if (!box || box.userId !== user._id) {
            return null;
        }

        return box;
    },
});