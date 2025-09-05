import { mutation, query } from "./_generated/server";

export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        let user = await ctx.db.query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
        
        if (user !== null) {

            if (user.email !== identity.email || user.name !== identity.name) {
                await ctx.db.patch(user._id, { email: identity.email, name: identity.name });
            }

            return user._id;
        }
        else {
            return await ctx.db.insert("users", {
                tokenIdentifier: identity.tokenIdentifier,
                email: identity.email,
                name: identity.name,
            });
        }
    },
});

export const getMe = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        
        const user = await ctx.db.query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
        return user;
    }
});