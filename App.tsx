
import React, { useState, useEffect, useCallback } from 'react';
import { DataSource, MetricData, TimeRange, AppSettings } from './types';
import { fetchDashboardData } from './services/dataService';
import { analyzeMarketData } from './services/geminiService';
import ControlPanel from './components/ControlPanel';
import MetricCard from './components/MetricCard';
import MarketSummary from './components/MarketSummary';

const STORAGE_KEY = 'macroloop_settings_v1';

const App: React.FC = () => {
  // State
  const [data, setData] = useState<MetricData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    timeRange: TimeRange.D7,
    dataSource: DataSource.GENERAL,
    favorites: []
  });

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Fetch Data Logic
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: results, lastUpdated: updated } = await fetchDashboardData(settings.dataSource, settings.timeRange);
      setData(results);
      setLastUpdated(updated);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  }, [settings.dataSource, settings.timeRange]);

  // Initial Fetch & Update
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleRangeChange = (range: TimeRange) => {
    setSettings(prev => ({ ...prev, timeRange: range }));
  };

  const handleSourceChange = (source: DataSource) => {
    setSettings(prev => ({ ...prev, dataSource: source }));
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeMarketData(data);
      setAiAnalysis(result);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-200 font-sans pb-20">
      
      <ControlPanel 
        selectedRange={settings.timeRange}
        onRangeChange={handleRangeChange}
        selectedSource={settings.dataSource}
        onSourceChange={handleSourceChange}
        onRefresh={loadData}
        loading={loading}
        onAnalyze={handleAnalyze}
        analyzing={analyzing}
        lastUpdated={lastUpdated}
      />

      <main className="max-w-7xl mx-auto px-4">
        
        {/* AI Analysis Result Section */}
        {aiAnalysis && (
          <div className="mb-8 animate-fade-in-down">
            <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900/40 border border-indigo-500/30 rounded-xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-32 h-32 text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
              </div>
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-indigo-300 flex items-center gap-2">
                   <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                   AI Market Analyst Insight
                 </h2>
                 <button onClick={() => setAiAnalysis(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                <div className="whitespace-pre-line leading-relaxed">
                  {aiAnalysis}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        {loading && data.length === 0 ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
               <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
               <p className="text-slate-500 animate-pulse">Extrayendo datos de {settings.dataSource}...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.map((metric) => (
              <MetricCard key={metric.definition.id} data={metric} timeRange={settings.timeRange} />
            ))}
          </div>
        )}

        {/* Static Analysis Summary */}
        <MarketSummary />

      </main>

      <footer className="max-w-7xl mx-auto px-4 mt-12 text-center text-slate-600 text-xs pb-8">
        <p>© 2024 MacroLoop Analytics. Data sourced from Yahoo Finance & Market APIs.</p>
        <p className="mt-2">Powered by Google Gemini & Recharts</p>
      </footer>
    </div>
  );
};

export default App;
