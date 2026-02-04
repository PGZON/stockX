import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    trades: defineTable({
        ticker: v.string(), // Pair
        market: v.optional(v.string()), // e.g., 'FOREX', 'CRYPTO'
        entryDate: v.number(), // timestamp
        exitDate: v.optional(v.number()), // timestamp
        entryPrice: v.number(),
        // exitPrice removed
        quantity: v.optional(v.number()), // Generic quantity
        lotSize: v.optional(v.number()), // Specific for Forex/indices
        direction: v.string(), // 'LONG' | 'SHORT' (Buy/Sell)
        type: v.optional(v.string()), // 'BUY' | 'SELL' - explicitly requested

        // Stops and Targets
        stopLoss: v.optional(v.number()),
        takeProfit: v.optional(v.number()),

        // PnL and Results
        status: v.string(), // 'OPEN', 'WIN', 'LOSS', 'BE'
        pl: v.optional(v.number()), // Base PL (usually USD)
        plUsd: v.optional(v.number()), // Explicit USD
        plInr: v.optional(v.number()), // Explicit INR
        exchangeRate: v.optional(v.number()), // USD to INR rate used

        plPercent: v.optional(v.number()),
        riskReward: v.optional(v.number()),

        riskAmount: v.optional(v.number()), // Total $ risk based on SL
        rewardAmount: v.optional(v.number()), // Total $ reward based on TP
        riskAmountInr: v.optional(v.number()),
        rewardAmountInr: v.optional(v.number()),

        timeFrame: v.optional(v.string()), // e.g., '1h', '4h', '1d'
        notes: v.optional(v.string()), // Trading plan/notes

        imageId: v.optional(v.string()), // Storage ID for screenshot
        imageIds: v.optional(v.array(v.string())), // New field for multiple screenshots
        userId: v.optional(v.string()), // For future auth support
    }).index("by_entry_date", ["entryDate"]),
    users: defineTable({
        email: v.string(),
        password: v.string(),
        name: v.optional(v.string()),
    }).index("by_email", ["email"]),
});
