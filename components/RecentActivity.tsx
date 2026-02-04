import { useTheme } from '@/context/ThemeContext';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Trade {
    ticker: string;
    status: string; // WIN, LOSS
    pl: number;
    entryDate: number;
    direction: string;
}

interface RecentActivityProps {
    trades: Trade[];
}

export const RecentActivity = ({ trades }: RecentActivityProps) => {
    const { colors, isDark } = useTheme();

    return (
        <View style={styles.container}>
            {trades.length === 0 ? (
                <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="documents-outline" size={40} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No recent trades found.</Text>
                </View>
            ) : (
                trades.map((trade, index) => (
                    <View key={index} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.leftSection}>
                            <View style={[styles.iconBox, {
                                backgroundColor: trade.direction === 'LONG' ? `${colors.success}15` : `${colors.danger}15`
                            }]}>
                                <FontAwesome5
                                    name={trade.direction === 'LONG' ? "arrow-up" : "arrow-down"}
                                    size={14}
                                    color={trade.direction === 'LONG' ? colors.success : colors.danger}
                                />
                            </View>
                            <View>
                                <Text style={[styles.ticker, { color: colors.text }]}>{trade.ticker}</Text>
                                <Text style={[styles.date, { color: colors.textMuted }]}>
                                    {new Date(trade.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {trade.direction}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.rightSection}>
                            <Text style={[styles.amount, { color: trade.pl >= 0 ? colors.success : colors.text }]}>
                                {trade.pl >= 0 ? '+' : ''}₹{trade.pl.toFixed(2)}
                            </Text>
                            <View style={[styles.statusBadge, {
                                backgroundColor: trade.status === 'WIN' ? `${colors.success}20` : (trade.status === 'LOSS' ? `${colors.danger}20` : `${colors.warning}20`)
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: trade.status === 'WIN' ? colors.success : (trade.status === 'LOSS' ? colors.danger : colors.warning)
                                }]}>
                                    {trade.status}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        gap: 12
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        // Removed heavy shadow for cleaner look, added subtle one
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ticker: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2
    },
    date: {
        fontSize: 12,
        fontWeight: '500'
    },
    rightSection: {
        alignItems: 'flex-end',
        gap: 4
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500'
    }
});
