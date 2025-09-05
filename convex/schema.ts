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

  wordLibrary: defineTable({
    userId: v.string(),
    wordId: v.id("words")
  }).index("by_userId", ["userId"]),
});
