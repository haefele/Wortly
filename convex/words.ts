import { v } from "convex/values";
import { mutation, query, internalMutation, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import schema from "./schema";
import { Doc, Id } from "./_generated/dataModel";

export const findWord = query({
    args: { word: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (user === null) {
            throw new Error("Not authenticated");
        }

        const word = await ctx.db
            .query("words")
            .withSearchIndex("search_word", q => q.search("word", args.word))
            .first();

        return word;
    }
});

export const addWord = mutation({
    args: {
        word: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (user === null) {
            throw new Error("Not authenticated");
        }

        const existingWord = await ctx.db
            .query("words")
            .withIndex("by_word", (q) => q.eq("word", args.word))
            .unique();

        if (existingWord) {
            const box = await getOrCreateDefaultBox(ctx, user.tokenIdentifier);
            await addWordToBox(ctx, box, existingWord._id);

            return false;
        }

        await ctx.scheduler.runAfter(0, internal.wordActions.fetchWordData, {
            word: args.word,
            userId: user.tokenIdentifier,
        });

        return true;
    },
});

export const addWordFinished = internalMutation({
    args: {
        word: schema.tables.words.validator,
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const existingWord = await ctx.db
            .query("words")
            .withIndex("by_word", (q) => q.eq("word", args.word.word))
            .unique();

        if (existingWord) {
            return;
        }

        const wordId = await ctx.db.insert("words", args.word);
        const box = await getOrCreateDefaultBox(ctx, args.userId);
        await addWordToBox(ctx, box, wordId);
    },
});

const getOrCreateDefaultBox = async (ctx: MutationCtx, userId: string) => {
    const defaultBox = await ctx.db
        .query("wordBoxes")
        .withIndex("by_userId_and_name", (q) => q.eq("userId", userId).eq("name", "Alle"))
        .unique();

    if (defaultBox) {
        return defaultBox;
    }

    const id = await ctx.db.insert("wordBoxes", {
        name: "Alle",
        userId: userId,
        wordCount: 0,
    });

    const createdBox = await ctx.db.get(id);
    if (!createdBox) {
        throw new Error("Failed to create default box");
    }

    return createdBox;
};

const addWordToBox = async (ctx: MutationCtx, box: Doc<"wordBoxes">, wordId: Id<"words">) => {
    const existingAssignment = await ctx.db
        .query("wordBoxAssignments")
        .withIndex("by_boxId_and_wordId", (q) => q.eq("boxId", box._id).eq("wordId", wordId))
        .unique();

    if (existingAssignment) {
        return;
    }

    await ctx.db.insert("wordBoxAssignments", {
        wordId: wordId,
        boxId: box._id,
        addedAt: Date.now(),
    });

    await ctx.db.patch(box._id, {
        wordCount: box.wordCount + 1,
    });
};