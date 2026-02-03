import { Colors } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import XLSX from 'xlsx';

import { router } from 'expo-router';
import { TextInput } from 'react-native';

import { Skeleton } from '@/components/Skeleton';
// ... imports

export default function LogsScreen() {
    const tradesQuery = useQuery(api.trades.getTrades, {});
    const loading = tradesQuery === undefined;
    const trades = tradesQuery || [];

    const [exporting, setExporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');

    const filteredTrades = trades.filter(t => {
        const matchesSearch = t.ticker.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const generateHtml = () => {
        let rows = trades.map(t => `
      <tr>
        <td>${new Date(t.entryDate).toLocaleDateString()}</td>
        <td>${t.ticker}</td>
        <td>${t.direction}</td>
        <td>₹{t.entryPrice}</td>
        <td>₹{t.exitPrice || '-'}</td>
        <td style="color: ${t.pl && t.pl >= 0 ? 'green' : 'red'}">${t.pl ? '₹' + t.pl.toFixed(2) : '-'}</td>
      </tr>
    `).join('');

        return `
      <html>
        <head>
          <style>
            body { font-family: Helvetica, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Trade Log</h1>
          <table>
            <tr>
              <th>Date</th>
              <th>Ticker</th>
              <th>Direction</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>P/L</th>
            </tr>
            ${rows}
          </table>
        </body>
      </html>
    `;
    };

    const exportPDF = async () => {
        try {
            setExporting(true);
            const html = generateHtml();
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert("Export Error", "Failed to export PDF");
            console.error(error);
        } finally {
            setExporting(false);
        }
    };

    const exportExcel = async () => {
        try {
            setExporting(true);
            const ws = XLSX.utils.json_to_sheet(trades.map(t => ({
                Date: new Date(t.entryDate).toLocaleDateString(),
                Ticker: t.ticker,
                Direction: t.direction,
                Status: t.status,
                Entry: t.entryPrice,
                Exit: t.exitPrice,
                Quantity: t.quantity,
                PL: t.pl
            })));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Trades");

            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            const uri = ((FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory) + 'trades.xlsx';

            await FileSystem.writeAsStringAsync(uri, wbout, {
                encoding: "base64"
            });

            await Sharing.shareAsync(uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Export Trade Data'
            });
        } catch (error) {
            Alert.alert("Export Error", "Failed to export Excel");
            console.error(error);
        } finally {
            setExporting(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity onPress={() => router.push({ pathname: "/trade/[id]", params: { id: item._id } })} activeOpacity={0.7}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.badge, { backgroundColor: item.direction === 'LONG' ? 'rgba(0,200,5,0.2)' : 'rgba(255,59,48,0.2)' }]}>
                            <Text style={[styles.badgeText, { color: item.direction === 'LONG' ? Colors.professional.success : Colors.professional.danger }]}>
                                {item.direction}
                            </Text>
                        </View>
                        <Text style={styles.ticker}>{item.ticker}</Text>
                    </View>
                    <Text style={styles.date}>{new Date(item.entryDate).toLocaleDateString()}</Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>Entry</Text>
                        <Text style={styles.statValue}>₹{item.entryPrice}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>Exit</Text>
                        <Text style={styles.statValue}>₹{item.exitPrice || '-'}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>P/L</Text>
                        <Text style={[styles.statValue, { color: item.pl >= 0 ? Colors.professional.success : Colors.professional.danger }]}>
                            {item.pl ? '₹' + item.pl.toFixed(2) : '-'}
                        </Text>
                    </View>
                </View>

                {item.status && (
                    <View style={[styles.statusTag, {
                        backgroundColor: item.status === 'WIN' ? Colors.professional.success : (item.status === 'LOSS' ? Colors.professional.danger : Colors.professional.warning)
                    }]}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Trade Logs</Text>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={exportPDF} style={styles.iconBtn}>
                        <Ionicons name="document-text" size={24} color={Colors.professional.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={exportExcel} style={styles.iconBtn}>
                        <Ionicons name="grid" size={24} color={Colors.professional.success} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.controls}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={Colors.professional.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search ticker..."
                        placeholderTextColor={Colors.professional.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <View style={styles.filterRow}>
                    {(['ALL', 'WIN', 'LOSS'] as const).map(status => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setFilterStatus(status)}
                            style={[
                                styles.filterChip,
                                filterStatus === status && styles.filterChipActive,
                                status === 'WIN' && filterStatus === status && { backgroundColor: Colors.professional.success },
                                status === 'LOSS' && filterStatus === status && { backgroundColor: Colors.professional.danger }
                            ]}
                        >
                            <Text style={[
                                styles.filterText,
                                filterStatus === status && styles.filterTextActive
                            ]}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <FlatList
                data={loading ? Array(5).fill({}) : filteredTrades}
                keyExtractor={(item, index) => loading ? `skeleton-${index}` : item._id}
                renderItem={loading ? () => (
                    <View style={[styles.card, { opacity: 1 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <Skeleton width={50} height={20} borderRadius={6} />
                                <Skeleton width={60} height={20} />
                            </View>
                            <Skeleton width={80} height={16} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Skeleton width={80} height={30} />
                            <Skeleton width={80} height={30} />
                            <Skeleton width={80} height={30} />
                        </View>
                    </View>
                ) : renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading ? <Text style={styles.emptyText}>No trades recorded yet.</Text> : null
                }
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.professional.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.professional.border,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.professional.text,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    controls: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        paddingTop: 10,
        gap: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.professional.card,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 44,
        borderWidth: 1,
        borderColor: Colors.professional.border,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        color: Colors.professional.text,
        fontSize: 16,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.professional.card,
        borderWidth: 1,
        borderColor: Colors.professional.border,
    },
    filterChipActive: {
        backgroundColor: Colors.professional.primary,
        borderColor: 'transparent',
    },
    filterText: {
        fontSize: 12,
        color: Colors.professional.textMuted,
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#000', // Text color for active chip (usually dark for contrast on primary)
        fontWeight: 'bold',
    },
    iconBtn: {
        padding: 8,
        backgroundColor: Colors.professional.card,
        borderRadius: 8,
    },
    listContent: {
        padding: 20,
        gap: 12,
    },
    card: {
        backgroundColor: Colors.professional.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.professional.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    ticker: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.professional.text,
    },
    date: {
        fontSize: 12,
        color: Colors.professional.textMuted,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    stat: {
        alignItems: 'flex-start',
    },
    statLabel: {
        fontSize: 10,
        color: Colors.professional.textMuted,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.professional.text,
        marginTop: 4,
    },
    statusTag: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
    emptyText: {
        color: Colors.professional.textMuted,
        textAlign: 'center',
        marginTop: 40,
    }
});
