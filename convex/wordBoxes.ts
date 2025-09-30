import { query, mutation, MutationCtx } from "./_generated/server";
import { getCurrentUser } from "./users";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

export const getMyWordBoxes = query({
  args: {},
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const boxes = await ctx.db
      .query("wordBoxes")
      .withIndex("by_userId", q => q.eq("userId", currentUser._id))
      .collect();

    return boxes.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getWords = query({
  args: {
    boxId: v.id("wordBoxes"),
    paginationOpts: paginationOptsValidator,
    searchTerm: v.optional(v.string()),
    wordType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const box = await ctx.db.get(args.boxId);
    if (!box || box.userId !== user._id) {
      throw new Error("Word box not found");
    }

    const trimmedSearchTerm = args.searchTerm?.trim();
    const trimmedWordType = args.wordType?.trim();

    const assignmentResults =
      trimmedSearchTerm?.length && trimmedWordType?.length
        ? await ctx.db
            .query("wordBoxAssignments")
            .withSearchIndex("search_by_box", q =>
              q
                .search("searchText", trimmedSearchTerm.toLowerCase())
                .eq("boxId", args.boxId)
                .eq("wordType", trimmedWordType)
            )
            .paginate(args.paginationOpts)
        : trimmedSearchTerm?.length
          ? await ctx.db
              .query("wordBoxAssignments")
              .withSearchIndex("search_by_box", q =>
                q.search("searchText", trimmedSearchTerm.toLowerCase()).eq("boxId", args.boxId)
              )
              .paginate(args.paginationOpts)
          : trimmedWordType?.length
            ? await ctx.db
                .query("wordBoxAssignments")
                .withIndex("by_boxId_and_wordType", q =>
                  q.eq("boxId", args.boxId).eq("wordType", trimmedWordType)
                )
                .paginate(args.paginationOpts)
            : await ctx.db
                .query("wordBoxAssignments")
                .withIndex("by_boxId", q => q.eq("boxId", args.boxId))
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
      sentenceCount: 0,
      description: args.description,
    });

    const created = await ctx.db.get(id);
    if (!created) {
      throw new Error("Failed to create word box");
    }

    return created;
  },
});

