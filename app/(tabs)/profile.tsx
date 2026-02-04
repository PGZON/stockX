import { FadeInView } from '@/components/FadeInView';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useConvex } from 'convex/react';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const convex = useConvex();
    const { colors, theme, setTheme, isDark } = useTheme();
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(), // Start of current month
        endDate: Date.now(),
    });
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showAbout, setShowAbout] = useState(false);

    const { signOut } = useAuth(); // Get signOut from context

    const onDayPress = (day: any, type: 'start' | 'end') => {
        const timestamp = new Date(day.dateString).getTime();
        if (type === 'start') {
            setDateRange(prev => ({ ...prev, startDate: timestamp }));
            setShowStartCalendar(false);
        } else {
            setDateRange(prev => ({ ...prev, endDate: timestamp }));
            setShowEndCalendar(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await signOut(); // This will clear session and auto-redirect to login
                    }
                }
            ]
        );
    };

    const handleExport = async (format: 'csv' | 'pdf') => {
        try {
            setIsExporting(true);
            const trades = await convex.query(api.trades.getTradesInDateRange, {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate + 86400000,
            });

            if (!trades || trades.length === 0) {
                Alert.alert('No Data', 'No trades found in the selected range.');
                setIsExporting(false);
                return;
            }

            if (format === 'csv') await exportCSV(trades);
            else await exportPDF(trades);

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to export data.');
        } finally {
            setIsExporting(false);
        }
    };

    const exportCSV = async (trades: any[]) => {
        const header = 'Date,Ticker,Type,Entry Price,Exit Price,Quantity,P&L,Status\n';
        const rows = trades.map(t => {
            const date = new Date(t.entryDate).toLocaleDateString();
            return `${date},${t.ticker},${t.direction},${t.entryPrice},${t.exitPrice || ''},${t.quantity},${t.pl || 0},${t.status}`;
        }).join('\n');

        const csvContent = header + rows;
        const startStr = new Date(dateRange.startDate).toISOString().split('T')[0];
        const endStr = new Date(dateRange.endDate).toISOString().split('T')[0];
        const fileName = `trades_${startStr}_to_${endStr}.csv`;

        // @ts-ignore
        const fileUri = (FileSystem.documentDirectory || FileSystem.cacheDirectory) + fileName;

        // @ts-ignore
        await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri);
    };

    const exportPDF = async (trades: any[]) => {
        let totalPL = 0;
        const rowsHtml = trades.map(t => {
            totalPL += (t.pl || 0);
            const isWin = (t.pl || 0) >= 0;
            const plColor = isWin ? '#34C759' : '#FF3B30';
            return `
                <tr>
                    <td>${new Date(t.entryDate).toLocaleDateString()}</td>
                    <td>${t.ticker}</td>
                    <td>${t.direction}</td>
                    <td>₹${t.entryPrice}</td>
                    <td>${t.exitPrice ? '₹' + t.exitPrice : '-'}</td>
                    <td>${t.quantity}</td>
                    <td style="color: ${plColor}">₹${(t.pl || 0).toFixed(2)}</td>
                    <td>${t.status}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 20px; }
                        h1 { color: #333; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .summary { margin-top: 20px; font-size: 18px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>Trade History Report</h1>
                    <p>Range: ${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}</p>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Ticker</th>
                                <th>Direction</th>
                                <th>Entry</th>
                                <th>Exit</th>
                                <th>Qty</th>
                                <th>P&L</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>

                    <div class="summary">
                        Total P&L: <span style="color: ${totalPL >= 0 ? 'green' : 'red'}">₹${totalPL.toFixed(2)}</span>
                    </div>
                </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html });
        const startStr = new Date(dateRange.startDate).toISOString().split('T')[0];
        const endStr = new Date(dateRange.endDate).toISOString().split('T')[0];
        const fileName = `trades_${startStr}_to_${endStr}.pdf`;

        // @ts-ignore
        const newPath = (FileSystem.documentDirectory || FileSystem.cacheDirectory) + fileName;

        // @ts-ignore
        await FileSystem.moveAsync({ from: uri, to: newPath });
        await Sharing.shareAsync(newPath);
    };

    const renderThemeOption = (mode: 'light' | 'dark' | 'system', icon: any, label: string) => (
        <TouchableOpacity
            style={[
                styles.themeBtn,
                { backgroundColor: theme === mode ? colors.primary : colors.card, borderColor: colors.border }
            ]}
            onPress={() => setTheme(mode)}
        >
            <Ionicons name={icon} size={20} color={theme === mode ? '#FFF' : colors.text} />
            <Text style={[styles.themeBtnText, { color: theme === mode ? '#FFF' : colors.text }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Profile & Export</Text>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutHeaderBtn}>
                        <Ionicons name="log-out-outline" size={24} color={colors.danger} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>

                    <FadeInView delay={0} animateOnFocus slideUp>
                        {/* User Profile Section */}
                        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.profileHeader}>
                                <View style={[styles.avatar, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
                                    <Image
                                        source={require('@/assets/images/stockX.png')}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.userName, { color: colors.text }]}>StockX Trader</Text>
                                    <Text style={[styles.userRole, { color: colors.textMuted }]}>User ID: #88392</Text>
                                </View>
                                <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.proBadgeText}>PRO</Text>
                                </View>
                            </View>
                        </View>
                    </FadeInView>

                    <FadeInView delay={100} animateOnFocus slideUp>
                        {/* Appearance */}
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
                        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', gap: 8, padding: 8 }]}>
                            {renderThemeOption('light', 'sunny', 'Light')}
                            {renderThemeOption('dark', 'moon', 'Dark')}
                            {renderThemeOption('system', 'settings-sharp', 'System')}
                        </View>
                    </FadeInView>

                    <FadeInView delay={200} animateOnFocus slideUp>
                        {/* Account Settings */}
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Settings</Text>
                        <View style={[styles.settingsGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                                <Ionicons name="settings-outline" size={24} color={colors.text} />
                                <Text style={[styles.settingText, { color: colors.text }]}>General Settings</Text>
                                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                                <Ionicons name="shield-checkmark-outline" size={24} color={colors.text} />
                                <Text style={[styles.settingText, { color: colors.text }]}>Security & Privacy</Text>
                                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.settingItemLast}
                                onPress={() => setShowAbout(true)}
                            >
                                <Ionicons name="information-circle-outline" size={24} color={colors.text} />
                                <Text style={[styles.settingText, { color: colors.text }]}>About</Text>
                                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </FadeInView>

                    {/* Logout Button (Bottom) */}
                    <FadeInView delay={250} animateOnFocus slideUp>
                        <TouchableOpacity
                            style={[styles.logoutBtn, { borderColor: colors.danger, backgroundColor: `${colors.danger}10` }]}
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out" size={20} color={colors.danger} />
                            <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out</Text>
                        </TouchableOpacity>
                    </FadeInView>

                    <FadeInView delay={300} animateOnFocus slideUp>
                        {/* Custom Export Section */}
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Custom Export</Text>
                        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>Select Date Range</Text>
                            <View style={styles.dateRow}>
                                <View style={styles.dateInputContainer}>
                                    <Text style={[styles.dateLabel, { color: colors.textMuted }]}>From</Text>
                                    <TouchableOpacity
                                        style={[styles.dateButton, { borderColor: colors.border, backgroundColor: isDark ? '#FFFFFF05' : '#F2F2F7' }]}
                                        onPress={() => setShowStartCalendar(true)}
                                    >
                                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                                        <Text style={[styles.dateText, { color: colors.text }]}>
                                            {new Date(dateRange.startDate).toLocaleDateString()}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.dateInputContainer}>
                                    <Text style={[styles.dateLabel, { color: colors.textMuted }]}>To</Text>
                                    <TouchableOpacity
                                        style={[styles.dateButton, { borderColor: colors.border, backgroundColor: isDark ? '#FFFFFF05' : '#F2F2F7' }]}
                                        onPress={() => setShowEndCalendar(true)}
                                    >
                                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                                        <Text style={[styles.dateText, { color: colors.text }]}>
                                            {new Date(dateRange.endDate).toLocaleDateString()}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.exportBtn, { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderColor: 'rgba(255, 215, 0, 0.5)' }]}
                                    onPress={() => handleExport('pdf')}
                                    disabled={isExporting}
                                >
                                    <Ionicons name="document-text-outline" size={24} color="#FFD700" />
                                    <Text style={[styles.exportBtnText, { color: '#FFD700' }]}>PDF Report</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.exportBtn, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.1)' : 'rgba(0, 122, 255, 0.1)', borderColor: isDark ? 'rgba(0, 229, 255, 0.5)' : 'rgba(0, 122, 255, 0.5)' }]}
                                    onPress={() => handleExport('csv')}
                                    disabled={isExporting}
                                >
                                    <Ionicons name="grid-outline" size={24} color={colors.primary} />
                                    <Text style={[styles.exportBtnText, { color: colors.primary }]}>CSV Data</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </FadeInView>

                    {/* About Modal */}
                    <Modal visible={showAbout} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                    <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                                        <Image
                                            source={require('@/assets/images/stockX.png')}
                                            style={{ width: 60, height: 60 }}
                                            contentFit="contain"
                                        />
                                    </View>
                                    <Text style={[styles.aboutTitle, { color: colors.text }]}>StockX Trader</Text>
                                    <Text style={[styles.aboutVersion, { color: colors.textMuted }]}>Version 1.0.2</Text>
                                </View>

                                <Text style={[styles.aboutDesc, { color: colors.text }]}>
                                    Designed to help you track, analyze, and improve your trading performance.
                                </Text>

                                <View style={[styles.creditBox, { backgroundColor: isDark ? '#000' : '#FFF', borderColor: colors.border }]}>
                                    <Text style={[styles.creditText, { color: colors.textMuted }]}>Developed and Maintained by</Text>
                                    <Text style={[styles.pgtech, { color: colors.primary }]}>PGTech</Text>
                                </View>

                                <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.background }]} onPress={() => setShowAbout(false)}>
                                    <Text style={[styles.closeBtnText, { color: colors.text }]}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Calendars */}
                    <Modal visible={showStartCalendar} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Calendar
                                    onDayPress={(day) => onDayPress(day, 'start')}
                                    theme={{
                                        backgroundColor: colors.card,
                                        calendarBackground: colors.card,
                                        textSectionTitleColor: colors.textMuted,
                                        selectedDayBackgroundColor: colors.primary,
                                        selectedDayTextColor: '#ffffff',
                                        todayTextColor: colors.primary,
                                        dayTextColor: colors.text,
                                        textDisabledColor: colors.textMuted,
                                        monthTextColor: colors.text,
                                        arrowColor: colors.primary,
                                    }}
                                />
                                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowStartCalendar(false)}>
                                    <Text style={[styles.closeBtnText, { color: colors.text }]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    <Modal visible={showEndCalendar} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Calendar
                                    onDayPress={(day) => onDayPress(day, 'end')}
                                    theme={{
                                        backgroundColor: colors.card,
                                        calendarBackground: colors.card,
                                        textSectionTitleColor: colors.textMuted,
                                        selectedDayBackgroundColor: colors.primary,
                                        selectedDayTextColor: '#ffffff',
                                        todayTextColor: colors.primary,
                                        dayTextColor: colors.text,
                                        textDisabledColor: colors.textMuted,
                                        monthTextColor: colors.text,
                                        arrowColor: colors.primary,
                                    }}
                                />
                                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowEndCalendar(false)}>
                                    <Text style={[styles.closeBtnText, { color: colors.text }]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 32, fontWeight: 'bold' },
    logoutHeaderBtn: { padding: 8 },
    content: { padding: 20 },
    card: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 24 },
    profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    userName: { fontSize: 20, fontWeight: 'bold' },
    userRole: { fontSize: 14 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    label: { fontSize: 14, marginBottom: 16 },
    dateRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    dateInputContainer: { flex: 1 },
    dateLabel: { fontSize: 12, marginBottom: 8 },
    dateButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
    dateText: { fontSize: 14 },
    actionRow: { flexDirection: 'row', gap: 12 },
    exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 8 },
    exportBtnText: { fontSize: 16, fontWeight: '600' },
    proBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    proBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
    settingsGroup: { borderRadius: 20, marginBottom: 24, borderWidth: 1 },
    settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
    settingItemLast: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    settingText: { flex: 1, fontSize: 16 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 8, marginBottom: 24 },
    logoutText: { fontSize: 16, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 20, padding: 20, borderWidth: 1 },
    closeBtn: { padding: 16, alignItems: 'center', marginTop: 10, borderRadius: 12 },
    closeBtnText: { fontSize: 16, fontWeight: '600' },
    themeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1, gap: 6 },
    themeBtnText: { fontSize: 12, fontWeight: '600' },
    aboutTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
    aboutVersion: { fontSize: 14, marginTop: 4 },
    aboutDesc: { textAlign: 'center', fontSize: 16, marginBottom: 24, lineHeight: 22 },
    creditBox: { width: '100%', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, marginBottom: 16 },
    creditText: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    pgtech: { fontSize: 20, fontWeight: 'bold' },
});
