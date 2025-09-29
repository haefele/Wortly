import { Migrations } from "@convex-dev/migrations";
import { DataModel } from "./_generated/dataModel";
import { components, internal } from "./_generated/api";

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
export const runUpdateWordTypeInAssignments = migrations.runner(internal.migrations.updateWordTypeInAssignments);