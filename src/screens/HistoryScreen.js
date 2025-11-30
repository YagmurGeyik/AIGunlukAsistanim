import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem('analysisHistory');
        if (storedHistory) {
          setHistory(JSON.parse(storedHistory));  // Verileri set et
        }
      } catch (error) {
        console.error('Error loading history:', error);
      }
    };

    loadHistory();
  }, []);  // componentDidMount gibi çalışacak, sayfa yüklendiğinde çalışır

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Geçmiş Analizler</Text>
      <FlatList
        data={history}
        keyExtractor={(item, index) => index.toString()}  // Her öğeye benzersiz bir anahtar atıyoruz
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text>{item.text}</Text>  {/* Metin */}
            <Text style={styles.sentiment}>Sentiment: {item.sentiment}</Text>  {/* Duygu */}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
  },
  historyItem: {
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f4f4f4',
    borderRadius: 8,
    width: '100%',
  },
  sentiment: {
    fontSize: 16,
    color: '#4a90e2',
  },
});

export default HistoryScreen;
