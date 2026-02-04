import { FadeInView } from '@/components/FadeInView';
import { MetricsDisplay } from '@/components/MetricsDisplay';
import { RecentActivity } from '@/components/RecentActivity';
import { Skeleton } from '@/components/Skeleton';
import { useCurrency } from '@/context/CurrencyContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const { colors, theme, isDark } = useTheme();
  const { currency, toggleCurrency } = useCurrency();
  const [refreshing, setRefreshing] = useState(false);
  const statsQuery = useQuery(api.trades.getDashboardStats);
  const loading = statsQuery === undefined;

  const stats = statsQuery || {
    totalPL: 0,
    totalPLInr: 0,
    totalPLUsd: 0,
    winRate: 0,
    totalTrades: 0,
    wins: 0,
    losses: 0,
    chartData: [],
    recentTrades: [],
    avgWin: 0,
    avgLoss: 0,
    avgWinInr: 0,
    avgLossInr: 0,
    avgWinUsd: 0,
    avgLossUsd: 0,
    profitFactor: 0,
    bestRun: 0
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Dynamic Gradients
  const heroGradient = isDark
    ? ['#1e3a8a', '#172554'] as const // Deep Blue -> Darker Blue
    : ['#2563EB', '#1d4ed8'] as const; // Blue 600 -> Blue 700

  const heroBorder = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.2)';

  // Use actual USD/INR values from backend
  const totalPLDisplay = currency === 'USD'
    ? stats.totalPLUsd
    : stats.totalPLInr;
  const currencySymbol = currency === 'USD' ? '$' : '₹';
  const decimals = currency === 'USD' ? 2 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Background Decorator */}
      {isDark && (
        <View style={styles.darkBgDecorator}>
          <LinearGradient
            colors={['rgba(29, 78, 216, 0.15)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
          />
        </View>
      )}

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.date, { color: colors.textMuted }]}>{currentDate}</Text>
              <Text style={[styles.title, { color: colors.text }]}>Hello, Trader</Text>
            </View>
            <TouchableOpacity
              style={[styles.profileBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View>
              <Skeleton width="100%" height={220} borderRadius={30} style={{ marginBottom: 30 }} />
              <Skeleton width="100%" height={300} borderRadius={24} style={{ marginBottom: 24 }} />
            </View>
          ) : (
            <>
              {/* Premium Hero Card */}
              <FadeInView delay={0}>
                <TouchableOpacity onPress={() => router.push('/profit-history')} activeOpacity={0.95}>
                  <LinearGradient
                    colors={heroGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.heroCard, { borderColor: heroBorder }]}
                  >
                    {/* Decorative Circles */}
                    <View style={styles.circle1} />
                    <View style={styles.circle2} />

                    <View style={styles.heroHeader}>
                      <View style={styles.netProfitBadge}>
                        <Ionicons name="wallet-outline" size={16} color="#93C5FD" />
                        <Text style={styles.netProfitText}>Net Profit</Text>
                      </View>

                      {/* Currency Toggle */}
                      <TouchableOpacity
                        style={styles.currencyToggle}
                        onPress={toggleCurrency}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.currencyToggleText}>{currency}</Text>
                        <Ionicons name="swap-horizontal" size={16} color="#BFDBFE" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.heroValue}>
                      {currencySymbol}{totalPLDisplay.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
                    </Text>

                    <View style={styles.heroFooter}>
                      <View style={styles.heroStatItem}>
                        <Text style={styles.heroStatLabel}>Win Rate</Text>
                        <View style={styles.heroStatValueRow}>
                          <Ionicons name="pie-chart-outline" size={14} color="#4ADE80" />
                          <Text style={styles.heroStatValue}>{stats.winRate.toFixed(1)}%</Text>
                        </View>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.heroStatItem}>
                        <Text style={styles.heroStatLabel}>Total Trades</Text>
                        <View style={styles.heroStatValueRow}>
                          <Ionicons name="stats-chart-outline" size={14} color="#FDBA74" />
                          <Text style={styles.heroStatValue}>{stats.totalTrades}</Text>
                        </View>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.heroStatItem}>
                        <Text style={styles.heroStatLabel}>Profit Factor</Text>
                        <View style={styles.heroStatValueRow}>
                          <Ionicons name="trending-up" size={14} color="#F472B6" />
                          <Text style={styles.heroStatValue}>{stats.profitFactor.toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </FadeInView>

              {/* Advanced Metrics */}
              <FadeInView delay={150} style={styles.section}>
                <MetricsDisplay
                  wins={stats.wins || 0}
                  losses={stats.losses || 0}
                  totalTrades={stats.totalTrades || 0}
                  avgWin={stats.avgWin || 0}
                  avgLoss={stats.avgLoss || 0}
                  avgWinUsd={stats.avgWinUsd || 0}
                  avgLossUsd={stats.avgLossUsd || 0}
                  avgWinInr={stats.avgWinInr || 0}
                  avgLossInr={stats.avgLossInr || 0}
                  trades={stats.recentTrades || []}
                  currency={currency}
                />
              </FadeInView>

              {/* Recent Activity */}
              <FadeInView delay={300} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
                </View>
                <RecentActivity trades={(stats.recentTrades || []).map(t => ({ ...t, pl: t.pl ?? 0 }))} />
              </FadeInView>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  darkBgDecorator: {
    position: 'absolute',
    width: '100%',
    height: 400,
    top: 0
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  date: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  profileBtn: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1
  },

  // Hero Card
  heroCard: {
    borderRadius: 32,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8
  },
  circle1: {
    position: 'absolute',
    top: -50, right: -50,
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  circle2: {
    position: 'absolute',
    bottom: -60, left: -40,
    width: 150, height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  heroHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16
  },
  netProfitBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20
  },
  netProfitText: { color: '#BFDBFE', fontWeight: '600', fontSize: 14 },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  currencyToggleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 48, fontWeight: '800', color: '#FFFFFF', marginBottom: 24, letterSpacing: -1
  },
  heroFooter: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.15)', padding: 16, borderRadius: 20, backdropFilter: 'blur(10px)'
  },
  heroStatItem: {
    alignItems: 'center', flex: 1
  },
  heroStatLabel: {
    color: '#BFDBFE', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', fontWeight: '600'
  },
  heroStatValueRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4
  },
  heroStatValue: {
    color: '#FFFFFF', fontWeight: 'bold', fontSize: 16
  },
  divider: {
    width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.1)'
  },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold' },
});
