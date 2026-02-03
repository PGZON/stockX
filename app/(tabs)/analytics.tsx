import { Colors } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnalyticsScreen() {
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
        backgroundGradientFrom: Colors.professional.card,
        backgroundGradientTo: Colors.professional.card,
        color: (opacity = 1) => `rgba(0, 229, 255, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: Colors.professional.primary
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

        // Take last 10 points to avoid overcrowding
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
            color: Colors.professional.success,
            legendFontColor: Colors.professional.text,
            legendFontSize: 12
        },
        {
            name: "Losses",
            population: stats.losses,
            color: Colors.professional.danger,
            legendFontColor: Colors.professional.text,
            legendFontSize: 12
        },
        {
            name: "Break Even",
            population: stats.breakEven || 0, // Ensure breakEven comes from backend or default to 0
            color: Colors.professional.warning,
            legendFontColor: Colors.professional.text,
            legendFontSize: 12
        }
    ];

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{ color: 'white', textAlign: 'center', marginTop: 20 }}>Loading Analytics...</Text>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Analytics Overview</Text>

                {/* Performance Chart */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Cumulative P/L ({'₹'})</Text>
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
                        <Text style={styles.noData}>Not enough data for chart</Text>
                    )}
                </View>

                {/* Win/Loss Distribution */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Win / Loss Ratio</Text>
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

                {/* Additional Stats Grid */}
                <View style={styles.grid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Profit Factor</Text>
                        <Text style={styles.statValue}>{stats.profitFactor.toFixed(2)}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Avg Win</Text>
                        <Text style={[styles.statValue, { color: Colors.professional.success }]}>₹{stats.avgWin.toFixed(2)}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Avg Loss</Text>
                        <Text style={[styles.statValue, { color: Colors.professional.danger }]}>₹{stats.avgLoss.toFixed(2)}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Best Run</Text>
                        <Text style={[styles.statValue, { color: Colors.professional.primary }]}>{stats.bestRun}</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.professional.background,
    },
    content: {
        padding: 20,
        gap: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.professional.text,
        marginBottom: 10,
    },
    card: {
        backgroundColor: Colors.professional.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.professional.border,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.professional.textMuted,
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    noData: {
        color: Colors.professional.textMuted,
        marginVertical: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statBox: {
        width: '48%',
        backgroundColor: Colors.professional.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.professional.border,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.professional.textMuted,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.professional.text,
    }
});
