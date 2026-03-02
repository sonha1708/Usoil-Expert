/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Globe, 
  BarChart3, 
  ShieldAlert, 
  Search, 
  RefreshCw,
  Clock,
  ChevronRight,
  AlertTriangle,
  Info,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  ImagePlus,
  X,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { analyzeUSOIL } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TradingSetup {
  timeframe: string;
  trend: string;
  position: string;
  entry: string;
  sl: string;
  tp1: string;
  tp2: string;
  reason: string;
}

interface AnalysisData {
  fullReport: string;
  currentPrice: number;
  priceChange: string;
  setups: TradingSetup[];
  groundingMetadata?: any;
}

interface UploadedImage {
  id: string;
  data: string;
  mimeType: string;
  preview: string;
}

export default function App() {
  const [input, setInput] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState('H1');
  const [sources, setSources] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      const promise = new Promise<UploadedImage>((resolve) => {
        reader.onload = (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          resolve({
            id: Math.random().toString(36).substring(7),
            data: base64,
            mimeType: file.type,
            preview: URL.createObjectURL(file)
          });
        };
      });
      reader.readAsDataURL(file);
      newImages.push(await promise);
    }
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const imagePayload = images.map(img => ({ data: img.data, mimeType: img.mimeType }));
      const result = await analyzeUSOIL(input, imagePayload);
      setData(result);
      setSources(result.groundingMetadata?.groundingChunks || []);
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
      
      // Set active timeframe to the first one available if current is not in results
      if (result.setups.length > 0 && !result.setups.find((s: TradingSetup) => s.timeframe === activeTimeframe)) {
        setActiveTimeframe(result.setups[0].timeframe);
      }
    } catch (err) {
      console.error(err);
      setError("Đã xảy ra lỗi khi phân tích. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const currentSetup = data?.setups.find(s => s.timeframe === activeTimeframe);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">USOIL Expert <span className="text-emerald-400 italic">Algo-Trader</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">WTI Crude Oil Analysis System</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
            {data && (
              <div className="flex items-center gap-4 px-4 py-1.5 bg-zinc-950 rounded-full border border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Price:</span>
                  <span className="text-emerald-400 font-mono font-bold">${data.currentPrice}</span>
                </div>
                <div className={cn(
                  "flex items-center gap-1 font-bold",
                  data.priceChange.includes('+') ? "text-emerald-500" : "text-red-500"
                )}>
                  {data.priceChange.includes('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {data.priceChange}
                </div>
              </div>
            )}
            {lastUpdated && (
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>{lastUpdated}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls & Input */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Thông số đầu vào
              </h2>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500">Dữ liệu bổ sung (Tùy chọn)</label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập tin tức mới, giá Exness hoặc yêu cầu cụ thể..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[100px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500">Tải lên ảnh biểu đồ (Chart)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="cursor-pointer flex flex-col items-center justify-center p-4 bg-zinc-950 border border-dashed border-zinc-800 rounded-xl hover:border-emerald-500/50 transition-all group">
                      <ImagePlus className="w-6 h-6 text-zinc-600 group-hover:text-emerald-500 mb-2" />
                      <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300">Thêm ảnh</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    
                    <AnimatePresence>
                      {images.map((img) => (
                        <motion.div
                          key={img.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-800"
                        >
                          <img src={img.preview} alt="Chart preview" className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeImage(img.id)}
                            className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5" />
                      Phân tích thị trường
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* Timeframe Selector Visual */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Kịch bản giao dịch
              </h2>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {['H1', 'H4', 'D1', 'W1'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeframe(tf)}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all border",
                      activeTimeframe === tf 
                        ? "bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20" 
                        : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {currentSetup ? (
                  <motion.div
                    key={activeTimeframe}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase",
                          currentSetup.position.toLowerCase().includes('long') ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {currentSetup.position}
                        </div>
                        <span className="text-xs font-medium text-zinc-400">Xu hướng: {currentSetup.trend}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Entry</p>
                        <p className="text-sm font-mono font-bold text-zinc-100">{currentSetup.entry}</p>
                      </div>
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Stop Loss</p>
                        <p className="text-sm font-mono font-bold text-red-400">{currentSetup.sl}</p>
                      </div>
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Take Profit 1</p>
                        <p className="text-sm font-mono font-bold text-emerald-400">{currentSetup.tp1}</p>
                      </div>
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Take Profit 2</p>
                        <p className="text-sm font-mono font-bold text-emerald-400">{currentSetup.tp2}</p>
                      </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                      <p className="text-[10px] text-emerald-500/70 uppercase font-bold mb-1 flex items-center gap-1">
                        <Target className="w-3 h-3" /> Lý do vào lệnh
                      </p>
                      <p className="text-xs text-zinc-400 leading-relaxed">{currentSetup.reason}</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xs text-zinc-600 italic">Không có kịch bản cho khung này</p>
                  </div>
                )}
              </AnimatePresence>
            </section>

            {sources.length > 0 && (
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Nguồn dữ liệu
                </h2>
                <div className="space-y-2">
                  {sources.slice(0, 5).map((source, i) => (
                    source.web && (
                      <a
                        key={i}
                        href={source.web.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2 bg-zinc-950 hover:bg-zinc-800 rounded border border-zinc-800 text-[10px] text-zinc-400 truncate transition-colors"
                      >
                        {source.web.title || source.web.uri}
                      </a>
                    )
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Analysis Output */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[600px]"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <Activity className="absolute inset-0 m-auto w-8 h-8 text-emerald-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-100">Đang tính toán thuật toán...</h3>
                    <p className="text-zinc-500 text-sm mt-2 max-w-md">
                      Truy xuất dữ liệu thời gian thực và phân tích cấu trúc SMC đa khung thời gian.
                    </p>
                  </div>
                </motion.div>
              ) : data ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Market Overview Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {data.setups.map((setup) => (
                      <div 
                        key={setup.timeframe}
                        onClick={() => setActiveTimeframe(setup.timeframe)}
                        className={cn(
                          "p-4 rounded-2xl border transition-all cursor-pointer",
                          activeTimeframe === setup.timeframe 
                            ? "bg-zinc-900 border-emerald-500/50 shadow-lg shadow-emerald-500/5" 
                            : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{setup.timeframe}</span>
                          {setup.trend.includes('Tăng') ? (
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                          ) : setup.trend.includes('Giảm') ? (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          ) : (
                            <Activity className="w-3 h-3 text-zinc-500" />
                          )}
                        </div>
                        <p className={cn(
                          "text-xs font-bold",
                          setup.trend.includes('Tăng') ? "text-emerald-400" : setup.trend.includes('Giảm') ? "text-red-400" : "text-zinc-400"
                        )}>
                          {setup.trend}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1">{setup.position}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32" />
                    
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-500">Báo cáo phân tích chuyên sâu</h2>
                    </div>

                    <div className="markdown-body">
                      <ReactMarkdown>{data.fullReport}</ReactMarkdown>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[600px]">
                  <BarChart3 className="w-16 h-16 text-zinc-800" />
                  <div className="max-w-sm">
                    <h3 className="text-lg font-bold text-zinc-400">Hệ thống sẵn sàng</h3>
                    <p className="text-zinc-600 text-sm mt-2">
                      Nhấn nút để bắt đầu quét thị trường USOIL và nhận kịch bản giao dịch SMC.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 mt-12 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>Tham khảo: Dữ liệu Exness & Phân tích thuật toán AI</span>
          </div>
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
            © 2026 USOIL EXPERT ANALYTICS. RISK MANAGEMENT IS KEY.
          </p>
        </div>
      </footer>
    </div>
  );
}
