// src/screens/HistoryScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const STORAGE_KEY = '@diary_entries';

const getColorsAndEmoji = (labelEn) => {
  switch (labelEn) {
    case 'POSITIVE':
      return { color: '#1BA160', bg: '#E6F7ED', emoji: '😊' };
    case 'NEGATIVE':
      return { color: '#D64545', bg: '#FDE2E2', emoji: '😔' };
    default:
      return { color: '#666666', bg: '#F2F2F2', emoji: '😐' };
  }
};

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const HistoryScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setEntries(parsed);

      // basit istatistik
      let pos = 0,
        neg = 0,
        neu = 0;
      parsed.forEach((e) => {
        if (e.labelEn === 'POSITIVE') pos++;
        else if (e.labelEn === 'NEGATIVE') neg++;
        else neu++;
      });
      setStats({ pos, neg, neu, total: parsed.length });
    } catch (err) {
      console.error('Geçmiş yüklenirken hata:', err);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadEntries();
    }
  }, [isFocused]);

  const renderItem = ({ item }) => {
    const { color, bg, emoji } = getColorsAndEmoji(item.labelEn);

    return (
      <View style={[styles.card, { borderColor: color, backgroundColor: bg }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.sentiText, { color }]}>
            {item.labelTr} {emoji}
          </Text>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>

        <Text style={styles.textBody}>{item.text}</Text>

        {item.summary ? (
          <>
            <Text style={styles.sectionTitle}>Özet</Text>
            <Text style={styles.smallText}>{item.summary}</Text>
          </>
        ) : null}

        {item.advice ? (
          <>
            <Text style={styles.sectionTitle}>Öneri</Text>
            <Text style={styles.smallText}>{item.advice}</Text>
          </>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Geçmiş & Özet</Text>

      {/* Basit haftalık/genel özet */}
      {stats && stats.total > 0 && (
        <View style={styles.statsBox}>
          <Text style={styles.statsTitle}>Genel Duygu Özeti</Text>
          <Text style={styles.statsText}>
            Toplam kayıt: {stats.total} | Pozitif: {stats.pos} | Negatif:{' '}
            {stats.neg} | Nötr: {stats.neu}
          </Text>
        </View>
      )}

      {entries.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Henüz bir günlük kaydın yok. Ana ekrandan bir şeyler yazmayı
            deneyebilirsin.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.backButtonText}>Günlük Ekranına Dön</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#111827',
  },
  statsBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#312E81',
  },
  statsText: {
    fontSize: 13,
    color: '#1F2933',
  },
  card: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sentiText: {
    fontSize: 15,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
    color: '#6B7280',
  },
  textBody: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  sectionTitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  smallText: {
    fontSize: 13,
    color: '#111827',
  },
  emptyBox: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#3B82F6',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default HistoryScreen;
