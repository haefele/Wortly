import { Migrations } from "@convex-dev/migrations";
import { DataModel } from "./_generated/dataModel";
import { components, internal } from "./_generated/api";
import { getSearchText } from "./wordBoxes";

export const migrations = new Migrations<DataModel>(components.migrations);

export const updateWordTypeInAssignments = migrations.define({
  table: "wordBoxAssignments",
  migrateOne: async (ctx, row) => {
    if (row.wordType) {
      return {};
    }
    const word = await ctx.db.get(row.wordId);
    if (!word) {
      return {};
    }

    return { wordType: word.wordType };
  },
});

export const runUpdateWordTypeInAssignments = migrations.runner(
  internal.migrations.updateWordTypeInAssignments
);

export const updateSearchTextInAssignments = migrations.define({
  table: "wordBoxAssignments",
  migrateOne: async (ctx, row) => {
    const word = await ctx.db.get(row.wordId);
    if (!word) {
      return {};
    }

    return { searchText: getSearchText(word) };
  },
});

export const runUpdateSearchTextInAssignments = migrations.runner(
  internal.migrations.updateSearchTextInAssignments
);

export const backfillSentenceCounts = migrations.define({
  table: "wordBoxes",
  migrateOne: async (ctx, row) => {
    const count = await ctx.db
      .query("wordBoxSentences")
      .withIndex("by_boxId_addedAt", q => q.eq("boxId", row._id))
      .collect();

    return { sentenceCount: count.length };
  },
});

export const runBackfillSentenceCounts = migrations.runner(
  internal.migrations.backfillSentenceCounts
);
