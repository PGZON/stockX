import { Colors } from '@/constants/Colors';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts'; // Ensure installed

interface ChartProps {
    data: { value: number; label: string }[];
}

export const TradeChart = ({ data }: ChartProps) => {
    if (!data || data.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>No data available</Text>
            </View>
        );
    }

    // Transform data for the chart - we need positive values for bar height usually, or handle negative
    // Gifted charts handles negative values well for LineChart.

    const chartData = data.map(item => ({
        value: item.value,
        label: item.label,
        dataPointText: String(item.value),
        textColor: item.value >= 0 ? Colors.professional.success : Colors.professional.danger,
        dataPointColor: item.value >= 0 ? Colors.professional.success : Colors.professional.danger,
    }));

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Performance</Text>
            <View style={styles.chartWrapper}>
                <LineChart
                    data={chartData}
                    color={Colors.professional.primary}
                    thickness={3}
                    dataPointsColor={Colors.professional.primary}
                    startFillColor={Colors.professional.chartGradientStart}
                    endFillColor={Colors.professional.chartGradientEnd}
                    startOpacity={0.9}
                    endOpacity={0.2}
                    initialSpacing={20}
                    noOfSections={4}
                    yAxisTextStyle={{ color: Colors.professional.textMuted }}
                    xAxisLabelTextStyle={{ color: Colors.professional.textMuted, fontSize: 10 }}
                    rulesColor="rgba(255,255,255,0.1)"
                    hideRules={false}
                    yAxisColor="transparent"
                    xAxisColor="transparent"
                    pointerConfig={{
                        pointerStripHeight: 160,
                        pointerStripColor: 'gray',
                        pointerStripWidth: 2,
                        pointerColor: 'lightgray',
                        radius: 6,
                        pointerLabelWidth: 100,
                        pointerLabelHeight: 90,
                        activatePointersOnLongPress: true,
                        autoAdjustPointerLabelPosition: false,
                        pointerLabelComponent: (items: {
                            date: ReactNode; value: string;
                        }[]) => {
                            return (
                                <View
                                    style={{
                                        height: 90,
                                        width: 100,
                                        justifyContent: 'center',
                                        marginTop: -30,
                                        marginLeft: -40,
                                    }}>
                                    <Text style={{ color: 'white', fontSize: 14, marginBottom: 6, textAlign: 'center' }}>
                                        {items[0].date}
                                    </Text>

                                    <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'white' }}>
                                        <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>
                                            {'₹' + items[0].value + '.0'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        },
                    }}
                    areaChart
                    curved
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.professional.card,
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.professional.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.professional.text,
        marginBottom: 16,
    },
    chartWrapper: {
        alignItems: 'center',
        overflow: 'hidden', // Clip overflow
    },
    emptyText: {
        color: Colors.professional.textMuted,
        textAlign: 'center',
        padding: 20,
    }
});
