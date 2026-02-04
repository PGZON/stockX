/**
 * Instrument Configuration
 * 
 * This file contains the contract size configuration for different trading instruments.
 * Contract size determines how much 1 lot represents and how price movements translate to P/L.
 * 
 * Formula: P/L = Price Movement × Contract Size × Lot Size
 */

export interface InstrumentConfig {
    symbol: string;
    contractSize: number;
    description: string;
}

/**
 * Get the contract size for a given instrument/pair
 * 
 * @param pair - Trading pair symbol (e.g., "XAUUSD", "EURUSD", "BTCUSD")
 * @returns Contract size (how many units per 1 lot)
 */
export function getInstrumentConfig(pair: string): number {
    const p = pair.toUpperCase();

    // Gold (XAU)
    if (p.includes('XAU')) {
        // 1 lot = 100 ounces
        // $1 price move = $100 profit/loss
        return 100;
    }

    // Forex Pairs (Major Currencies)
    if (p.length === 6 && !p.startsWith('US')) {
        // Standard Forex lot
        // 1 lot = 100,000 units of base currency
        // For EURUSD: 0.0001 (1 pip) move = $10 profit/loss
        return 100000;
    }

    // Indices (US30, NAS100, etc.)
    if (p.startsWith('US') || p.includes('NAS') || p.includes('SPX')) {
        // 1 lot = 1 contract
        // $1 price move = $1 profit/loss
        return 1;
    }

    // Crypto (BTC, ETH, etc.)
    if (p.includes('BTC') || p.includes('ETH')) {
        // 1 lot = 1 coin
        // $1 price move = $1 profit/loss
        return 1;
    }

    // JPY Pairs (special case in Forex)
    if (p.includes('JPY')) {
        // 1 lot = 100,000 units
        // 0.01 (1 pip for JPY) move = $10 profit/loss
        return 100000;
    }

    // Default fallback
    return 1;
}

/**
 * Predefined instrument configurations for common trading pairs
 */
export const INSTRUMENT_CONFIGS: InstrumentConfig[] = [
    // Precious Metals
    { symbol: 'XAUUSD', contractSize: 100, description: 'Gold vs US Dollar (100 oz per lot)' },
    { symbol: 'XAGUSD', contractSize: 5000, description: 'Silver vs US Dollar (5000 oz per lot)' },

    // Major Forex Pairs
    { symbol: 'EURUSD', contractSize: 100000, description: 'Euro vs US Dollar' },
    { symbol: 'GBPUSD', contractSize: 100000, description: 'British Pound vs US Dollar' },
    { symbol: 'USDJPY', contractSize: 100000, description: 'US Dollar vs Japanese Yen' },
    { symbol: 'USDCHF', contractSize: 100000, description: 'US Dollar vs Swiss Franc' },
    { symbol: 'AUDUSD', contractSize: 100000, description: 'Australian Dollar vs US Dollar' },
    { symbol: 'NZDUSD', contractSize: 100000, description: 'New Zealand Dollar vs US Dollar' },
    { symbol: 'USDCAD', contractSize: 100000, description: 'US Dollar vs Canadian Dollar' },

    // Indices
    { symbol: 'US30', contractSize: 1, description: 'Dow Jones Industrial Average' },
    { symbol: 'NAS100', contractSize: 1, description: 'NASDAQ 100' },
    { symbol: 'SPX500', contractSize: 1, description: 'S&P 500' },

    // Crypto
    { symbol: 'BTCUSD', contractSize: 1, description: 'Bitcoin vs US Dollar' },
    { symbol: 'ETHUSD', contractSize: 1, description: 'Ethereum vs US Dollar' },
];

/**
 * Calculate profit/loss based on trade parameters
 * 
 * @param params Trade calculation parameters
 * @returns Calculated P/L in USD
 */
export function calculatePL(params: {
    pair: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice: number;
    lotSize: number;
}): number {
    const { pair, direction, entryPrice, exitPrice, lotSize } = params;
    const contractSize = getInstrumentConfig(pair);

    let priceMove: number;

    if (direction === 'LONG') {
        // BUY: Profit when price goes up
        priceMove = exitPrice - entryPrice;
    } else {
        // SELL: Profit when price goes down
        priceMove = entryPrice - exitPrice;
    }

    // P/L = Price Movement × Contract Size × Lot Size
    return priceMove * contractSize * lotSize;
}

/**
 * Calculate risk amount (potential loss if SL is hit)
 */
export function calculateRisk(params: {
    pair: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    stopLoss: number;
    lotSize: number;
}): number {
    const { pair, direction, entryPrice, stopLoss, lotSize } = params;
    const contractSize = getInstrumentConfig(pair);

    let riskMove: number;

    if (direction === 'LONG') {
        // BUY: Risk = Entry - SL
        riskMove = Math.abs(entryPrice - stopLoss);
    } else {
        // SELL: Risk = SL - Entry
        riskMove = Math.abs(stopLoss - entryPrice);
    }

    return riskMove * contractSize * lotSize;
}

/**
 * Calculate reward amount (potential profit if TP is hit)
 */
export function calculateReward(params: {
    pair: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    takeProfit: number;
    lotSize: number;
}): number {
    const { pair, direction, entryPrice, takeProfit, lotSize } = params;
    const contractSize = getInstrumentConfig(pair);

    let rewardMove: number;

    if (direction === 'LONG') {
        // BUY: Reward = TP - Entry
        rewardMove = Math.abs(takeProfit - entryPrice);
    } else {
        // SELL: Reward = Entry - TP
        rewardMove = Math.abs(entryPrice - takeProfit);
    }

    return rewardMove * contractSize * lotSize;
}
