import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    trades: defineTable({
        ticker: v.string(),
        market: v.optional(v.string()), // e.g., 'NASDAQ', 'CRYPTO'
        entryDate: v.number(), // timestamp
        exitDate: v.optional(v.number()), // timestamp
        entryPrice: v.number(),
        exitPrice: v.optional(v.number()),
        quantity: v.number(),
        direction: v.string(), // 'LONG' | 'SHORT'
        status: v.string(), // 'OPEN', 'WIN', 'LOSS', 'BE'
        pl: v.optional(v.number()), // Profit/Loss amount
        plPercent: v.optional(v.number()),
        riskReward: v.optional(v.number()),
        timeFrame: v.optional(v.string()), // e.g., '1h', '4h', '1d'
        notes: v.optional(v.string()), // Trading plan/notes
        imageId: v.optional(v.string()), // Storage ID for screenshot
        imageIds: v.optional(v.array(v.string())), // New field for multiple screenshots
        userId: v.optional(v.string()), // For future auth support
    }).index("by_entry_date", ["entryDate"]),
});
