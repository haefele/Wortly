import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import schema from "./schema";

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
            .unique();

        if (!word) {
            return null;
        }
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

        const lowerCaseWord = args.word.toLowerCase().trim();
        if (lowerCaseWord.length === 0) {
            throw new Error("Word cannot be empty");
        }

        const existingWord = await ctx.db
            .query("words")
            .withIndex("by_word", (q) => q.eq("word", lowerCaseWord))
            .unique();

        if (existingWord) {
            return false;
        }

        await ctx.scheduler.runAfter(0, internal.wordActions.fetchWordData, {
            word: lowerCaseWord,
        });

        return true;
    },
});

export const addWordFinished = internalMutation({
    args: {
        word: schema.tables.words.validator,
    },
    handler: async (ctx, args) => {
        const existingWord = await ctx.db
            .query("words")
            .withIndex("by_word", (q) => q.eq("word", args.word.word))
            .unique();

        if (existingWord) {
            return;
        }

        return await ctx.db.insert("words", args.word);
    },
});