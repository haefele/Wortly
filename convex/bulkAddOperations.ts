import { internalAction, internalMutation, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";
import { addNewWordInternal, AddNewWordResponse } from "./words";
import { addWordToBox } from "./wordBoxes";

export const createBulkAddOperation = mutation({
  args: {
    boxId: v.id("wordBoxes"),
    words: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const box = await ctx.db.get(args.boxId);
    if (!box || box.userId !== user._id) {
      throw new Error("Word box not found");
    }

    if (args.words.length === 0) {
      throw new ConvexError("At least one word is required.");
    }

    if (args.words.length > 1000) {
      throw new ConvexError("Maximum 1000 words allowed per bulk operation.");
    }

    const operationId = await ctx.db.insert("bulkAddOperations", {
      userId: user._id,
      boxId: args.boxId,
      words: args.words.map(word => ({
        word: word.trim(),
        status: "pending" as const,
      })),
      status: "pending",
      createdAt: Date.now(),
    });

    return operationId;
  },
});

const MAX_PROCESS_WORD_SCHEDULES = 25;
const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

export const processBulkAddOperations = internalMutation({
  args: {},
  handler: async ctx => {
    const operations = await ctx.db
      .query("bulkAddOperations")
      .withIndex("by_status", q => q.eq("status", "pending"))
      .collect();

    let processedWordSchedules = 0;

    for (const operation of operations) {
      let startedProcessingWords = false;

      for (const word of operation.words) {
        if (processedWordSchedules < MAX_PROCESS_WORD_SCHEDULES) {
          const isPending = word.status === "pending";
          const isProcessingButExpired =
            word.status === "processing" &&
            word.processingStartedAt &&
            word.processingStartedAt < Date.now() - FIVE_MINUTES_IN_MS;

          if (isPending || isProcessingButExpired) {
            ctx.scheduler.runAfter(0, internal.bulkAddOperations.processWord, {
              operationId: operation._id,
              word: word.word,
            });

            word.status = "processing";
            word.processingStartedAt = Date.now();
            startedProcessingWords = true;

            processedWordSchedules++;
          }
        }
      }

      if (startedProcessingWords) {
        await ctx.db.patch(operation._id, {
          words: operation.words,
        });
      }
    }
  },
});

export const processWord = internalAction({
  args: {
    operationId: v.id("bulkAddOperations"),
    word: v.string(),
  },
  handler: async (ctx, args) => {
    let result: AddNewWordResponse;
    try {
      result = await addNewWordInternal(ctx, args.word);
    } catch {
      result = { success: false, suggestions: [] };
    }

    await ctx.runMutation(internal.bulkAddOperations.processWordFinished, {
      operationId: args.operationId,
      word: args.word,
      wordId: result.success ? result.word?._id : undefined,
    });
  },
});

export const processWordFinished = internalMutation({
  args: {
    operationId: v.id("bulkAddOperations"),
    word: v.string(),
    wordId: v.optional(v.id("words")),
  },
  handler: async (ctx, args) => {
    const operation = await ctx.db.get(args.operationId);
    if (!operation) {
      throw new Error("Operation not found");
    }
    const words = operation.words.filter(w => w.word === args.word);
    if (!words) {
      throw new Error("Word not found");
    }
    const wordBox = await ctx.db.get(operation.boxId);
    if (!wordBox) {
      throw new Error("Word box not found");
    }

    // Update the word status
    for (const word of words) {
      if (args.wordId) {
        word.status = "added";
        word.wordId = args.wordId;

        const wordDoc = await ctx.db.get(args.wordId);
        if (!wordDoc) {
          throw new Error("Word not found");
        }

        await addWordToBox(ctx, wordBox, wordDoc);
      } else {
        word.status = "failed";
      }
    }

    await ctx.db.patch(args.operationId, {
      words: operation.words,
    });

    // Update the operation status
    if (operation.words.every(w => w.status === "added" || w.status === "failed")) {
      await ctx.db.patch(args.operationId, {
        status: "completed",
        completedAt: Date.now(),
      });
    }
  },
});
