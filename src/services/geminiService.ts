import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeUSOIL = async (userInput?: string, images?: { data: string, mimeType: string }[]) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Bạn là một Chuyên gia Phân tích Tài chính và Giao dịch Thuật toán (Expert Algo-Trader) chuyên biệt về thị trường Hàng hóa, đặc biệt là Dầu thô WTI (USOIL).
  
  Nhiệm vụ: Phân tích thị trường USOIL và xuất ra báo cáo chi tiết kèm theo dữ liệu cấu trúc cho các kịch bản giao dịch.
  
  Dữ liệu đầu vào từ người dùng: ${userInput || "Hãy sử dụng Google Search để lấy giá USOIL hiện tại trên Exness và các tin tức vĩ mô mới nhất."}
  
  ${images && images.length > 0 ? "Người dùng đã cung cấp các ảnh biểu đồ (chart). Hãy phân tích kỹ các biểu đồ này để xác định cấu trúc SMC, xu hướng và các vùng thanh khoản/khối lệnh quan trọng." : ""}
  
  Yêu cầu báo cáo văn bản (Bằng Tiếng Việt):
  1. Báo cáo Giá hiện tại.
  2. Phân tích Phân tích Cơ bản.
  3. Phân tích Kỹ thuật (Trend Following, Momentum, SMC).
  4. Cảnh báo Rủi ro.

  Sử dụng Google Search để đảm bảo dữ liệu mới nhất.`;

  const parts: any[] = [{ text: prompt }];
  
  if (images) {
    images.forEach(img => {
      parts.push({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType
        }
      });
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullReport: {
              type: Type.STRING,
              description: "Báo cáo phân tích chi tiết bằng Markdown (Tiếng Việt).",
            },
            currentPrice: {
              type: Type.NUMBER,
              description: "Giá USOIL hiện tại.",
            },
            priceChange: {
              type: Type.STRING,
              description: "Thay đổi giá so với phiên trước (ví dụ: +1.2% hoặc -0.5$).",
            },
            setups: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeframe: { type: Type.STRING, description: "H1, H4, D1, hoặc W1" },
                  trend: { type: Type.STRING, description: "Tăng, Giảm, hoặc Đi ngang" },
                  position: { type: Type.STRING, description: "Long hoặc Short" },
                  entry: { type: Type.STRING, description: "Giá vào lệnh" },
                  sl: { type: Type.STRING, description: "Giá cắt lỗ" },
                  tp1: { type: Type.STRING, description: "Chốt lời 1" },
                  tp2: { type: Type.STRING, description: "Chốt lời 2" },
                  reason: { type: Type.STRING, description: "Lý do ngắn gọn" },
                },
                required: ["timeframe", "trend", "position", "entry", "sl", "tp1", "tp2", "reason"]
              }
            }
          },
          required: ["fullReport", "currentPrice", "priceChange", "setups"]
        }
      },
    });

    const data = JSON.parse(response.text);
    return {
      ...data,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  } catch (error) {
    console.error("Error analyzing USOIL:", error);
    throw error;
  }
};
