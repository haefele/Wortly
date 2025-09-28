import { cronJobs } from "convex/server";

const crons = cronJobs();

// Process bulk add operations every minute
// TODO: Add a cron job to process bulk add operations

export default crons;
