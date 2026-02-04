import { FadeInView } from '@/components/FadeInView';
import { Skeleton } from '@/components/Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LogsScreen() {
    const { colors, theme } = useTheme();
    const tradesQuery = useQuery(api.trades.getTrades, {});
    const loading = tradesQuery === undefined;
    const trades = tradesQuery || [];
    const params = useLocalSearchParams();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
    const [dateFilter, setDateFilter] = useState<string | null>(null);

    // Initial Date Filter from Params
    useEffect(() => {
        if (params.date) {
            setDateFilter(params.date as string);
        }
    }, [params.date]);

    const filteredTrades = trades.filter(t => {
        const matchesSearch = t.ticker.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;

        let matchesDate = true;
        if (dateFilter) {
            const tradeDate = new Date(t.entryDate).toISOString().split('T')[0];
            matchesDate = tradeDate === dateFilter;
        }

        return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
        const dateA = new Date(a.entryDate).getTime();
        const dateB = new Date(b.entryDate).getTime();
        return sortOrder === 'ASC' ? dateA - dateB : dateB - dateA;
    });

    const renderItem = ({ item, index }: { item: any; index: number }) => (
        <FadeInView delay={index * 50} slideUp animateOnFocus>
            <TouchableOpacity onPress={() => router.push({ pathname: "/trade/[id]", params: { id: item._id } })} activeOpacity={0.7}>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={[styles.iconBox, {
                                backgroundColor: item.direction === 'LONG' ? `${colors.success}15` : `${colors.danger}15`
                            }]}>
                                <Ionicons
                                    name={item.direction === 'LONG' ? "arrow-up" : "arrow-down"}
                                    size={16}
                                    color={item.direction === 'LONG' ? colors.success : colors.danger}
                                />
                            </View>
                            <View>
                                <Text style={[styles.ticker, { color: colors.text }]}>{item.ticker}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={[styles.date, { color: colors.textMuted }]}>
                                        {new Date(item.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </Text>
                                    <View style={[styles.dot, { backgroundColor: colors.border }]} />
                                    <Text style={[styles.directionText, { color: item.direction === 'LONG' ? colors.success : colors.danger }]}>
                                        {item.direction}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            <Text style={[styles.plText, { color: item.pl >= 0 ? colors.success : colors.danger }]}>
                                {item.pl >= 0 ? '+' : ''}₹{Math.abs(item.pl).toFixed(2)}
                            </Text>
                            <View style={[styles.statusTag, {
                                backgroundColor: item.status === 'WIN' ? `${colors.success}20` : (item.status === 'LOSS' ? `${colors.danger}20` : `${colors.warning}20`)
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: item.status === 'WIN' ? colors.success : (item.status === 'LOSS' ? colors.danger : colors.warning)
                                }]}>{item.status}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.cardBody}>
                        <View style={styles.stat}>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Entry</Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>₹{item.entryPrice}</Text>
                        </View>
                        <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.stat}>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Exit</Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>{item.exitPrice ? `₹${item.exitPrice}` : '-'}</Text>
                        </View>
                        <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.stat}>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Qty</Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>{item.quantity}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </FadeInView>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>Trade Logs</Text>
                {dateFilter && (
                    <TouchableOpacity
                        style={[styles.dateFilterBadge, { backgroundColor: colors.primary }]}
                        onPress={() => setDateFilter(null)}
                    >
                        <Text style={styles.dateFilterText}>{dateFilter}</Text>
                        <Ionicons name="close-circle" size={16} color="#FFF" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.controls}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="search" size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search Ticker..."
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.sortBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                    >
                        <Ionicons
                            name={sortOrder === 'DESC' ? "arrow-down" : "arrow-up"}
                            size={20}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.filterRow}>
                    {(['ALL', 'WIN', 'LOSS'] as const).map(status => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setFilterStatus(status)}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                                filterStatus === status && { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
                            ]}
                        >
                            <Text style={[
                                styles.filterText,
                                { color: colors.textMuted },
                                filterStatus === status && { color: colors.primary, fontWeight: 'bold' }
                            ]}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <FlatList
                data={loading ? Array(5).fill({}) : filteredTrades}
                keyExtractor={(item, index) => loading ? `skeleton-${index}` : item._id}
                renderItem={loading ? ({ index }) => (
                    <FadeInView delay={index * 50} animateOnFocus>
                        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <Skeleton width={40} height={40} borderRadius={12} />
                                    <View style={{ gap: 6 }}>
                                        <Skeleton width={80} height={20} />
                                        <Skeleton width={60} height={14} />
                                    </View>
                                </View>
                                <Skeleton width={50} height={20} />
                            </View>
                            <Skeleton width="100%" height={40} borderRadius={8} />
                        </View>
                    </FadeInView>
                ) : renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading ? (
                        <FadeInView delay={200} animateOnFocus>
                            <View style={styles.emptyContainer}>
                                <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No trades found.</Text>
                            </View>
                        </FadeInView>
                    ) : null
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                onPress={() => router.push('/modal')}
                activeOpacity={0.9}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    dateFilterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    dateFilterText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600'
    },
    controls: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 10,
        gap: 16,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 16, // Softer
        height: 48,
        borderWidth: 1,
        gap: 10,
    },
    sortBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 10,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        padding: 20,
        gap: 16,
        paddingBottom: 100
    },
    card: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    ticker: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 12,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    directionText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    plText: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 16
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    verticalDivider: {
        width: 1,
        height: '100%',
    },
    statLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
        marginBottom: 4
    },
    statValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 12
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500'
    }
});
