import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const signIn = mutation({
    args: {
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        // Simple security check (hashed passwords recommended for prod, plain text for now as per prev context)
        if (!user || user.password !== args.password) {
            return { error: "Invalid credentials" };
        }

        // Return user info to be stored locally
        return {
            token: user._id, // Using ID as token for simplicity in this custom auth setup
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        };
    },
});
