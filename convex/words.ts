import { v } from "convex/values";
import { query, internalMutation, action, internalQuery, ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { ConvexError } from "convex/values";
import schema from "./schema";
import { getCurrentUser, throwIfUnauthenticated } from "./users";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import z from "zod";

export const searchWord = query({
  args: {
    term: v.string(),
    wordBoxId: v.optional(v.id("wordBoxes")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const term = args.term.trim();
    if (term.length === 0) {
      return { results: [], hasExactMatch: false };
    }

    // Get search results
    const results = await ctx.db
      .query("words")
      .withSearchIndex("search_word", q => q.search("word", term))
      .take(10);

    // Check for exact match
    const exactMatch = await ctx.db
      .query("words")
      .withIndex("by_word", q => q.eq("word", term))
      .unique();

    // No word box id, so we don't need to check if the words are in the box
    if (!args.wordBoxId) {
      return {
        results: results.map(word => ({
          ...word,
          isInBox: false,
        })),
        hasExactMatch: !!exactMatch,
      };
    }

    // Check if the words are in the box
    const wordBox = await ctx.db.get(args.wordBoxId);
    if (!wordBox || wordBox.userId !== user._id) {
      throw new Error("Word box not found");
    }

    const assignmentResults = await Promise.all(
      results.map(word =>
        ctx.db
          .query("wordBoxAssignments")
          .withIndex("by_boxId_and_wordId", q =>
            q.eq("boxId", args.wordBoxId!).eq("wordId", word._id)
          )
          .unique()
      )
    );

    return {
      results: results.map((word, index) => ({
        ...word,
        isInBox: assignmentResults[index] !== null,
      })),
      hasExactMatch: !!exactMatch,
    };
  },
});

export const getRecentWords = query({
  args: {},
  handler: async ctx => {
    await throwIfUnauthenticated(ctx);

    return await ctx.db.query("words").order("desc").take(12);
  },
});

export type AddNewWordResponse =
  | { success: true; word: Doc<"words"> }
  | { success: false; suggestions: string[] };

export const addNewWord = action({
  args: {
    word: v.string(),
  },
  handler: async (ctx, args): Promise<AddNewWordResponse> => {
    await throwIfUnauthenticated(ctx);
    return await addNewWordInternal(ctx, args.word);
  },
});

export async function addNewWordInternal(
  ctx: ActionCtx,
  word: string
): Promise<AddNewWordResponse> {
  // Check if word already exists
  const existingWord = await ctx.runQuery(internal.words.getExistingWord, {
    word: word,
  });

  if (existingWord) {
    return { success: true, word: existingWord };
  }

  // Analyze the word with AI
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  let object;
  try {
    const result = await generateObject({
      model: openai("gpt-5-mini"),
      prompt: `You are a German language expert. Analyze the input "${word}" and determine if it is a valid German word.
  
              IMPORTANT VALIDATION RULES:
              1. First, verify if "${word}" is a real German word (not a typo, made-up word, or non-German text)
              2. If it's a valid German word, find its BASE FORM:
                 - For verbs: return the infinitive (e.g., "gehen" not "gehe", "gehst", "geht")
                 - For nouns: return the nominative singular (e.g., "Haus" not "Häuser", "Hauses")
                 - For adjectives: return the base form (e.g., "groß" not "große", "größer")
                 - For other word types: return the standard dictionary form
  
              If the input is NOT a valid German word, set isValidWord to false, provide an explanation, and suggest 2-4 similar German words that the user might have meant.
  
              For valid words, provide:
              - The base form of the word (correctly capitalized)
              - English translation
              - Russian translation
              - Article (der/die/das for nouns, empty string for other word types)
              - Word type (noun, verb, adjective, adverb, etc.)
              - 3-5 example sentences in German showing different usage contexts
              
              Return the data in the exact format specified in the schema.`,
      schema: z.object({
        isValidWord: z.boolean().describe("Whether the input is a valid German word"),
        errorMessage: z.string().optional().describe("Explanation if the word is invalid"),
        suggestions: z
          .array(z.string())
          .optional()
          .describe("Suggested similar German words if the input is invalid"),
        wordData: z
          .object({
            word: z.string().describe("The base form of the German word with correct casing"),
            translations: z.object({
              en: z.string().describe("English translation"),
              ru: z.string().optional().describe("Russian translation"),
            }),
            article: z
              .string()
              .optional()
              .describe("Article for nouns (der/die/das) or empty string for other word types"),
            wordType: z
              .union([
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
              ])
              .describe("Word type"),
            exampleSentences: z
              .array(z.string())
              .min(3)
              .max(5)
              .describe("3-5 example sentences in German"),
          })
          .optional()
          .describe("Word data - only present if isValidWord is true"),
      }),
    });
    object = result.object;
  } catch (error) {
    throw new ConvexError("Failed to analyze word. Please try again.");
  }

  // Check if the word is valid
  if (!object.isValidWord) {
    const suggestions = object.suggestions || [];
    return { success: false, suggestions };
  }

  // Ensure we have word data for valid words
  if (!object.wordData) {
    throw new Error("Invalid response from AI: missing word data for valid word");
  }

  const wordData = {
    word: object.wordData.word,
    translations: object.wordData.translations,
    article: object.wordData.article || undefined,
    wordType: object.wordData.wordType,
    exampleSentences: object.wordData.exampleSentences,
  };

  // Insert the word into the database
  const insertedWord = await ctx.runMutation(internal.words.insertWord, {
    word: wordData,
  });

  return { success: true, word: insertedWord };
}

export const getExistingWord = internalQuery({
  args: {
    word: v.string(),
  },
  handler: async (ctx, args) => {
    const existingWord = await ctx.db
      .query("words")
      .withIndex("by_word", q => q.eq("word", args.word))
      .unique();

    return existingWord;
  },
});

export const insertWord = internalMutation({
  args: {
    word: schema.tables.words.validator,
  },
  handler: async (ctx, args): Promise<Doc<"words">> => {
    const existingWord = await ctx.db
      .query("words")
      .withIndex("by_word", q => q.eq("word", args.word.word))
      .unique();

    if (existingWord) {
      return existingWord;
    }

    const wordId = await ctx.db.insert("words", args.word);
    const insertedWord = await ctx.db.get(wordId);

    if (!insertedWord) {
      throw new Error("Failed to retrieve inserted word");
    }

    return insertedWord;
  },
});
