import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage import
import { getSentimentAnalysis } from '../api'; // API fonksiyonlarını import et

const HomeScreen = ({ navigation, route }) => {
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [sentimentColor, setSentimentColor] = useState(''); // Renk durumunu ekliyoruz
  const [sentimentEmoji, setSentimentEmoji] = useState(''); // Emoji durumunu ekliyoruz

  const handleAnalyze = async () => {
    if (!text.trim()) return;  // Eğer metin boşsa, işlem yapma

    try {
      // API'yi çağır
      const analysisResult = await getSentimentAnalysis(text, route.params.token);

      // Sonuçları al ve sentiment state'ine yerleştir
      if (analysisResult) {
        const label = analysisResult[0].label;

        setSentiment(label);  // API'den gelen sonucu işliyoruz

        // Duyguya göre renk ve emoji ayarlıyoruz
        if (label === 'POSITIVE') {
          setSentimentColor('green');
          setSentimentEmoji('😊');
        } else if (label === 'NEGATIVE') {
          setSentimentColor('red');
          setSentimentEmoji('😢');
        } else {
          setSentimentColor('gray');
          setSentimentEmoji('😐');
        }

        // Geçmişi kaydetmek için AsyncStorage'a ekleyelim
        const newHistory = { text, sentiment: label };
        
        // Geçmişi AsyncStorage'ta saklayalım
        const storedHistory = await AsyncStorage.getItem('analysisHistory');
        let history = storedHistory ? JSON.parse(storedHistory) : [];
        history.push(newHistory);
        await AsyncStorage.setItem('analysisHistory', JSON.stringify(history)); // Veriyi kaydediyoruz

        // History ekranına geçiş yapıyoruz
        navigation.navigate('History');
      }
    } catch (error) {
      console.error("Error fetching sentiment:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Günlük Asistanım</Text>

      <TextInput
        style={styles.input}
        placeholder="Bugün nasıl hissediyorsun?"
        value={text}
        onChangeText={setText}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleAnalyze}>
        <Text style={styles.buttonText}>Analiz Et</Text>
      </TouchableOpacity>

      {sentiment && (
        <View style={[styles.resultContainer, { borderColor: sentimentColor }]}>
          <Text style={[styles.result, { color: sentimentColor }]}>
            Sentiment: {sentiment} {sentimentEmoji}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    height: 150,
    fontSize: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
  },
  resultContainer: {
    padding: 10,
    marginTop: 20,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  result: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
