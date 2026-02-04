import { Skeleton } from '@/components/Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import * as FileSystem from 'expo-file-system';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TradeDetails() {
    const { id } = useLocalSearchParams<{ id: Id<"trades"> }>();
    const router = useRouter();
    const trade = useQuery(api.trades.getTrade, { id: id! });
    const { colors, isDark } = useTheme();
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    if (!trade) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={[styles.header, { borderBottomWidth: 0 }]}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={100} height={24} />
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.content}>
                    <Skeleton width="100%" height={120} borderRadius={20} style={{ marginBottom: 24 }} />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                        <Skeleton width="48%" height={80} borderRadius={16} />
                        <Skeleton width="48%" height={80} borderRadius={16} />
                        <Skeleton width="48%" height={80} borderRadius={16} />
                        <Skeleton width="48%" height={80} borderRadius={16} />
                    </View>
                    <Skeleton width="100%" height={200} borderRadius={16} />
                </View>
            </SafeAreaView>
        );
    }

    const downloadImage = async () => {
        if (!trade.imageUrl) return;

        try {
            const fileName = `trade_${trade.ticker}_${id}.jpg`;
            // Download to a temporary location
            const fileUri = `${(FileSystem as any).cacheDirectory}${fileName}`;
            const result = await FileSystem.downloadAsync(trade.imageUrl, fileUri);

            await Sharing.shareAsync(result.uri);
        } catch (e) {
            console.error(e);
            alert('Failed to download image');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{trade.ticker}</Text>

                {trade.imageUrl ? (
                    <TouchableOpacity onPress={downloadImage} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="download-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Result Banner */}
                <View style={[styles.resultBanner, {
                    backgroundColor: trade.status === 'WIN' ? 'rgba(0, 200, 5, 0.15)' :
                        trade.status === 'LOSS' ? 'rgba(255, 59, 48, 0.15)' :
                            'rgba(255, 215, 0, 0.15)',
                    borderColor: trade.status === 'WIN' ? colors.success :
                        trade.status === 'LOSS' ? colors.danger :
                            colors.warning
                }]}>
                    <Text style={[styles.resultText, {
                        color: trade.status === 'WIN' ? colors.success :
                            trade.status === 'LOSS' ? colors.danger :
                                colors.warning
                    }]}>
                        {trade.status}
                    </Text>
                    <Text style={[styles.plText, {
                        color: trade.status === 'OPEN' ? colors.warning : ((trade.plUsd || 0) >= 0 ? colors.success : colors.danger)
                    }]}>
                        {trade.status === 'OPEN' && trade.rewardAmount
                            ? `~$${trade.rewardAmount?.toFixed(2)}`
                            : `${(trade.plUsd || 0) >= 0 ? '+' : ''}$${(trade.plUsd || 0).toFixed(2)}`
                        }
                    </Text>
                </View>

                {/* Key Stats Grid */}
                <View style={styles.gridContainer}>
                    <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>Direction</Text>
                        <Text style={[styles.value, { color: trade.direction === 'LONG' ? colors.success : colors.danger }]}>
                            {trade.direction}
                        </Text>
                    </View>
                    <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>Quantity</Text>
                        <Text style={[styles.value, { color: colors.text }]}>{trade.quantity}</Text>
                    </View>
                    <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>Entry</Text>
                        <Text style={[styles.value, { color: colors.text }]}>${trade.entryPrice}</Text>
                    </View>
                    <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>Target (TP)</Text>
                        <Text style={[styles.value, { color: colors.text }]}>
                            {trade.takeProfit ? `$${trade.takeProfit}` : '-'}
                        </Text>
                    </View>
                </View>

                {/* Date Badge */}
                <View style={[styles.dateBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.dateText, { color: colors.textMuted }]}>
                        {new Date(trade.entryDate).toLocaleDateString(undefined, {
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                    </Text>
                </View>

                {/* Trade Financial Details */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial Details</Text>

                    {/* P/L Section */}
                    <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.detailHeader}>
                            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                            <Text style={[styles.detailCardTitle, { color: colors.text }]}>Profit & Loss</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>USD</Text>
                            <Text style={[styles.detailValue, {
                                color: (trade.plUsd || 0) >= 0 ? colors.success : colors.danger,
                                fontWeight: 'bold',
                                fontSize: 20
                            }]}>
                                {(trade.plUsd || 0) >= 0 ? '+' : ''}${(trade.plUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>INR</Text>
                            <Text style={[styles.detailValue, {
                                color: (trade.plInr || 0) >= 0 ? colors.success : colors.danger
                            }]}>
                                {(trade.plInr || 0) >= 0 ? '+' : ''}₹{(trade.plInr || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </Text>
                        </View>
                    </View>

                    {/* Risk & Reward Section */}
                    <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
                        <View style={styles.detailHeader}>
                            <Ionicons name="analytics-outline" size={20} color={colors.primary} />
                            <Text style={[styles.detailCardTitle, { color: colors.text }]}>Risk & Reward</Text>
                        </View>

                        {/* Reward */}
                        <View style={[styles.rrBlock, { backgroundColor: 'rgba(74, 222, 128, 0.1)', borderRadius: 12, padding: 12, marginBottom: 8 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                <Ionicons name="trending-up" size={16} color={colors.success} />
                                <Text style={[styles.rrLabel, { color: colors.success, marginLeft: 6 }]}>Potential Reward (TP)</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>USD</Text>
                                <Text style={[styles.detailValue, { color: colors.success, fontWeight: 'bold' }]}>
                                    +${(trade.rewardAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>INR</Text>
                                <Text style={[styles.detailValue, { color: colors.success }]}>
                                    +₹{(trade.rewardAmountInr || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </Text>
                            </View>
                        </View>

                        {/* Risk */}
                        <View style={[styles.rrBlock, { backgroundColor: 'rgba(248, 113, 113, 0.1)', borderRadius: 12, padding: 12 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                <Ionicons name="trending-down" size={16} color={colors.danger} />
                                <Text style={[styles.rrLabel, { color: colors.danger, marginLeft: 6 }]}>Potential Risk (SL)</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>USD</Text>
                                <Text style={[styles.detailValue, { color: colors.danger, fontWeight: 'bold' }]}>
                                    -${(trade.riskAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>INR</Text>
                                <Text style={[styles.detailValue, { color: colors.danger }]}>
                                    -₹{(trade.riskAmountInr || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Risk-Reward Ratio */}
                    {trade.riskReward && (
                        <View style={[styles.rrRatioCard, { backgroundColor: colors.primary, marginTop: 12 }]}>
                            <Text style={styles.rrRatioLabel}>Risk : Reward Ratio</Text>
                            <Text style={styles.rrRatioValue}>1 : {trade.riskReward.toFixed(2)}</Text>
                        </View>
                    )}

                    {/* Stop Loss & Take Profit Prices */}
                    <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
                        <View style={styles.detailHeader}>
                            <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
                            <Text style={[styles.detailCardTitle, { color: colors.text }]}>Price Levels</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Entry Price</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                                {trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                            </Text>
                        </View>
                        {trade.stopLoss && (
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.danger }]}>Stop Loss</Text>
                                <Text style={[styles.detailValue, { color: colors.danger }]}>
                                    {trade.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                                </Text>
                            </View>
                        )}
                        {trade.takeProfit && (
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.success }]}>Take Profit</Text>
                                <Text style={[styles.detailValue, { color: colors.success }]}>
                                    {trade.takeProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                                </Text>
                            </View>
                        )}
                        {trade.exchangeRate && (
                            <View style={[styles.detailRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }]}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Exchange Rate</Text>
                                <Text style={[styles.detailValue, { color: colors.textMuted }]}>
                                    ₹{trade.exchangeRate.toFixed(2)} / USD
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Screenshots Gallery */}
                {((trade.imageUrls && trade.imageUrls.length > 0) || trade.imageUrl) ? (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Chart Screenshots</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                            {(trade.imageUrls && trade.imageUrls.length > 0 ? trade.imageUrls : [trade.imageUrl!]).map((url, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        setPreviewImage(url);
                                        setImageModalVisible(true);
                                    }}
                                    activeOpacity={0.9}
                                >
                                    <Image source={{ uri: url }} style={[styles.imagePreview, { borderColor: colors.border }]} resizeMode="cover" />
                                    <View style={styles.zoomOverlay}>
                                        <Ionicons name="expand" size={20} color="#FFF" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                ) : null}

                {/* Notes */}
                {trade.notes && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Analysis Notes</Text>
                        <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.noteText, { color: colors.text }]}>{trade.notes}</Text>
                        </View>
                    </View>
                )}

            </ScrollView>

            {/* Full Screen Image Modal */}
            <Modal visible={imageModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.closeModalBtn}
                        onPress={() => setImageModalVisible(false)}
                    >
                        <Ionicons name="close" size={30} color="#FFF" />
                    </TouchableOpacity>

                    {previewImage && (
                        <Image
                            source={{ uri: previewImage }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    resultBanner: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 24,
    },
    resultText: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 8,
    },
    plText: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    gridItem: {
        width: '48%', // roughly half
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    label: {
        fontSize: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    dateBadge: {
        flexDirection: 'row',
        alignSelf: 'center',
        gap: 6,
        marginBottom: 30,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    imagePreview: {
        width: 250,
        height: 250,
        borderRadius: 16,
        backgroundColor: '#000',
        borderWidth: 1,
    },
    zoomOverlay: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 8,
        padding: 6,
    },
    noteCard: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
    },
    noteText: {
        fontSize: 16,
        lineHeight: 24,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    closeModalBtn: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    // Financial Detail Styles
    detailCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    detailCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    rrBlock: {
        // Styles applied inline
    },
    rrLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    rrRatioCard: {
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    rrRatioLabel: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        opacity: 0.9,
    },
    rrRatioValue: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
