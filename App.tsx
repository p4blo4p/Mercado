import React, { useState, useEffect, useCallback } from 'react';
import { DataSource, MetricData, TimeRange, AppSettings } from './types';
import { fetchDashboardData } from './services/dataService';
import { analyzeMarketData } from './services/geminiService';
import ControlPanel from './components/ControlPanel';
import MetricCard from './components/MetricCard';
import MarketSummary from './components/MarketSummary';

const STORAGE_KEY = 'macroloop_settings_v1';

const App: React.FC = () => {
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

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }, [settings]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: results, lastUpdated: updated } = await fetchDashboardData(settings.dataSource, settings.timeRange);
      setData(results);
      setLastUpdated(updated);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [settings.dataSource, settings.timeRange]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeMarketData(data);
      setAiAnalysis(result);
    } catch { setAiAnalysis("Error en el análisis"); } finally { setAnalyzing(false); }
  };

  return (
    <div className="min-h-screen bg-background text-slate-200 font-sans pb-20">
      <ControlPanel 
        selectedRange={settings.timeRange}
        onRangeChange={(r) => setSettings(p => ({...p, timeRange: r}))}
        selectedSource={settings.dataSource}
        onSourceChange={(s) => setSettings(p => ({...p, dataSource: s}))}
        onRefresh={loadData}
        loading={loading}
        onAnalyze={handleAnalyze}
        analyzing={analyzing}
        lastUpdated={lastUpdated}
      />

      <main className="max-w-7xl mx-auto px-4">
        {aiAnalysis && (
          <div className="mb-8 animate-fade-in-down">
            <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900/40 border border-indigo-500/30 rounded-xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-indigo-300 flex items-center gap-2">
                   <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>AI Market Analyst
                 </h2>
                 <button onClick={() => setAiAnalysis(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                <div className="whitespace-pre-line leading-relaxed">
                   {aiAnalysis.split('\n').map((line, i) => {
                      if (line.startsWith('**')) return <strong key={i} className="block text-indigo-200 mt-2">{line.replace(/\*\*/g, '')}</strong>;
                      return <p key={i} className="mb-2">{line}</p>;
                   })}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && data.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
               <div key={i} className="h-[380px] bg-surface rounded-xl border border-slate-700 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.map((metric) => (
              <MetricCard key={metric.definition.id} data={metric} timeRange={settings.timeRange} />
            ))}
          </div>
        )}

        <MarketSummary />
      </main>

      <footer className="max-w-7xl mx-auto px-4 mt-12 text-center text-slate-600 text-xs pb-8">
        <p>© 2024 MacroLoop Analytics. Sourced from Yahoo Finance, Stooq & Market APIs.</p>
      </footer>
    </div>
  );
};

export default App;