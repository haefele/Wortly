import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createWord = mutation({
    args: { 
        word: v.string(),
        translation_en: v.string() 
    },
    handler: async (ctx, args) => {
        var user = await ctx.auth.getUserIdentity();
        if (user === null) {
            throw new Error("Not authenticated");
        }

        const word = {
            word: args.word,
            translations: { en: args.translation_en },
            wordType: "",
            exampleSentences: [],
        };

        await ctx.db.insert("words", word);
    }
});

export const findWord = query({
    args: { word: v.string() },
    handler: async (ctx, args) => {
        var user = await ctx.auth.getUserIdentity();
        if (user === null) {
            throw new Error("Not authenticated");
        }

        let word = await ctx.db.query("words").withSearchIndex("search_word", q => q.search("word", args.word)).first();
        if (!word) {
            return null;
        }
        return word;
    }
});