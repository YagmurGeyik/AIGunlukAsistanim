// src/screens/HomeScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSentimentAnalysis } from '../api';

const STORAGE_KEY = '@diary_entries';

// Duyguya göre renk + emoji (pastel tema)
const getColorsAndEmoji = (labelEn) => {
  switch (labelEn) {
    case 'POSITIVE':
      return {
        color: '#2DBF82',    // pastel mint yeşili
        bg: '#E8FFF4',       // çok açık mint arka plan
        emoji: '😊',
      };
    case 'NEGATIVE':
      return {
        color: '#FF6B6B',    // pastel coral kırmızı
        bg: '#FFECEC',       // çok açık pembe/kırmızı arka plan
        emoji: '😔',
      };
    default:
      return {
        color: '#8E8E93',    // soft gri
        bg: '#F4F4F7',       // soft gri/lilamsı arka plan
        emoji: '😐',
      };
  }
};

const HomeScreen = ({ navigation }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  // {labelTr, labelEn, score, summary, advice, color, bg, emoji}
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const apiResult = await getSentimentAnalysis(text);
      console.log('HF raw sonucu:', JSON.stringify(apiResult, null, 2));

      if (!apiResult || !Array.isArray(apiResult)) {
        throw new Error('API boş veya geçersiz sonuç döndürdü');
      }

      // Bazı modeller: [ {label, score}, ... ]
      // Bazıları:      [ [ {label, score}, ... ] ]
      const options = Array.isArray(apiResult[0]) ? apiResult[0] : apiResult;

      if (!Array.isArray(options) || options.length === 0) {
        throw new Error('API sonucu formatı beklenen gibi değil');
      }

      // En yüksek skorlu sonucu al
      const best = options.reduce((prev, cur) =>
        cur.score > prev.score ? cur : prev
      );

      console.log('Seçilen en iyi sonuç:', best);

      // Label normalizasyonu:
      // Türkçe model (savasy) -> LABEL_0 / LABEL_1
      // İngilizce model       -> POSITIVE / NEGATIVE
      let labelEn;
      const rawLabel = (best.label || '').toUpperCase();

      if (rawLabel === 'LABEL_1' || rawLabel === 'POSITIVE') {
        labelEn = 'POSITIVE';
      } else if (rawLabel === 'LABEL_0' || rawLabel === 'NEGATIVE') {
        labelEn = 'NEGATIVE';
      } else {
        labelEn = 'NEUTRAL';
      }

      // Türkçe karşılık
      let labelTr = 'Nötr';
      if (labelEn === 'POSITIVE') labelTr = 'Pozitif';
      else if (labelEn === 'NEGATIVE') labelTr = 'Negatif';

      // Renk & emoji
      const { color, bg, emoji } = getColorsAndEmoji(labelEn);

      // Özet
      let summary;
      if (labelEn === 'POSITIVE') {
        summary =
          'Genel olarak olumlu ve iyi hissediyorsun. Yazdıklarından güzel bir ruh halin olduğu anlaşılıyor.';
      } else if (labelEn === 'NEGATIVE') {
        summary =
          'Kendini zorlayıcı veya keyifsiz bir günde hissediyorsun. Duyguların biraz daha ağır basıyor gibi.';
      } else {
        summary =
          'Duyguların çok baskın değil, günün daha dengeli ve nötr geçmiş gibi görünüyor.';
      }

      // Öneri
      let advice;
      if (labelEn === 'POSITIVE') {
        advice =
          'Bu enerjini sevdiğin bir aktiviteye veya küçük bir hedefe yönlendirebilirsin.';
      } else if (labelEn === 'NEGATIVE') {
        advice =
          'Kendine nazik davran, kısa bir yürüyüş, nefes egzersizi veya sevdiğin biriyle konuşmak iyi gelebilir.';
      } else {
        advice =
          'Günü sakin geçirmek, küçük molalar vermek ve su içmeyi unutmamak sana iyi gelebilir.';
      }

      const analysisData = {
        labelEn,
        labelTr,
        score: best.score,
        summary,
        advice,
        color,
        bg,
        emoji,
      };

      setResult(analysisData);

      // Geçmişe kaydet
      const newEntry = {
        id: Date.now().toString(),
        text: text.trim(),
        date: new Date().toISOString(),
        ...analysisData,
      };

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([newEntry, ...parsed])
      );

      setText('');
    } catch (error) {
      console.error('Error fetching sentiment:', error);
    } finally {
      setLoading(false);
    }
  };

  const dynamicContainerStyle = [
    styles.container,
    result ? { backgroundColor: result.bg } : null,
  ];

  return (
    <View style={dynamicContainerStyle}>
      <Text style={styles.title}>AI Günlük Asistanım</Text>

      <Text style={styles.subtitle}>
        Bugünkü duygularını birkaç cümleyle yaz, AI senin için analiz etsin. 💜
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Bugün nasıl hissediyorsun?"
        placeholderTextColor="#A0A3C2"
        value={text}
        onChangeText={setText}
        multiline
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleAnalyze}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Analiz Et</Text>
        )}
      </TouchableOpacity>

      {/* Sonuç Kartı */}
      {result && (
        <View style={[styles.resultContainer, { borderColor: result.color }]}>
          <Text style={[styles.resultTitle, { color: result.color }]}>
            Duygu: {result.labelTr} {result.emoji}
          </Text>
          <Text style={styles.resultText}>
            Güven Skoru: {result.score.toFixed(2)}
          </Text>

          <Text style={styles.sectionTitle}>Özet</Text>
          <Text style={styles.resultText}>{result.summary}</Text>

          <Text style={styles.sectionTitle}>Öneri</Text>
          <Text style={styles.resultText}>{result.advice}</Text>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.historyButtonText}>Geçmişi Gör</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FAFAFF', // hafif lila-beyaz pastel
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    color: '#4C1D95', // koyu pastel mor
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D7D7F4',
    borderRadius: 16,
    padding: 14,
    height: 150,
    fontSize: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
    color: '#374151',
    shadowColor: '#E5E7EB',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    backgroundColor: '#7C3AED', // pastel mor
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  resultContainer: {
    padding: 16,
    marginTop: 10,
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#CBD5F5',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  resultText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  sectionTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  historyButton: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C4C4DD',
    alignItems: 'center',
    backgroundColor: '#F3F4FF',
  },
  historyButtonText: {
    fontSize: 14,
    color: '#4C1D95',
    fontWeight: '600',
  },
});

export default HomeScreen;
