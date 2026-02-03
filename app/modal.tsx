import { Colors } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ModalScreen() {
  const [ticker, setTicker] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [status, setStatus] = useState('WIN'); // WIN, LOSS, BE
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
        imageId = imageIds[0]; // Set main image as the first one
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
        imageId, // Keep for backward compatibility/thumbnail
        imageIds, // New array field
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
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Ticker Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ticker Symbol</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. AAPL"
            placeholderTextColor={Colors.professional.textMuted}
            value={ticker}
            onChangeText={setTicker}
            autoCapitalize="characters"
          />
        </View>

        {/* Direction Switch */}
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.directionBtn, direction === 'LONG' && styles.longBtn]}
            onPress={() => setDirection('LONG')}
          >
            <Text style={[styles.btnText, direction === 'LONG' && styles.activeBtnText]}>LONG</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.directionBtn, direction === 'SHORT' && styles.shortBtn]}
            onPress={() => setDirection('SHORT')}
          >
            <Text style={[styles.btnText, direction === 'SHORT' && styles.activeBtnText]}>SHORT</Text>
          </TouchableOpacity>
        </View>

        {/* Prices */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Entry Price</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors.professional.textMuted}
              keyboardType="numeric"
              value={entryPrice}
              onChangeText={setEntryPrice}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Exit Price</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors.professional.textMuted}
              keyboardType="numeric"
              value={exitPrice}
              onChangeText={setExitPrice}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor={Colors.professional.textMuted}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>

        {/* Screenshot Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Screenshots</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
            {images.map((imgUri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: imgUri }} style={styles.previewThumbnail} />
                <TouchableOpacity onPress={() => removeImage(index)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={20} color={Colors.professional.danger} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addMoreBox} onPress={pickImage}>
              <Ionicons name="add" size={30} color={Colors.professional.primary} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Save Log</Text>}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.professional.background,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  label: {
    color: Colors.professional.textMuted,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.professional.card,
    borderRadius: 12,
    padding: 16,
    color: Colors.professional.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.professional.border,
  },
  inputGroup: {
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  directionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.professional.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.professional.border,
  },
  longBtn: {
    backgroundColor: 'rgba(0, 200, 5, 0.2)', // Green tint
    borderColor: Colors.professional.success,
  },
  shortBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)', // Red tint
    borderColor: Colors.professional.danger,
  },
  btnText: {
    color: Colors.professional.textMuted,
    fontWeight: 'bold',
  },
  activeBtnText: {
    color: Colors.professional.text,
  },
  uploadBox: {
    height: 150,
    backgroundColor: Colors.professional.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.professional.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadText: {
    color: Colors.professional.primary,
    marginTop: 8,
    fontWeight: '600',
  },
  imageList: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  imageWrapper: {
    marginRight: 10,
    width: 100,
    height: 100,
  },
  previewThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.professional.border,
  },
  removeBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#000',
    borderRadius: 12,
  },
  addMoreBox: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.professional.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.professional.card,
  },

  saveBtn: {
    backgroundColor: Colors.professional.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
