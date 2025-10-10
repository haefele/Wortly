import { Migrations } from "@convex-dev/migrations";
import { DataModel } from "./_generated/dataModel";
import { components } from "./_generated/api";

export const migrations = new Migrations<DataModel>(components.migrations);

// export const someMigrationName = migrations.define({
//   table: "theTable",
//   migrateOne: async (ctx, row) => {
//     // Migration logic here
//     return {};
//   },
// });

// export const runsomeMigrationName = migrations.runner(
//   internal.migrations.someMigrationName
// );
