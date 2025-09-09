import { v } from "convex/values";
import { mutation, query, internalMutation, internalAction } from "@/_generated/server";
import { internal } from "@/_generated/api";
import schema from "@/schema";
import { throwIfUnauthenticated } from "@/lib/authHelpers";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import z from "zod";

export const searchWord = query({
    args: {
        term: v.string(),
    },
    handler: async (ctx, args) => {
        await throwIfUnauthenticated(ctx);

        const term = args.term.trim();
        if (term.length === 0) {
            return [];
        }

        return await ctx.db
            .query("words")
            .withSearchIndex("search_word", q => q.search("word", term))
            .take(10);
    }
});

export const getRecentWords = query({
    args: {},
    handler: async (ctx) => {
        await throwIfUnauthenticated(ctx);

        return await ctx.db
            .query("words")
            .order("desc")
            .take(12);
    }
});

export const addNewWord = mutation({
    args: {
        word: v.string(),
    },
    handler: async (ctx, args) => {
        await throwIfUnauthenticated(ctx);

        const existingWord = await ctx.db
            .query("words")
            .withIndex("by_word", (q) => q.eq("word", args.word))
            .unique();

        if (existingWord) {
            return false;
        }

        await ctx.scheduler.runAfter(0, internal.functions.words.fetchWordData, {
            word: args.word,
        });

        return true;
    },
});

export const fetchWordData = internalAction({
  args: {
    word: v.string(),
  },
  handler: async (ctx, { word }) => {

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { object } = await generateObject({
      model: openai("gpt-5-mini"),
      prompt: `Analyze the German word "${word}" and provide comprehensive data including:
      - English translation
      - Russian translation
      - Article (der/die/das for nouns, empty string for other word types)
      - Word type (noun, verb, adjective, adverb, etc.)
      - 3-5 example sentences in German showing different usage contexts
      
      Return the data in the exact format specified in the schema.`,
      schema: z.object({
        word: z.string().describe("The analyzed German word with correct casing"),
        translations: z.object({
          en: z.string().describe("English translation"),
          ru: z.string().optional().describe("Russian translation")
        }),
        article: z.string().optional().describe("Article for nouns (der/die/das) or empty string for other word types"),
        wordType: z.union([
          z.literal("Adjektiv"), 
          z.literal("Adverb"),
          z.literal("Artikel"),
          z.literal("Eigenname"),
          z.literal("Interjektion"),
          z.literal("Konjunktion"),
          z.literal("Partikel"),
          z.literal("Präposition"),
          z.literal("Pronomen"),
          z.literal("Verb"),
          z.literal("Substantiv"),
          z.literal("Zahlwort"),
        ]).describe("Word type"),
        exampleSentences: z.array(z.string()).min(3).max(5).describe("3-5 example sentences in German")
      })
    });

    await ctx.runMutation(internal.functions.words.fetchWordDataFinished, {
      word: {
        word: object.word,
        translations: object.translations,
        article: object.article || undefined,
        wordType: object.wordType,
        exampleSentences: object.exampleSentences
      },
    });
  },
});

export const fetchWordDataFinished = internalMutation({
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

        await ctx.db.insert("words", args.word);
    },
});