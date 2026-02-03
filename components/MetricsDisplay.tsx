import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

interface MetricsProps {
    wins: number;
    losses: number;
    totalTrades: number;
    avgWin: number;
    avgLoss: number;
    bestRun: number;
    trades?: any[]; // Pass trades to calculate marked dates
}

export const MetricsDisplay = ({ wins, losses, totalTrades, avgWin, avgLoss, bestRun, trades = [] }: MetricsProps) => {

    const markedDates = useMemo(() => {
        const marks: any = {};
        trades.forEach((t: any) => {
            const date = new Date(t.entryDate).toISOString().split('T')[0];
            if (!marks[date]) {
                marks[date] = {
                    marked: true,
                    dotColor: t.pl >= 0 ? Colors.professional.success : Colors.professional.danger,
                };
            } else {
                // If marks already exist, prioritize dot color (e.g. if mixed, maybe show warning or just keep one)
                // Keeping simple: if any trade on that day is a loss, dot is red, else green
                if (t.pl < 0) marks[date].dotColor = Colors.professional.danger;
            }
        });
        return marks;
    }, [trades]);

    return (
        <View style={styles.container}>
            {/* Top Row Stats */}
            <View style={styles.row}>
                <LinearGradient colors={['#1A1C24', '#15171e']} style={styles.card}>
                    <View style={styles.iconBox}>
                        <Ionicons name="trophy" size={20} color="#FFD700" />
                    </View>
                    <Text style={styles.label}>Best Run</Text>
                    <Text style={styles.value}>{bestRun} Wins</Text>
                </LinearGradient>

                <LinearGradient colors={['#1A1C24', '#15171e']} style={styles.card}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 200, 5, 0.1)' }]}>
                        <Ionicons name="trending-up" size={20} color={Colors.professional.success} />
                    </View>
                    <Text style={styles.label}>Avg Win</Text>
                    <Text style={[styles.value, { color: Colors.professional.success }]}>₹{avgWin.toFixed(2)}</Text>
                </LinearGradient>
            </View>

            <View style={styles.row}>
                <LinearGradient colors={['#1A1C24', '#15171e']} style={styles.card}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                        <Ionicons name="trending-down" size={20} color={Colors.professional.danger} />
                    </View>
                    <Text style={styles.label}>Avg Loss</Text>
                    <Text style={[styles.value, { color: Colors.professional.danger }]}>₹{avgLoss.toFixed(2)}</Text>
                </LinearGradient>
            </View>

            {/* Archive Calendar */}
            <View style={styles.calendarContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Archive</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/logs')}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.seeAll}>View Lists</Text>
                            <Ionicons name="chevron-forward" size={14} color={Colors.professional.primary} />
                        </View>
                    </TouchableOpacity>
                </View>

                <Calendar
                    theme={{
                        backgroundColor: 'transparent',
                        calendarBackground: 'transparent',
                        textSectionTitleColor: Colors.professional.textMuted,
                        selectedDayBackgroundColor: Colors.professional.primary,
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: Colors.professional.primary,
                        dayTextColor: Colors.professional.text,
                        textDisabledColor: '#333',
                        monthTextColor: Colors.professional.text,
                        arrowColor: Colors.professional.primary,
                        textDayFontWeight: '600',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: '600',
                        textDayFontSize: 12,
                        textMonthFontSize: 16,
                        textDayHeaderFontSize: 12
                    }}
                    markedDates={markedDates}
                    onDayPress={(day: any) => {
                        // Optional: Navigate to logs filtered by this date
                        console.log('selected day', day);
                    }}
                    enableSwipeMonths={true}
                    hideExtraDays={true}
                    style={styles.calendar}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 12,
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    card: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.professional.border,
        justifyContent: 'center',
        backgroundColor: Colors.professional.card
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 12,
        color: Colors.professional.textMuted,
        marginBottom: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.professional.text,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.professional.text,
    },
    seeAll: {
        color: Colors.professional.primary,
        fontSize: 12,
        fontWeight: '600',
        marginRight: 4
    },
    calendarContainer: {
        marginTop: 12,
        backgroundColor: Colors.professional.card,
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.professional.border,
    },
    calendar: {
        borderRadius: 16,
    }
});
