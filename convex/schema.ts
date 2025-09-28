import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("Admin"), v.literal("User"))),
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
  })
    .index("by_word", ["word"])
    .searchIndex("search_word", {
      searchField: "word",
    }),

  wordBoxes: defineTable({
    name: v.string(),
    userId: v.id("users"),
    wordCount: v.number(),
    description: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_name", ["userId", "name"]),

  wordBoxAssignments: defineTable({
    wordId: v.id("words"),
    boxId: v.id("wordBoxes"),
    addedAt: v.number(),
    searchText: v.optional(v.string()),
  })
    .index("by_boxId", ["boxId"])
    .index("by_wordId", ["wordId"])
    .index("by_boxId_and_wordId", ["boxId", "wordId"])
    .searchIndex("search_by_box", {
      searchField: "searchText",
      filterFields: ["boxId"],
    }),

  bulkAddOperations: defineTable({
    userId: v.id("users"),
    boxId: v.id("wordBoxes"),
    words: v.array(
      v.object({
        word: v.string(),
        status: v.union(
          v.literal("pending"),
          v.literal("processing"),
          v.literal("added"),
          v.literal("failed")
        ),
        processingStartedAt: v.optional(v.number()),
        wordId: v.optional(v.id("words")),
        errorMessage: v.optional(v.string()),
      })
    ),
    status: v.union(v.literal("pending"), v.literal("completed")),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),
});
