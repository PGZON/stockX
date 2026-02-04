import { FadeInView } from '@/components/FadeInView';
import { useCurrency } from '@/context/CurrencyContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfitHistory() {
    const { colors, isDark } = useTheme();
    const { currency, toggleCurrency } = useCurrency();
    const trades = useQuery(api.trades.getTrades, {});
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

    const sortedTrades = React.useMemo(() => {
        if (!trades) return [];
        return [...trades].sort((a, b) => {
            const dateA = new Date(a.entryDate).getTime();
            const dateB = new Date(b.entryDate).getTime();
            return sortOrder === 'ASC' ? dateA - dateB : dateB - dateA;
        });
    }, [trades, sortOrder]);

    // Calculate total P/L based on selected currency
    const totalPL = sortedTrades.reduce((acc, curr) => {
        const plValue = currency === 'USD' ? (curr.plUsd || 0) : (curr.plInr || 0);
        return acc + plValue;
    }, 0);

    const currencySymbol = currency === 'USD' ? '$' : '₹';
    const decimals = currency === 'USD' ? 2 : 0;

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const plValue = currency === 'USD' ? (item.plUsd || 0) : (item.plInr || 0);
        const isProfit = plValue >= 0;
        const date = new Date(item.entryDate);

        return (
            <FadeInView delay={index * 50} slideUp>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push({ pathname: "/trade/[id]", params: { id: item._id } })}
                >
                    <LinearGradient
                        colors={isDark ? ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'] : ['#FFFFFF', '#F8FAFC']}
                        style={[styles.card, { borderColor: colors.border }]}
                    >
                        <View style={styles.cardLeft}>
                            <View style={[styles.iconBox, {
                                backgroundColor: isProfit ? `${colors.success}15` : `${colors.danger}15`,
                                borderColor: isProfit ? `${colors.success}30` : `${colors.danger}30`
                            }]}>
                                <Ionicons
                                    name={isProfit ? "arrow-down-outline" : "arrow-up-outline"}
                                    size={20}
                                    color={isProfit ? colors.success : colors.danger}
                                />
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={[styles.ticker, { color: colors.text }]}>{item.ticker}</Text>
                                <Text style={[styles.date, { color: colors.textMuted }]}>
                                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {item.direction}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.cardRight}>
                            <Text style={[styles.amount, { color: isProfit ? colors.success : colors.text }]}>
                                {isProfit ? '+' : '-'}{currencySymbol}{Math.abs(plValue).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: isProfit ? `${colors.success}15` : `${colors.danger}15` }]}>
                                <Text style={[styles.statusText, { color: isProfit ? colors.success : colors.danger }]}>
                                    {isProfit ? 'PROFIT' : 'LOSS'}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </FadeInView>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Background Decorator */}
            {isDark && (
                <View style={styles.darkBgDecorator}>
                    <LinearGradient
                        colors={['rgba(56, 189, 248, 0.1)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 0.6 }}
                    />
                </View>
            )}

            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Transactions</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {/* Currency Toggle */}
                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                            onPress={toggleCurrency}
                        >
                            <Text style={styles.currencyText}>{currency}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                        >
                            <Ionicons
                                name={sortOrder === 'DESC' ? "list" : "list-outline"}
                                size={20}
                                color={colors.text}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Summary Header */}
                <FadeInView style={styles.summaryContainer}>
                    <LinearGradient
                        colors={isDark ? ['#1e3a8a', '#172554'] : ['#EFF6FF', '#DBEAFE']}
                        style={[styles.summaryCard, { borderColor: isDark ? '#3b82f6' : '#BFDBFE' }]}
                    >
                        <View>
                            <Text style={[styles.summaryLabel, { color: isDark ? '#BFDBFE' : '#1e40af' }]}>Total Net P/L</Text>
                            <Text style={[styles.summaryValue, { color: totalPL >= 0 ? (isDark ? '#4ADE80' : '#16A34A') : '#F87171' }]}>
                                {currencySymbol}{totalPL.toLocaleString(undefined, { minimumFractionDigits: decimals })}
                            </Text>
                        </View>
                        <View style={[styles.summaryIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)' }]}>
                            <Ionicons name="wallet" size={24} color={isDark ? '#FFF' : '#2563EB'} />
                        </View>
                    </LinearGradient>
                </FadeInView>

                <FlatList
                    data={sortedTrades}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions found</Text>
                        </View>
                    }
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    darkBgDecorator: {
        position: 'absolute',
        width: '100%',
        height: 300,
        top: 0
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    currencyText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    summaryContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    summaryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    summaryIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        // Subtle Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    cardInfo: {
        gap: 4,
    },
    ticker: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 13,
    },
    cardRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        gap: 16
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500'
    },
});