export const updateWordBox = mutation({
  args: {
    boxId: v.id("wordBoxes"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const box = await ctx.db.get(args.boxId);
    if (!box || box.userId !== user._id) {
      throw new Error("Word box not found");
    }

    const name = args.name.trim();
    if (name.length === 0) {
      throw new Error("Name is required");
    }

    await ctx.db.patch(box._id, {
      name,
      description: args.description?.trim() || undefined,
    });

    return null;
  },
});

export const deleteWordBox = mutation({
  args: {
    boxId: v.id("wordBoxes"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const box = await ctx.db.get(args.boxId);
    if (!box || box.userId !== user._id) {
      throw new Error("Word box not found");
    }

    const assignments = await ctx.db
      .query("wordBoxAssignments")
      .withIndex("by_boxId", q => q.eq("boxId", box._id))
      .collect();

    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    const sentences = await ctx.db
      .query("wordBoxSentences")
      .withIndex("by_boxId_addedAt", q => q.eq("boxId", box._id))
      .collect();

    for (const sentence of sentences) {
      await ctx.db.delete(sentence._id);
    }

    await ctx.db.delete(box._id);

    return null;
  },
});

export const addWord = mutation({
  args: {
    boxId: v.id("wordBoxes"),
    wordId: v.id("words"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const box = await ctx.db.get(args.boxId);
    if (!box || box.userId !== user._id) {
      throw new Error("Word box not found");
    }

    const word = await ctx.db.get(args.wordId);
    if (!word) {
      throw new Error("Word not found");
    }

    await addWordToBox(ctx, box, word);

    return null;
  },
});

export const removeWord = mutation({
  args: {
    boxId: v.id("wordBoxes"),
    wordId: v.id("words"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const box = await ctx.db.get(args.boxId);
    if (!box || box.userId !== user._id) {
      throw new Error("Word box not found");
    }

    const assignment = await ctx.db
      .query("wordBoxAssignments")
      .withIndex("by_boxId_and_wordId", q => q.eq("boxId", box._id).eq("wordId", args.wordId))
      .unique();

    if (!assignment) {
      return null;
    }

    await ctx.db.delete(assignment._id);

    const remainingAssignments = await ctx.db
      .query("wordBoxAssignments")
      .withIndex("by_boxId", q => q.eq("boxId", box._id))
      .collect();

    await ctx.db.patch(box._id, {
      wordCount: remainingAssignments.length,
    });

    return null;
  },
});

export async function addWordToBox(ctx: MutationCtx, box: Doc<"wordBoxes">, word: Doc<"words">) {
  const existingAssignment = await ctx.db
    .query("wordBoxAssignments")
    .withIndex("by_boxId_and_wordId", q => q.eq("boxId", box._id).eq("wordId", word._id))
    .unique();

  if (existingAssignment) {
    return;
  }

  const searchText = getSearchText(word);

  await ctx.db.insert("wordBoxAssignments", {
    wordId: word._id,
    boxId: box._id,
    addedAt: Date.now(),
    searchText: searchText,
    wordType: word.wordType,
  });

  await ctx.db.patch(box._id, {
    wordCount: box.wordCount + 1,
  });
}

export function getSearchText(word: Doc<"words">) {
  return [word.article, word.word, word.translations.en, word.translations.ru, word.wordType]
    .flatMap(value => (value ? [value.toLowerCase()] : []))
    .join(" ");
}

export const getSentences = query({
  args: {
    boxId: v.id("wordBoxes"),
    paginationOpts: paginationOptsValidator,
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const box = await ctx.db.get(args.boxId);
    if (!box || box.userId !== user._id) {
      throw new Error("Word box not found");
    }

    const trimmedSearchTerm = args.searchTerm?.trim().toLowerCase();

    const results =
      trimmedSearchTerm && trimmedSearchTerm.length > 0
        ? await ctx.db
            .query("wordBoxSentences")
            .withSearchIndex("search_by_box", q =>
              q.search("searchText", trimmedSearchTerm).eq("boxId", args.boxId)
            )
            .paginate(args.paginationOpts)
        : await ctx.db
            .query("wordBoxSentences")
            .withIndex("by_boxId_addedAt", q => q.eq("boxId", args.boxId))
            .order("desc")
            .paginate(args.paginationOpts);

    return results;
  },
});

export const addSentence = mutation({
  args: {
    boxId: v.id("wordBoxes"),
    sentence: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const box = await ctx.db.get(args.boxId);
    if (!box || box.userId !== user._id) {
      throw new Error("Word box not found");
    }

    const sentence = args.sentence.trim();
    if (sentence.length === 0) {
      throw new Error("Sentence is required");
    }

    const searchText = sentence.toLowerCase();

    const id = await ctx.db.insert("wordBoxSentences", {
      boxId: args.boxId,
      userId: user._id,
      sentence,
      addedAt: Date.now(),
      searchText,
    });

    await ctx.db.patch(box._id, {
      sentenceCount: (box.sentenceCount ?? 0) + 1,
    });

    const created = await ctx.db.get(id);
    if (!created) {
      throw new Error("Failed to add sentence");
    }

    return created;
  },
});

export const removeSentence = mutation({
  args: {
    sentenceId: v.id("wordBoxSentences"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const sentence = await ctx.db.get(args.sentenceId);
    if (!sentence) {
      return null;
    }

    const box = await ctx.db.get(sentence.boxId);
    if (!box || box.userId !== user._id) {
      throw new Error("Word box not found");
    }

    await ctx.db.delete(sentence._id);

    if (box.sentenceCount && box.sentenceCount > 0) {
      await ctx.db.patch(box._id, {
        sentenceCount: Math.max(0, box.sentenceCount - 1),
      });
    } else {
      await ctx.db.patch(box._id, {
        sentenceCount: 0,
      });
    }

    return null;
  },
});
