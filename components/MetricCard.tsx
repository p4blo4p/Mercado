import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MetricData, TimeRange } from '../types';

interface MetricCardProps {
  data: MetricData;
  timeRange: TimeRange;
}

const MetricCard: React.FC<MetricCardProps> = React.memo(({ data, timeRange }) => {
  const chartData = useMemo(() => data.history, [data.history]);
  
  // Dynamic change calculation
  const { calculatedChange, calculatedPercent } = useMemo(() => {
     if (timeRange === TimeRange.D1) {
         return { calculatedChange: data.change, calculatedPercent: data.changePercent };
     }

     if (chartData.length < 2) return { calculatedChange: 0, calculatedPercent: 0 };
     
     const startValue = chartData[0].value;
     const endValue = data.currentValue;
     const change = endValue - startValue;
     const percent = startValue !== 0 ? (change / startValue) * 100 : 0;
     return { calculatedChange: change, calculatedPercent: percent };
  }, [chartData, data.currentValue, data.change, data.changePercent, timeRange]);

  const isPositive = calculatedPercent >= 0; 
  const sentimentColor = isPositive ? '#10b981' : '#ef4444'; 
  const thresholds = data.definition.thresholds;

  const allValues = chartData.map(d => d.value);
  if (thresholds?.goodLevel !== undefined) allValues.push(thresholds.goodLevel);
  if (thresholds?.badLevel !== undefined) allValues.push(thresholds.badLevel);

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  const padding = range === 0 ? minValue * 0.05 : range * 0.2; 
  const yDomain = [minValue - padding, maxValue + padding];
  const rangePercent = range === 0 ? 50 : ((data.currentValue - minValue) / range) * 100;

  // Favicon logic
  const getHostname = (url: string) => {
    try { return new URL(url).hostname; } catch { return 'google.com'; }
  };
  const domain = getHostname(data.sourceUrl || '');
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  const sourceName = domain.replace('www.', '').split('.')[0];
  const capitalizedSource = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);

  return (
    <div className="bg-surface rounded-xl border border-slate-700 shadow-lg hover:shadow-2xl hover:border-slate-500 transition-all duration-300 flex flex-col h-[380px] group relative hover:z-50">
      <div className="p-4 pb-2 flex flex-col justify-between items-start z-30 relative">
        <div className="w-full flex justify-between items-center pr-1">
           <div className="flex items-center gap-2 relative">
             <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider truncate cursor-default">
               {data.definition.name}
             </h3>
             <div className="group/info relative flex items-center justify-center cursor-help" onClick={(e) => e.stopPropagation()}>
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400 transition-colors">
                 <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM9 5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm.75 2.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9 8.75a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
               </svg>
               {data.definition.description && (
                 <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-4 bg-slate-900/95 backdrop-blur-xl border border-slate-600 rounded-lg shadow-2xl text-xs text-slate-200 opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-[1000]">
                   <div className="font-semibold text-blue-300 mb-1 border-b border-slate-700 pb-1">Análisis</div>
                   <p className="leading-relaxed">{data.definition.description}</p>
                 </div>
               )}
             </div>
           </div>
        </div>
        
        <div className="w-full flex justify-between items-baseline mt-2">
            <span className={`text-3xl font-bold tracking-tight ${data.isSimulated ? 'text-amber-400' : 'text-white'}`}>
              {data.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              <span className="text-sm font-medium text-slate-500 ml-1">{data.definition.suffix}</span>
            </span>
            <div className={`text-right ${sentimentColor}`}>
              <div className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                <span>{isPositive ? '▲' : '▼'}</span>
                <span>{Math.abs(calculatedPercent).toFixed(2)}%</span>
              </div>
            </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative -mt-4 overflow-hidden rounded-b-xl z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 45 }}>
            <defs>
              <linearGradient id={`gradient-${data.definition.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={sentimentColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={sentimentColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide={true} />
            <YAxis hide={true} domain={yDomain} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px', fontSize: '12px', zIndex: 1000 }}
              itemStyle={{ color: '#f1f5f9' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              cursor={{ stroke: '#475569', strokeDasharray: '4 4' }}
              formatter={(val:number) => [val.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:4}), 'Valor']}
            />
            {thresholds?.goodLevel !== undefined && <ReferenceLine y={thresholds.goodLevel} stroke="#10b981" strokeDasharray="3 3" />}
            {thresholds?.badLevel !== undefined && <ReferenceLine y={thresholds.badLevel} stroke="#ef4444" strokeDasharray="3 3" />}
            <Area type="monotone" dataKey="value" stroke={sentimentColor} fill={`url(#gradient-${data.definition.id})`} strokeWidth={2} activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }} animationDuration={1000} />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Min/Max Overlay */}
        <div className="absolute right-2 top-8 text-[9px] text-slate-500 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded backdrop-blur-sm border border-slate-800/50">H: {maxValue.toLocaleString('en-US', { maximumFractionDigits: 1 })}</div>
        <div className="absolute right-2 bottom-20 text-[9px] text-slate-500 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded backdrop-blur-sm border border-slate-800/50">L: {minValue.toLocaleString('en-US', { maximumFractionDigits: 1 })}</div>

        {/* Range Bar */}
        <div className="absolute bottom-11 left-4 right-4 h-1.5 bg-slate-800/80 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700/50">
             <div className="h-full rounded-full transition-all duration-1000" style={{ width: '6px', left: `${Math.min(98, Math.max(0, rangePercent))}%`, position: 'absolute', backgroundColor: sentimentColor, boxShadow: `0 0 6px ${sentimentColor}` }}></div>
             <div className="w-full h-full opacity-30" style={{ background: `linear-gradient(90deg, transparent, ${sentimentColor} 50%, transparent)` }}></div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 w-full h-8 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center px-4 backdrop-blur-sm z-20">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Fuente</span>
            {data.sourceUrl ? (
            <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] text-blue-400 hover:text-blue-300 transition-colors group/link">
                <img src={faviconUrl} alt="icon" className="w-3.5 h-3.5 rounded-sm opacity-80 group-hover/link:opacity-100" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <span className="font-medium">{capitalizedSource}</span>
            </a>
            ) : <span className="text-[10px] text-slate-600">--</span>}
        </div>
      </div>
    </div>
  );
});

export default MetricCard;