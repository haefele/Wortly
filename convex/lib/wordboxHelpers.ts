import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";

export async function getOrCreateDefaultBox(ctx: MutationCtx, userId: string) {
    const defaultBox = await ctx.db
        .query("wordBoxes")
        .withIndex("by_userId_and_name", (q) => q.eq("userId", userId).eq("name", "Alle"))
        .unique();

    if (defaultBox) {
        return defaultBox;
    }

    const id = await ctx.db.insert("wordBoxes", {
        name: "Alle",
        userId: userId,
        wordCount: 0,
    });

    const createdBox = await ctx.db.get(id);
    if (!createdBox) {
        throw new Error("Failed to create default box");
    }

    return createdBox;
};

export async function addWordToBox(ctx: MutationCtx, box: Doc<"wordBoxes">, wordId: Id<"words">) {
    const existingAssignment = await ctx.db
        .query("wordBoxAssignments")
        .withIndex("by_boxId_and_wordId", (q) => q.eq("boxId", box._id).eq("wordId", wordId))
        .unique();

    if (existingAssignment) {
        return;
    }

    await ctx.db.insert("wordBoxAssignments", {
        wordId: wordId,
        boxId: box._id,
        addedAt: Date.now(),
    });

    await ctx.db.patch(box._id, {
        wordCount: box.wordCount + 1,
    });
};