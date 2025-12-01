import { HUGGING_FACE_TOKEN } from "./config.local";

const HF_API_URL =
  "https://router.huggingface.co/hf-inference/models/savasy/bert-base-turkish-sentiment-cased";

export const getSentimentAnalysis = async (text) => {
  try {
    if (!text || !text.trim()) {
      throw new Error("Metin boş olamaz");
    }

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("HF error status:", response.status);
      console.error("HF error body:", errText);
      throw new Error(`API hatası: ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("Error in getSentimentAnalysis:", error);
    throw error;
  }
};
