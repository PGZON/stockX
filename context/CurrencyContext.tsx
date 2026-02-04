import React, { createContext, ReactNode, useContext, useState } from 'react';

type Currency = 'USD' | 'INR';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    toggleCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
    const [currency, setCurrency] = useState<Currency>('USD');

    const toggleCurrency = () => {
        setCurrency(prev => prev === 'USD' ? 'INR' : 'USD');
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, toggleCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
