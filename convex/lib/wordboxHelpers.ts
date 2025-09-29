import { Doc } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";

export async function addWordToBox(ctx: MutationCtx, box: Doc<"wordBoxes">, word: Doc<"words">) {
  const existingAssignment = await ctx.db
    .query("wordBoxAssignments")
    .withIndex("by_boxId_and_wordId", q => q.eq("boxId", box._id).eq("wordId", word._id))
    .unique();

  if (existingAssignment) {
    return;
  }

  const searchText = [word.article, word.word, word.translations.en, word.translations.ru]
    .flatMap(value => (value ? [value.toLowerCase()] : []))
    .join(" ");

  await ctx.db.insert("wordBoxAssignments", {
    wordId: word._id,
    boxId: box._id,
    addedAt: Date.now(),
    searchText: searchText.length ? searchText : undefined,
    wordType: word.wordType,
  });

  await ctx.db.patch(box._id, {
    wordCount: box.wordCount + 1,
  });
}
