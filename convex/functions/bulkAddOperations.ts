import { mutation } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { getCurrentUser } from "../lib/authHelpers";

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
