import { Colors } from '@/constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
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
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Recent Activity</Text>
            {trades.length === 0 ? (
                <Text style={styles.emptyText}>No recent trades found.</Text>
            ) : (
                trades.map((trade, index) => (
                    <View key={index} style={styles.item}>
                        <View style={styles.iconWrapper}>
                            <View style={[styles.icon, { backgroundColor: trade.direction === 'LONG' ? 'rgba(0,200,5,0.1)' : 'rgba(255,59,48,0.1)' }]}>
                                <FontAwesome5
                                    name={trade.direction === 'LONG' ? "arrow-up" : "arrow-down"}
                                    size={14}
                                    color={trade.direction === 'LONG' ? Colors.professional.success : Colors.professional.danger}
                                />
                            </View>
                        </View>
                        <View style={styles.info}>
                            <Text style={styles.ticker}>{trade.ticker}</Text>
                            <Text style={styles.date}>{new Date(trade.entryDate).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.amountWrapper}>
                            <Text style={[styles.amount, { color: trade.pl >= 0 ? Colors.professional.success : Colors.professional.danger }]}>
                                {trade.pl >= 0 ? '+' : ''}${trade.pl.toFixed(2)}
                            </Text>
                            <Text style={[styles.status, { color: trade.status === 'WIN' ? Colors.professional.success : (trade.status === 'LOSS' ? Colors.professional.danger : Colors.professional.warning) }]}>
                                {trade.status}
                            </Text>
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
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.professional.text,
        marginBottom: 12,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.professional.card,
        padding: 20,
        borderRadius: 20, // Softer
        marginBottom: 12, // More spacing
        borderWidth: 1,
        borderColor: Colors.professional.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    iconWrapper: {
        marginRight: 12,
    },
    icon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
    },
    ticker: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.professional.text,
    },
    date: {
        fontSize: 12,
        color: Colors.professional.textMuted,
    },
    amountWrapper: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    status: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    emptyText: {
        color: Colors.professional.textMuted,
        fontStyle: 'italic',
    }
});
