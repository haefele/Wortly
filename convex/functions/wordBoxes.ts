import { query, mutation } from "../_generated/server";
import { getCurrentUser } from "../lib/authHelpers";
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

        return boxes.sort((a, b) => a.name.localeCompare(b.name));
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

export const createWordBox = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const name = args.name.trim();
        if (name.length === 0) {
            throw new Error("Name is required");
        }

        const id = await ctx.db.insert("wordBoxes", {
            name,
            userId: user._id,
            wordCount: 0,
            description: args.description,
        });

        const created = await ctx.db.get(id);
        if (!created) {
            throw new Error("Failed to create word box");
        }

        return created;
    },
});