import { action } from "./_generated/server";

// Fetch live USD to INR exchange rate
export const getExchangeRate = action({
    args: {},
    handler: async () => {
        try {
            // Using exchangerate-api.com (free tier allows 1500 requests/month)
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

            if (!response.ok) {
                throw new Error('Failed to fetch exchange rate');
            }

            const data = await response.json();
            const inrRate = data.rates.INR;

            return {
                rate: inrRate,
                timestamp: Date.now(),
                success: true
            };
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            // Fallback to a default rate if API fails
            return {
                rate: 83.0, // Fallback rate
                timestamp: Date.now(),
                success: false
            };
        }
    },
});
