
import React from 'react';
import { DataSource, TimeRange } from '../types';

interface ControlPanelProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  selectedSource: DataSource;
  onSourceChange: (source: DataSource) => void;
  onRefresh: () => void;
  loading: boolean;
  onAnalyze: () => void;
  analyzing: boolean;
  lastUpdated: string | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedRange,
  onRangeChange,
  selectedSource,
  onSourceChange,
  onRefresh,
  loading,
  onAnalyze,
  analyzing,
  lastUpdated
}) => {
  // Format last updated string
  const formattedDate = lastUpdated 
    ? new Date(lastUpdated).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="sticky top-0 z-[100] bg-background/95 backdrop-blur-md border-b border-slate-700 pb-4 pt-4 px-4 mb-6 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4">
        
        {/* Logo / Title */}
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-blue-500/20 shadow-lg">
             M
           </div>
           <div>
              <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block leading-none">
                MacroLoop <span className="text-slate-500 font-normal">Analytics</span>
              </h1>
              {formattedDate && (
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    Actualizado: {formattedDate}
                  </span>
              )}
           </div>
        </div>

        {/* Controls Container */}
        <div className="flex flex-wrap items-center justify-center gap-3 bg-surface p-1.5 rounded-xl border border-slate-700/50">
          
          {/* Source Selector (Tabs) */}
          <div className="flex flex-col sm:flex-row items-center gap-1.5 mr-2" title="Selecciona la fuente para verificar los datos">
             <div className="flex flex-col items-end leading-none mr-1">
               <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Fuente</span>
               <span className="text-[8px] text-slate-600">Verificación</span>
             </div>
             <div className="flex bg-slate-900/50 rounded-lg p-1">
                {Object.values(DataSource).map((source) => (
                  <button
                    key={source}
                    onClick={() => onSourceChange(source)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      selectedSource === source
                        ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {source.split(' ')[0]}
                  </button>
                ))}
             </div>
          </div>

          <div className="w-px h-6 bg-slate-700 mx-1 hidden sm:block"></div>

          {/* Time Range Selector */}
          <div className="flex bg-slate-900/50 rounded-lg p-1">
            {Object.values(TimeRange).map((range) => (
              <button
                key={range}
                onClick={() => onRangeChange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 uppercase ${
                  selectedRange === range
                    ? 'bg-blue-600 text-white shadow-blue-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-700 mx-1 hidden sm:block"></div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
             <button 
                onClick={onRefresh}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Recargar Datos"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
             </button>

             <button
                onClick={onAnalyze}
                disabled={analyzing}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {analyzing ? (
                   <>
                     <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     ...
                   </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                    AI Insight
                  </>
                )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
