import { useTheme } from '@/context/ThemeContext';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useAction, useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

interface MetricsProps {
    wins: number;
    losses: number;
    totalTrades: number;
    avgWin: number;
    avgLoss: number;
    avgWinUsd?: number;
    avgLossUsd?: number;
    avgWinInr?: number;
    avgLossInr?: number;
    trades?: any[];
    currency?: 'USD' | 'INR';
}

export const MetricsDisplay = ({
    wins,
    losses,
    totalTrades,
    avgWin,
    avgLoss,
    avgWinUsd = 0,
    avgLossUsd = 0,
    avgWinInr = 0,
    avgLossInr = 0,
    trades: propTrades = [],
    currency = 'USD'
}: MetricsProps) => {
    const { colors, isDark } = useTheme();
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [loadingRate, setLoadingRate] = useState(true);
    const getExchangeRate = useAction(api.exchangeRate.getExchangeRate);

    // Fetch all trades to ensure detailed calendar history
    const allTradesQuery = useQuery(api.trades.getTrades, {});
    const trades = allTradesQuery || propTrades;

    // Fetch exchange rate on mount
    useEffect(() => {
        const fetchRate = async () => {
            setLoadingRate(true);
            try {
                const result = await getExchangeRate({});
                setExchangeRate(result.rate);
            } catch (error) {
                console.error('Failed to fetch exchange rate:', error);
                setExchangeRate(83.0); // Fallback
            } finally {
                setLoadingRate(false);
            }
        };

        fetchRate();

        // Refresh every 5 minutes
        const interval = setInterval(fetchRate, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [getExchangeRate]);

    const markedDates = useMemo(() => {
        const marks: any = {};
        trades.forEach((t: any) => {
            const date = new Date(t.entryDate).toISOString().split('T')[0];
            const dotColor = t.pl >= 0 ? colors.success : colors.danger;

            if (!marks[date]) {
                marks[date] = {
                    marked: true,
                    dotColor: dotColor,
                };
            } else {
                if (t.pl < 0) marks[date].dotColor = colors.danger;
            }
        });
        return marks;
    }, [trades, colors]);

    // Premium Card Gradient - as const to fix type error
    const cardGradient = isDark
        ? ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)'] as const
        : ['#FFFFFF', '#F8FAFC'] as const;

    const renderStatCard = (title: string, value: string, icon: any, color: string, subValue?: string, loading?: boolean) => (
        <LinearGradient
            colors={cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { borderColor: colors.border }]}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                    <Ionicons name={icon} size={18} color={color} />
                </View>
                <Text style={[styles.label, { color: colors.textMuted }]}>{title}</Text>
            </View>
            {loading ? (
                <ActivityIndicator size="small" color={color} style={{ marginTop: 8 }} />
            ) : (
                <>
                    <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
                    {subValue && <Text style={[styles.subValue, { color: color }]}>{subValue}</Text>}
                </>
            )}
        </LinearGradient>
    );

    // Determine which values to display based on currency
    const displayAvgWin = currency === 'USD' ? avgWinUsd : avgWinInr;
    const displayAvgLoss = currency === 'USD' ? avgLossUsd : avgLossInr;
    const currencySymbol = currency === 'USD' ? '$' : '₹';
    const decimals = currency === 'USD' ? 2 : 0;

    return (
        <View style={styles.container}>
            {/* Stats Grid */}
            <View style={styles.grid}>
                {renderStatCard(
                    'Exchange Rate',
                    exchangeRate ? `₹${exchangeRate.toFixed(2)}` : '---',
                    'cash-outline',
                    '#10B981',
                    '1 USD',
                    loadingRate
                )}
                {renderStatCard('Avg Win', `${currencySymbol}${displayAvgWin.toFixed(decimals)}`, 'trending-up', colors.success)}
                {renderStatCard('Avg Loss', `${currencySymbol}${Math.abs(displayAvgLoss).toFixed(decimals)}`, 'trending-down', colors.danger)}
            </View>

            {/* Archive Calendar */}
            <LinearGradient
                colors={isDark ? ['rgba(25, 25, 28, 0.6)', 'rgba(25, 25, 28, 0.3)'] : ['#FFFFFF', '#F8FAFC']}
                style={[styles.calendarContainer, { borderColor: colors.border }]}
            >
                <View style={styles.sectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="calendar" size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Trading Journal</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/logs')}
                        style={[styles.viewAllBtn, { backgroundColor: `${colors.primary}15` }]}
                    >
                        <Text style={[styles.seeAll, { color: colors.primary }]}>View Logs</Text>
                        <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <Calendar
                    key={isDark ? 'dark' : 'light'} // Force re-render on theme change
                    theme={{
                        backgroundColor: 'transparent',
                        calendarBackground: 'transparent',
                        textSectionTitleColor: colors.textMuted,
                        selectedDayBackgroundColor: colors.primary,
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: colors.primary,
                        dayTextColor: colors.text,
                        textDisabledColor: isDark ? '#444' : '#D1D5DB', // Fixed visibility
                        monthTextColor: colors.text,
                        arrowColor: colors.primary,
                        textDayFontWeight: '500',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: '600',
                        textDayFontSize: 14,
                        textMonthFontSize: 16,
                        textDayHeaderFontSize: 12
                    }}
                    markedDates={markedDates}
                    onDayPress={(day: any) => {
                        // Navigate to Logs screen with date filter
                        router.push({
                            pathname: '/(tabs)/logs',
                            params: { date: day.dateString }
                        });
                    }}
                    enableSwipeMonths={true}
                    hideExtraDays={true}
                    style={styles.calendar}
                />
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 16,
        marginBottom: 20,
    },
    grid: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'space-between'
    },
    card: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        minHeight: 110,
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        gap: 8,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 4,
    },
    subValue: {
        fontSize: 12,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    seeAll: {
        fontSize: 12,
        fontWeight: '600',
    },
    calendarContainer: {
        marginTop: 4,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 3,
    },
    calendar: {
        borderRadius: 16,
    }
});
