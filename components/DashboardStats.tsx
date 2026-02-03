import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DashboardStatsProps {
    totalPL: number;
    winRate: number;
    totalTrades: number;
    wins: number;
    losses: number;
}

export const DashboardStats = ({ totalPL, winRate, totalTrades, wins, losses }: DashboardStatsProps) => {
    return (
        <View style={styles.container}>
            {/* Total Profit/Loss Card */}
            <View style={[styles.card, styles.mainCard]}>
                <Text style={styles.label}>Net P/L</Text>
                <Text style={[styles.value, { color: totalPL >= 0 ? Colors.professional.success : Colors.professional.danger }]}>
                    ${totalPL.toFixed(2)}
                </Text>
                <Text style={styles.subtext}>{totalTrades} Total Trades</Text>
            </View>

            <View style={styles.row}>
                {/* Win Rate Card */}
                <View style={styles.smallCard}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="pie-chart" size={20} color={Colors.professional.primary} />
                    </View>
                    <Text style={styles.smallLabel}>Win Rate</Text>
                    <Text style={styles.smallValue}>{winRate.toFixed(1)}%</Text>
                    <Text style={styles.activityText}>{wins}W - {losses}L</Text>
                </View>

                {/* Other Stat (Avg Risk/Reward or something else, using placeholder for now) */}
                <View style={styles.smallCard}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="trending-up" size={20} color={Colors.professional.warning} />
                    </View>
                    <Text style={styles.smallLabel}>Profit Factor</Text>
                    <Text style={styles.smallValue}>--</Text>
                    <Text style={styles.activityText}>Target: 2.0</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 12,
        marginBottom: 20,
    },
    card: {
        backgroundColor: Colors.professional.card,
        borderRadius: 24, // Softer corners
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.professional.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    mainCard: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    smallCard: {
        flex: 1,
        backgroundColor: Colors.professional.card,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.professional.border,
        alignItems: 'flex-start',
    },
    label: {
        fontSize: 14,
        color: Colors.professional.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    value: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    subtext: {
        marginTop: 8,
        color: Colors.professional.textMuted,
        fontSize: 12,
    },
    smallLabel: {
        fontSize: 12,
        color: Colors.professional.textMuted,
        marginBottom: 4,
        marginTop: 8,
    },
    smallValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.professional.text,
    },
    iconContainer: {
        width: 32,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityText: {
        fontSize: 11,
        color: Colors.professional.textMuted,
        marginTop: 2,
    }
});
