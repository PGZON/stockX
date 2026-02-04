import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const addTrade = mutation({
    args: {
        ticker: v.string(),
        market: v.optional(v.string()),
        entryDate: v.number(),
        exitDate: v.optional(v.number()),
        entryPrice: v.number(),
        exitPrice: v.optional(v.number()),
        quantity: v.number(),
        direction: v.string(),
        status: v.string(),
        pl: v.optional(v.number()),
        plPercent: v.optional(v.number()),
        riskReward: v.optional(v.number()),
        timeFrame: v.optional(v.string()),
        notes: v.optional(v.string()),

        imageId: v.optional(v.string()), // Deprecated, kept for backward compat
        imageIds: v.optional(v.array(v.string())), // New field
    },
    handler: async (ctx, args) => {
        const tradeId = await ctx.db.insert("trades", args);
        return tradeId;
    },
});

export const getTrades = query({
    args: {
        month: v.optional(v.number()), // Month index (0-11)
        year: v.optional(v.number()), // Full year e.g., 2024
    },
    handler: async (ctx, args) => {
        let trades = await ctx.db
            .query("trades")
            .withIndex("by_entry_date")
            .order("desc")
            .collect();

        if (args.month !== undefined && args.year !== undefined) {
            trades = trades.filter((t) => {
                const date = new Date(t.entryDate);
                return date.getMonth() === args.month && date.getFullYear() === args.year;
            });
        }

        // Enhance with image URL if imageId exists
        const tradesWithImages = await Promise.all(
            trades.map(async (t) => {
                let imageUrl = null;
                if (t.imageId) {
                    imageUrl = await ctx.storage.getUrl(t.imageId);
                }
                return { ...t, imageUrl };
            })
        );

        return tradesWithImages;
    },
});

export const getTrade = query({
    args: { id: v.id("trades") },
    handler: async (ctx, args) => {
        const trade = await ctx.db.get(args.id);
        if (!trade) return null;

        let imageUrl = null;
        if (trade.imageId) {
            imageUrl = await ctx.storage.getUrl(trade.imageId);
        }

        let imageUrls: string[] = [];
        if (trade.imageIds && trade.imageIds.length > 0) {
            const urls = await Promise.all(
                trade.imageIds.map((id) => ctx.storage.getUrl(id))
            );
            imageUrls = urls.filter((url): url is string => url !== null);
        }

        // If no images found in imageIds (or imageIds was empty), fall back to deprecated imageId
        if (imageUrls.length === 0 && imageUrl) {
            imageUrls = [imageUrl];
        }

        return { ...trade, imageUrl, imageUrls };
    },
});

export const deleteTrade = mutation({
    args: { id: v.id("trades") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const getDashboardStats = query({
    args: {},
    handler: async (ctx) => {
        const trades = await ctx.db.query("trades").collect();

        const totalTrades = trades.length;
        let totalPL = 0;
        let wins = 0;
        let losses = 0;
        let breakEven = 0;

        let totalWinAmt = 0;
        let totalLossAmt = 0;
        let currentRun = 0;
        let bestRun = 0;

        // Ensure chronological order for streak calculation
        trades.sort((a, b) => a.entryDate - b.entryDate);

        trades.forEach((t) => {
            if (t.pl) totalPL += t.pl;

            if (t.status === "WIN") {
                wins++;
                totalWinAmt += (t.pl || 0);
                currentRun++;
                if (currentRun > bestRun) bestRun = currentRun;
            } else if (t.status === "LOSS") {
                losses++;
                totalLossAmt += Math.abs(t.pl || 0);
                currentRun = 0;
            } else {
                breakEven++;
                // Reset streak on BE? Depends on trader preference. keeping existing streak if BE is neutral 
                // but usually breaks a "Win" streak. Let's say it breaks.
                currentRun = 0;
            }
        });

        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const avgWin = wins > 0 ? totalWinAmt / wins : 0;
        const avgLoss = losses > 0 ? totalLossAmt / losses : 0;
        const profitFactor = totalLossAmt > 0 ? totalWinAmt / totalLossAmt : (totalWinAmt > 0 ? 100 : 0); // 100 if no losses but wins

        return {
            totalPL,
            totalTrades,
            winRate,
            wins,
            losses,
            breakEven,
            avgWin,
            avgLoss,
            profitFactor,
            bestRun,
            recentTrades: trades.slice(-2).reverse(),
            chartData: trades.map(t => ({
                value: t.pl || 0,
                date: t.entryDate,
                label: new Date(t.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            }))
        };
    },
});

export const getTradesInDateRange = query({
    args: {
        startDate: v.number(),
        endDate: v.number(),
    },
    handler: async (ctx, args) => {
        const trades = await ctx.db
            .query("trades")
            .withIndex("by_entry_date", (q) =>
                q.gte("entryDate", args.startDate).lte("entryDate", args.endDate)
            )
            .collect();
        return trades;
    },
});
