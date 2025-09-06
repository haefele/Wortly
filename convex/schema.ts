import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  words: defineTable({
    word: v.string(),
    translations: v.object({
      en: v.optional(v.string()),
      ru: v.optional(v.string()),
    }),
    article: v.optional(v.string()),
    wordType: v.string(),
    exampleSentences: v.array(v.string()),
  }).index("by_word", ["word"])
    .searchIndex("search_word", {
      searchField: "word",
    }),

  wordBoxes: defineTable({
    name: v.string(),
    userId: v.string(),
    wordCount: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_userId_and_name", ["userId", "name"]),

  wordBoxAssignments: defineTable({
    wordId: v.id("words"),
    boxId: v.id("wordBoxes"),
    addedAt: v.number(),
  }).index("by_boxId", ["boxId"])
    .index("by_wordId", ["wordId"])
    .index("by_boxId_and_wordId", ["boxId", "wordId"]),
});
