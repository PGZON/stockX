import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TradeDetails() {
    const { id } = useLocalSearchParams<{ id: Id<"trades"> }>();
    const router = useRouter();
    const trade = useQuery(api.trades.getTrade, { id: id! });
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);



    if (!trade) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
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
            const result = await FileSystem.downloadAsync(
                trade.imageUrl,
                FileSystem.documentDirectory + fileName
            );

            await Sharing.shareAsync(result.uri);
        } catch (e) {
            console.error(e);
            alert('Failed to download image');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.professional.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{trade.ticker}</Text>

                {trade.imageUrl ? (
                    <TouchableOpacity onPress={downloadImage} style={styles.iconBtn}>
                        <Ionicons name="download-outline" size={24} color={Colors.professional.primary} />
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
                    borderColor: trade.status === 'WIN' ? Colors.professional.success :
                        trade.status === 'LOSS' ? Colors.professional.danger :
                            Colors.professional.warning
                }]}>
                    <Text style={[styles.resultText, {
                        color: trade.status === 'WIN' ? Colors.professional.success :
                            trade.status === 'LOSS' ? Colors.professional.danger :
                                Colors.professional.warning
                    }]}>
                        {trade.status}
                    </Text>
                    <Text style={[styles.plText, {
                        color: (trade.pl || 0) >= 0 ? Colors.professional.success : Colors.professional.danger
                    }]}>
                        {(trade.pl || 0) >= 0 ? '+' : ''}${trade.pl?.toFixed(2)}
                    </Text>
                </View>

                {/* Key Stats Grid */}
                <View style={styles.gridContainer}>
                    <View style={styles.gridItem}>
                        <Text style={styles.label}>Direction</Text>
                        <Text style={[styles.value, { color: trade.direction === 'LONG' ? Colors.professional.success : Colors.professional.danger }]}>
                            {trade.direction}
                        </Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.label}>Quantity</Text>
                        <Text style={styles.value}>{trade.quantity}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.label}>Entry</Text>
                        <Text style={styles.value}>${trade.entryPrice}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.label}>Exit</Text>
                        <Text style={styles.value}>${trade.exitPrice || '-'}</Text>
                    </View>
                </View>

                {/* Date Badge */}
                <View style={styles.dateBadge}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.professional.textMuted} />
                    <Text style={styles.dateText}>
                        {new Date(trade.entryDate).toLocaleDateString(undefined, {
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                    </Text>
                </View>

                {/* Screenshots Gallery */}
                {((trade.imageUrls && trade.imageUrls.length > 0) || trade.imageUrl) ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Chart Screenshots</Text>
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
                                    <Image source={{ uri: url }} style={styles.imagePreview} resizeMode="cover" />
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
                        <Text style={styles.sectionTitle}>Analysis Notes</Text>
                        <View style={styles.noteCard}>
                            <Text style={styles.noteText}>{trade.notes}</Text>
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
        backgroundColor: Colors.professional.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.professional.background,
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
        backgroundColor: Colors.professional.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.professional.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.professional.text,
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
        backgroundColor: Colors.professional.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.professional.border,
    },
    label: {
        fontSize: 12,
        color: Colors.professional.textMuted,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.professional.text,
    },
    dateBadge: {
        flexDirection: 'row',
        alignSelf: 'center',
        gap: 6,
        marginBottom: 30,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: Colors.professional.card,
        borderWidth: 1,
        borderColor: Colors.professional.border,
        alignItems: 'center',
    },
    dateText: {
        color: Colors.professional.textMuted,
        fontSize: 12,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.professional.text,
        marginBottom: 16,
    },
    imagePreview: {
        width: 250,
        height: 250,
        borderRadius: 16,
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: Colors.professional.border,
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
        backgroundColor: Colors.professional.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.professional.border,
    },
    noteText: {
        color: Colors.professional.text,
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
});
