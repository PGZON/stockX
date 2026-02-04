import { FadeInView } from '@/components/FadeInView';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/convex/_generated/api';
import { getInstrumentConfig } from '@/convex/instrumentConfig';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ModalScreen() {
  const { colors, isDark } = useTheme();

  // Form State
  const [ticker, setTicker] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [outcome, setOutcome] = useState<'WIN' | 'LOSS' | null>(null); // New outcome state
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [usdInr, setUsdInr] = useState('83'); // Default rate
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const generateUploadUrl = useMutation(api.trades.generateUploadUrl);
  const addTrade = useMutation(api.trades.addTrade);

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data?.rates?.INR) {
          setUsdInr(data.rates.INR.toString());
        }
      })
      .catch(err => console.error("Failed to fetch rates", err));
  }, []);

  // Derived Calculations using Formula Engine
  const stats = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const lot = parseFloat(lotSize) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const tp = parseFloat(takeProfit) || 0;
    const rate = parseFloat(usdInr) || 83;

    // 1. Get Instrument Contract Size
    const contractSize = getInstrumentConfig(ticker);

    // 2. Calculate Price Movements
    const riskDist = Math.abs(entry - sl);
    const rewardDist = Math.abs(tp - entry);

    // 3. Convert to USD (Formula: Price Move × Contract Size × Lot Size)
    const riskAmount = riskDist * contractSize * lot;
    const rewardAmount = rewardDist * contractSize * lot;

    // 4. Convert to INR
    const riskAmountINR = riskAmount * rate;
    const rewardAmountINR = rewardAmount * rate;

    // 5. Calculate Risk-Reward Ratio
    const rr = riskAmount > 0 ? (rewardAmount / riskAmount) : 0;

    return {
      riskDist,
      rewardDist,
      riskAmount,
      rewardAmount,
      riskAmountINR,
      rewardAmountINR,
      contractSize,
      rr,
      entry,
      sl,
      tp
    };
  }, [entryPrice, lotSize, stopLoss, takeProfit, usdInr, ticker]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 5
    });

    if (!result.canceled) {
      setImages(prev => [...prev, ...result.assets.map(asset => asset.uri)]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!ticker || !entryPrice || !lotSize) {
      Alert.alert("Missing Fields", "Please fill in Ticker, Entry Price, and Lot Size.");
      return;
    }

    if (!outcome) {
      Alert.alert("Outcome Required", "Please select TP Hit (Win) or SL Hit (Loss).");
      return;
    }

    setLoading(true);
    try {
      let imageIds: string[] = [];
      let imageId: string | undefined = undefined;

      // Upload Images
      if (images.length > 0) {
        const uploadPromises = images.map(async (imgUri) => {
          const postUrl = await generateUploadUrl();
          const fetchResponse = await fetch(imgUri);
          const blob = await fetchResponse.blob();

          const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": blob.type },
            body: blob,
          });
          const json = await result.json();
          if (!result.ok) throw new Error("Upload failed");
          return json.storageId;
        });

        imageIds = await Promise.all(uploadPromises);
        imageId = imageIds[0];
      }

      // Calculate P/L based on outcome
      let finalStatus: string;
      let finalPL: number;
      let finalPLUsd: number;
      let finalPLInr: number;

      if (outcome === 'WIN') {
        // TP Hit - Profit = Reward Amount
        finalStatus = 'WIN';
        finalPL = stats.rewardAmount;
        finalPLUsd = stats.rewardAmount;
        finalPLInr = stats.rewardAmountINR;
      } else {
        // SL Hit - Loss = Risk Amount (negative)
        finalStatus = 'LOSS';
        finalPL = -stats.riskAmount;
        finalPLUsd = -stats.riskAmount;
        finalPLInr = -stats.riskAmountINR;
      }

      await addTrade({
        ticker: ticker.toUpperCase(),
        entryPrice: stats.entry,
        // exitPrice removed
        lotSize: parseFloat(lotSize),
        quantity: parseFloat(lotSize), // Backend compat
        direction,
        type: direction === 'LONG' ? 'BUY' : 'SELL', // Explicit type

        stopLoss: stats.sl,
        takeProfit: stats.tp,

        status: finalStatus,
        pl: finalPL,
        plUsd: finalPLUsd,
        plInr: finalPLInr,
        exchangeRate: parseFloat(usdInr),

        riskAmount: stats.riskAmount,
        rewardAmount: stats.rewardAmount,
        riskAmountInr: stats.riskAmountINR,
        rewardAmountInr: stats.rewardAmountINR,
        riskReward: stats.rr,

        entryDate: Date.now(),
        exitDate: Date.now(), // Set exit date since trade is closed
        imageId,
        imageIds,
        timeFrame: '1h', // Default or add input
        notes,
      });

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save trade.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* --- Top Section: Ticker & Direction --- */}
        <FadeInView delay={0} slideUp>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Pair</Text>
              <TextInput
                style={[styles.input, styles.largeInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="XAUUSD"
                placeholderTextColor={colors.textMuted}
                value={ticker}
                onChangeText={setTicker}
                autoCapitalize="characters"
              />
            </View>
            <View style={{ width: 120 }}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Side</Text>
              <View style={styles.switchContainer}>
                <TouchableOpacity onPress={() => setDirection('LONG')} style={[styles.switchBtn, direction === 'LONG' && { backgroundColor: colors.success }]}>
                  <Text style={[styles.switchText, direction === 'LONG' && { color: '#fff', fontWeight: 'bold' }]}>BUY</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDirection('SHORT')} style={[styles.switchBtn, direction === 'SHORT' && { backgroundColor: colors.danger }]}>
                  <Text style={[styles.switchText, direction === 'SHORT' && { color: '#fff', fontWeight: 'bold' }]}>SELL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* --- Key Trade Data --- */}
        <FadeInView delay={100} slideUp>
          <View style={styles.section}>
            <View style={styles.row}>
              <InputBox label="Entry Price" value={entryPrice} onChange={setEntryPrice} colors={colors} placeholder="0.00" />
              <InputBox label="Lot Size" value={lotSize} onChange={setLotSize} colors={colors} placeholder="1.0" icon="layers" />
            </View>
            <View style={styles.row}>
              <InputBox label="Stop Loss (SL)" value={stopLoss} onChange={setStopLoss} colors={colors} placeholder="0.00" color={colors.danger} />
              <InputBox label="Target (TP)" value={takeProfit} onChange={setTakeProfit} colors={colors} placeholder="0.00" color={colors.success} />
            </View>
          </View>
        </FadeInView>

        {/* --- Live Calculation Card --- */}
        <FadeInView delay={200} slideUp>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Trade Plan</Text>

            {/* Risk/Reward Block Only */}
            {/* Projected Outcomes */}
            <View style={{ gap: 12, marginBottom: 15 }}>
              {/* Target / Reward */}
              <View style={[styles.resultRow, { backgroundColor: 'rgba(74, 222, 128, 0.1)', padding: 10, borderRadius: 12 }]}>
                <View>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>Target (TP)</Text>
                  <Text style={{ color: colors.success, fontWeight: 'bold', fontSize: 16 }}>+${stats.rewardAmount.toFixed(2)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.success, fontSize: 16, fontWeight: 'bold' }}>+₹{stats.rewardAmountINR.toFixed(0)}</Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>{stats.rewardDist.toFixed(2)} pts</Text>
                </View>
              </View>

              {/* Stop / Risk */}
              <View style={[styles.resultRow, { backgroundColor: 'rgba(248, 113, 113, 0.1)', padding: 10, borderRadius: 12 }]}>
                <View>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>Stop Loss (SL)</Text>
                  <Text style={{ color: colors.danger, fontWeight: 'bold', fontSize: 16 }}>-${stats.riskAmount.toFixed(2)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.danger, fontSize: 16, fontWeight: 'bold' }}>-₹{stats.riskAmountINR.toFixed(0)}</Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>{stats.riskDist.toFixed(2)} pts</Text>
                </View>
              </View>
            </View>

            <View style={[styles.rrBox, { backgroundColor: isDark ? '#000' : '#f0f0f0' }]}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Risk : Reward Ratio</Text>
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>1 : {stats.rr.toFixed(2)}</Text>
            </View>

          </View>
        </FadeInView>

        {/* --- Outcome Selector --- */}
        <FadeInView delay={250} slideUp>
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textMuted, marginBottom: 10 }]}>Trade Outcome</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[
                  styles.outcomeBtn,
                  { borderColor: colors.success, backgroundColor: outcome === 'WIN' ? colors.success : 'transparent' }
                ]}
                onPress={() => setOutcome('WIN')}
              >
                <Ionicons name="checkmark-circle" size={20} color={outcome === 'WIN' ? '#FFF' : colors.success} />
                <Text style={[styles.outcomeText, { color: outcome === 'WIN' ? '#FFF' : colors.success }]}>TP Hit (Win)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.outcomeBtn,
                  { borderColor: colors.danger, backgroundColor: outcome === 'LOSS' ? colors.danger : 'transparent' }
                ]}
                onPress={() => setOutcome('LOSS')}
              >
                <Ionicons name="close-circle" size={20} color={outcome === 'LOSS' ? '#FFF' : colors.danger} />
                <Text style={[styles.outcomeText, { color: outcome === 'LOSS' ? '#FFF' : colors.danger }]}>SL Hit (Loss)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </FadeInView>

        {/* --- Image Upload --- */}
        <FadeInView delay={300} slideUp>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Screenshots</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
              {images.map((imgUri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: imgUri }} style={[styles.previewThumbnail, { borderColor: colors.border }]} />
                  <TouchableOpacity onPress={() => removeImage(index)} style={styles.removeBtn}>
                    <Ionicons name="close-circle" size={24} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={[styles.addMoreBox, { borderColor: colors.border, backgroundColor: 'rgba(0,0,0,0.02)' }]} onPress={pickImage}>
                <Ionicons name="images-outline" size={24} color={colors.primary} />
                <Text style={{ fontSize: 10, color: colors.primary, marginTop: 4, fontWeight: '600' }}>Add Image</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </FadeInView>

        {/* --- Notes --- */}
        <FadeInView delay={350} slideUp>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Notes / Strategy</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border, height: 80, alignItems: 'flex-start', paddingVertical: 10 }]}>
              <TextInput
                style={[styles.input, { color: colors.text, textAlignVertical: 'top' }]}
                placeholder="Why did you take this trade?"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>
        </FadeInView>

        {/* --- Save Button --- */}
        <FadeInView delay={400} slideUp>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Trade Journal</Text>}
          </TouchableOpacity>
        </FadeInView>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Helper Component for Inputs
const InputBox = ({ label, value, onChange, colors, placeholder, color, icon }: any) => (
  <View style={[styles.inputGroup, { flex: 1 }]}>
    <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {icon && <Ionicons name={icon as any} size={16} color={colors.textMuted} style={{ marginRight: 6 }} />}
      <TextInput
        style={[styles.input, { color: color || colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 50
  },
  label: {
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  topRow: {
    flexDirection: 'row',
    gap: 15
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    height: 48,
  },
  input: {
    fontSize: 16,
    flex: 1,
    height: '100%',
    fontWeight: '600'
  },
  largeInput: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: 0,
  },
  section: {
    gap: 15
  },
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e5e5', // will be overridden by style but good fallback
    borderRadius: 12,
    overflow: 'hidden',
    height: 48,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  switchBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  switchText: {
    fontSize: 12,
    color: '#666'
  },

  // Summary Card Styles
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  resultBlock: {
    gap: 8,
    marginBottom: 15
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 15
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2
  },
  rrBox: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 5
  },

  // Images
  imageList: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  imageWrapper: {
    marginRight: 10,
    width: 80,
    height: 80,
  },
  previewThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden'
  },
  addMoreBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8
  },
  outcomeText: {
    fontWeight: 'bold',
    fontSize: 14
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
