import { FadeInView } from '@/components/FadeInView';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnalyticsScreen() {
    const { colors, isDark } = useTheme();
    const statsQuery = useQuery(api.trades.getDashboardStats);
    const loading = statsQuery === undefined;
    const stats = statsQuery || {
        totalPL: 0,
        winRate: 0,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        breakEven: 0,
        chartData: [],
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        bestRun: 0
    };

    const screenWidth = Dimensions.get('window').width;

    const chartConfig = {
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        color: (opacity = 1) => isDark ? `rgba(0, 229, 255, ${opacity})` : `rgba(0, 122, 255, ${opacity})`,
        labelColor: (opacity = 1) => colors.textMuted,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: colors.primary
        },
        propsForLabels: {
            fontSize: 10,
        }
    };

    // Prepare line chart data (Cumulative P/L)
    const lineChartData = useMemo(() => {
        if (!stats.chartData || stats.chartData.length === 0) return null;

        let cumulative = 0;
        const data = stats.chartData.map(d => {
            cumulative += d.value;
            return cumulative;
        });

        const slicedData = data.slice(-10);
        const labels = stats.chartData.slice(-10).map(d => d.label);

        return {
            labels: labels,
            datasets: [{ data: slicedData }]
        };

    }, [stats.chartData]);

    const pieChartData = [
        {
            name: "Wins",
            population: stats.wins,
            color: colors.success,
            legendFontColor: colors.text,
            legendFontSize: 12
        },
        {
            name: "Losses",
            population: stats.losses,
            color: colors.danger,
            legendFontColor: colors.text,
            legendFontSize: 12
        },
        {
            name: "Break Even",
            population: stats.breakEven || 0,
            color: colors.warning,
            legendFontColor: colors.text,
            legendFontSize: 12
        }
    ];

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text, textAlign: 'center', marginTop: 20 }}>Loading Analytics...</Text>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>Analytics Overview</Text>

                <FadeInView delay={0} animateOnFocus slideUp>
                    {/* Performance Chart */}
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.textMuted }]}>Cumulative P/L ({'₹'})</Text>
                        {lineChartData ? (
                            <LineChart
                                data={lineChartData}
                                width={screenWidth - 40}
                                height={220}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                                yAxisLabel="₹"
                            />
                        ) : (
                            <Text style={[styles.noData, { color: colors.textMuted }]}>Not enough data for chart</Text>
                        )}
                    </View>
                </FadeInView>

                <FadeInView delay={150} animateOnFocus slideUp>
                    {/* Win/Loss Distribution */}
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.textMuted }]}>Win / Loss Ratio</Text>
                        <PieChart
                            data={pieChartData}
                            width={screenWidth - 40}
                            height={200}
                            chartConfig={chartConfig}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[10, 0]}
                            absolute
                        />
                    </View>
                </FadeInView>

                {/* Additional Stats Grid */}
                <FadeInView delay={300} animateOnFocus slideUp>
                    <View style={styles.grid}>
                        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Profit Factor</Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>{stats.profitFactor.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Avg Win</Text>
                            <Text style={[styles.statValue, { color: colors.success }]}>₹{stats.avgWin.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Avg Loss</Text>
                            <Text style={[styles.statValue, { color: colors.danger }]}>₹{stats.avgLoss.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Best Run</Text>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.bestRun}</Text>
                        </View>
                    </View>
                </FadeInView>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        gap: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    noData: {
        marginVertical: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statBox: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    }
});
