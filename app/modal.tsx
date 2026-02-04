import { FadeInView } from '@/components/FadeInView';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ModalScreen() {
  const { colors, isDark } = useTheme();
  const [ticker, setTicker] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const generateUploadUrl = useMutation(api.trades.generateUploadUrl);
  const addTrade = useMutation(api.trades.addTrade);

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
    if (!ticker || !entryPrice || !quantity) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      let imageIds: string[] = [];
      let imageId: string | undefined = undefined;

      // Upload Images if selected
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
          if (!result.ok) {
            throw new Error(`Upload failed: ${JSON.stringify(json)}`);
          }
          return json.storageId;
        });

        imageIds = await Promise.all(uploadPromises);
        imageId = imageIds[0];
      }

      // Calculate logic
      const entry = parseFloat(entryPrice);
      const exit = exitPrice ? parseFloat(exitPrice) : entry;
      const qty = parseFloat(quantity);
      let pl = 0;
      if (direction === 'LONG') {
        pl = (exit - entry) * qty;
      } else {
        pl = (entry - exit) * qty;
      }
      const calculatedStatus = pl > 0 ? "WIN" : (pl < 0 ? "LOSS" : "BE");

      await addTrade({
        ticker: ticker.toUpperCase(),
        entryPrice: entry,
        exitPrice: exit,
        quantity: qty,
        direction,
        status: calculatedStatus,
        pl,
        entryDate: Date.now(),
        imageId,
        imageIds,
        timeFrame: '1h',
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

        <FadeInView delay={0} slideUp>
          {/* Ticker Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Ticker Symbol</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. BTCUSD"
                placeholderTextColor={colors.textMuted}
                value={ticker}
                onChangeText={setTicker}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={100} slideUp>
          {/* Direction Switch */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Type</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.directionBtn, { backgroundColor: colors.card, borderColor: colors.border }, direction === 'LONG' && { backgroundColor: 'rgba(0, 200, 5, 0.2)', borderColor: colors.success }]}
                onPress={() => setDirection('LONG')}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-up" size={16} color={direction === 'LONG' ? colors.success : colors.textMuted} />
                <Text style={[styles.btnText, { color: colors.textMuted }, direction === 'LONG' && { color: colors.text }]}>LONG</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.directionBtn, { backgroundColor: colors.card, borderColor: colors.border }, direction === 'SHORT' && { backgroundColor: 'rgba(255, 59, 48, 0.2)', borderColor: colors.danger }]}
                onPress={() => setDirection('SHORT')}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-down" size={16} color={direction === 'SHORT' ? colors.danger : colors.textMuted} />
                <Text style={[styles.btnText, { color: colors.textMuted }, direction === 'SHORT' && { color: colors.text }]}>SHORT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={200} slideUp>
          {/* Prices */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Entry Price</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.textMuted, marginRight: 4, fontWeight: '600' }}>₹</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={entryPrice}
                  onChangeText={setEntryPrice}
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Exit Price</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.textMuted, marginRight: 4, fontWeight: '600' }}>₹</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={exitPrice}
                  onChangeText={setExitPrice}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Quantity</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="layers-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="1"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={300} slideUp>
          {/* Screenshot Upload */}
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

        <FadeInView delay={400} slideUp>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Log</Text>}
          </TouchableOpacity>
        </FadeInView>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 24,
    paddingBottom: 50
  },
  label: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    height: 56,
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    fontSize: 16,
    flex: 1,
    height: '100%',
    fontWeight: '500'
  },
  inputGroup: {
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  directionBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnText: {
    fontWeight: 'bold',
    fontSize: 14
  },
  imageList: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  imageWrapper: {
    marginRight: 12,
    width: 90,
    height: 90,
  },
  previewThumbnail: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden'
  },
  addMoreBox: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
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
