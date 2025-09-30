import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process bulk add operations every minute
crons.interval(
  "processBulkAddOperations",
  { seconds: 15 },
  internal.bulkAddOperations.processBulkAddOperations
);

export default crons;
