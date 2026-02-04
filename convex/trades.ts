import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const addTrade = mutation({
    args: {
        ticker: v.string(),
        market: v.optional(v.string()),
        entryDate: v.number(),
        exitDate: v.optional(v.number()),
        entryPrice: v.number(),
        quantity: v.optional(v.number()),
        lotSize: v.optional(v.number()),
        direction: v.string(),
        type: v.optional(v.string()), // 'BUY' | 'SELL'

        stopLoss: v.optional(v.number()),
        takeProfit: v.optional(v.number()),

        status: v.string(),
        pl: v.optional(v.number()),
        plUsd: v.optional(v.number()),
        plInr: v.optional(v.number()),
        exchangeRate: v.optional(v.number()),

        plPercent: v.optional(v.number()),
        riskReward: v.optional(v.number()),

        riskAmount: v.optional(v.number()),
        rewardAmount: v.optional(v.number()),
        riskAmountInr: v.optional(v.number()),
        rewardAmountInr: v.optional(v.number()),

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
        let totalPLInr = 0;
        let totalPLUsd = 0;
        let wins = 0;
        let losses = 0;
        let breakEven = 0;

        let totalWinAmtInr = 0;
        let totalLossAmtInr = 0;
        let totalWinAmtUsd = 0;
        let totalLossAmtUsd = 0;
        let currentRun = 0;
        let bestRun = 0;

        // Ensure chronological order for streak calculation
        trades.sort((a, b) => a.entryDate - b.entryDate);

        trades.forEach((t) => {
            // Use plInr and plUsd, fallback to pl if not available
            const plValueInr = t.plInr ?? t.pl ?? 0;
            const plValueUsd = t.plUsd ?? t.pl ?? 0;

            totalPLInr += plValueInr;
            totalPLUsd += plValueUsd;

            if (t.status === "WIN") {
                wins++;
                totalWinAmtInr += plValueInr;
                totalWinAmtUsd += plValueUsd;
                currentRun++;
                if (currentRun > bestRun) bestRun = currentRun;
            } else if (t.status === "LOSS") {
                losses++;
                totalLossAmtInr += Math.abs(plValueInr);
                totalLossAmtUsd += Math.abs(plValueUsd);
                currentRun = 0;
            } else {
                breakEven++;
                currentRun = 0;
            }
        });

        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const avgWinInr = wins > 0 ? totalWinAmtInr / wins : 0;
        const avgLossInr = losses > 0 ? totalLossAmtInr / losses : 0;
        const avgWinUsd = wins > 0 ? totalWinAmtUsd / wins : 0;
        const avgLossUsd = losses > 0 ? totalLossAmtUsd / losses : 0;
        const profitFactor = totalLossAmtInr > 0 ? totalWinAmtInr / totalLossAmtInr : (totalWinAmtInr > 0 ? 100 : 0);

        return {
            totalPL: totalPLInr, // Backward compatibility (INR)
            totalPLInr,
            totalPLUsd,
            totalTrades,
            winRate,
            wins,
            losses,
            breakEven,
            avgWin: avgWinInr, // Backward compatibility (INR)
            avgLoss: avgLossInr, // Backward compatibility (INR)
            avgWinInr,
            avgLossInr,
            avgWinUsd,
            avgLossUsd,
            profitFactor,
            bestRun,
            recentTrades: trades.slice(-2).reverse(),
            chartData: trades.map(t => ({
                value: t.plInr ?? t.pl ?? 0, // Use INR for chart
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
