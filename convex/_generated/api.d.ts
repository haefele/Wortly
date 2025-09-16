/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as functions_users from "../functions/users.js";
import type * as functions_wordBoxes from "../functions/wordBoxes.js";
import type * as functions_words from "../functions/words.js";
import type * as lib_authHelpers from "../lib/authHelpers.js";
import type * as lib_wordBoxHelpers from "../lib/wordBoxHelpers.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "functions/users": typeof functions_users;
  "functions/wordBoxes": typeof functions_wordBoxes;
  "functions/words": typeof functions_words;
  "lib/authHelpers": typeof lib_authHelpers;
  "lib/wordBoxHelpers": typeof lib_wordBoxHelpers;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
