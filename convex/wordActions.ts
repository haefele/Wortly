"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { internal } from "./_generated/api";
import z from "zod";

export const fetchWordData = internalAction({
  args: {
    word: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { word, userId }) => {
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

    await ctx.runMutation(internal.words.addWordFinished, {
      word: {
        word: word,
        translations: object.translations,
        article: object.article || undefined,
        wordType: object.wordType,
        exampleSentences: object.exampleSentences
      },
      userId: userId
    });
  },
});