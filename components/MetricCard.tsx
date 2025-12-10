
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MetricData } from '../types';

interface MetricCardProps {
  data: MetricData;
}

const MetricCard: React.FC<MetricCardProps> = ({ data }) => {
  const chartData = useMemo(() => data.history, [data.history]);
  
  // Calculate dynamic change based on the visible history range
  const { calculatedChange, calculatedPercent } = useMemo(() => {
     if (chartData.length < 2) {
         return { calculatedChange: data.change, calculatedPercent: data.changePercent };
     }
     const startValue = chartData[0].value;
     const endValue = data.currentValue;
     const change = endValue - startValue;
     // Avoid division by zero
     const percent = startValue !== 0 ? (change / startValue) * 100 : 0;
     return { calculatedChange: change, calculatedPercent: percent };
  }, [chartData, data.currentValue, data.change, data.changePercent]);

  const isPositive = calculatedPercent >= 0; 
  const sentimentColor = isPositive ? '#10b981' : '#ef4444'; 

  const thresholds = data.definition.thresholds;

  const allValues = data.history.map(d => d.value);
  // Include thresholds in domain calculation so lines are visible
  if (thresholds?.goodLevel !== undefined) allValues.push(thresholds.goodLevel);
  if (thresholds?.badLevel !== undefined) allValues.push(thresholds.badLevel);

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  // Increase padding to prevent flat lines
  const padding = range === 0 ? minValue * 0.05 : range * 0.2; 
  const yDomain = [minValue - padding, maxValue + padding];

  // Helper for Favicon
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'google.com';
    }
  };

  const domain = getHostname(data.sourceUrl || '');
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  const sourceName = domain.replace('www.', '').split('.')[0];
  const capitalizedSource = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);

  return (
    <div 
      className="bg-surface rounded-xl border border-slate-700 shadow-lg hover:shadow-2xl hover:border-slate-500 transition-all duration-300 flex flex-col h-[360px] group relative hover:z-50"
    >
      {/* Header Section */}
      <div className="p-4 pb-2 flex flex-col justify-between items-start z-30 relative">
        <div className="w-full flex justify-between items-center pr-1">
           <div className="flex items-center gap-2 relative">
             <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider truncate cursor-default">
               {data.definition.name}
             </h3>
             
             {/* Info Icon */}
             <div 
                className="group/info relative flex items-center justify-center cursor-help"
                onClick={(e) => e.stopPropagation()} 
             >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400 transition-colors">
                 <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM9 5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm.75 2.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9 8.75a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
               </svg>
               
               {/* Tooltip Popup - Z-Index 1000 to overlay header */}
               {data.definition.description && (
                 <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-4 bg-slate-900/95 backdrop-blur-xl border border-slate-600 rounded-lg shadow-2xl text-xs text-slate-200 opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-[1000]">
                   <div className="font-semibold text-blue-300 mb-1 border-b border-slate-700 pb-1">Análisis</div>
                   <p className="leading-relaxed">{data.definition.description}</p>
                   {/* Arrow */}
                   <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-600"></div>
                 </div>
               )}
             </div>
           </div>
        </div>
        
        <div className="w-full flex justify-between items-baseline mt-2">
            <span className={`text-3xl font-bold tracking-tight ${data.isSimulated ? 'text-amber-400' : 'text-white'}`} title={data.isSimulated ? "Estimado (Script no ejecutado)" : "Dato Real (Actualizado)"}>
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

      {/* Chart Section */}
      <div className="flex-1 w-full min-h-0 relative -mt-4 overflow-hidden rounded-b-xl z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 25 }}>
            <defs>
              <linearGradient id={`gradient-${data.definition.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={sentimentColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={sentimentColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <XAxis dataKey="date" hide={true} />
            <YAxis hide={true} domain={yDomain} />

            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                backdropFilter: 'blur(8px)', 
                borderColor: '#334155', 
                color: '#f1f5f9', 
                borderRadius: '8px', 
                fontSize: '12px', 
                padding: '8px',
                zIndex: 1000
              }}
              itemStyle={{ color: '#f1f5f9' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              cursor={{ stroke: '#475569', strokeDasharray: '4 4' }}
              formatter={(val:number) => [val.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:4}), 'Valor']}
            />
            
            {thresholds?.goodLevel !== undefined && (
               <ReferenceLine y={thresholds.goodLevel} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />
            )}
            {thresholds?.badLevel !== undefined && (
               <ReferenceLine y={thresholds.badLevel} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
            )}
            
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={sentimentColor} 
              fill={`url(#gradient-${data.definition.id})`} 
              strokeWidth={2}
              activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Min/Max Labels Overlay */}
        <div className="absolute right-2 top-8 text-[9px] text-slate-500 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none border border-slate-800/50">
            H: {maxValue.toLocaleString('en-US', { maximumFractionDigits: 1 })}
        </div>
        <div className="absolute right-2 bottom-12 text-[9px] text-slate-500 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none border border-slate-800/50">
            L: {minValue.toLocaleString('en-US', { maximumFractionDigits: 1 })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-9 left-4 flex gap-3 pointer-events-none">
            <div className="flex items-center gap-1">
                <div className="w-2 h-0.5" style={{ backgroundColor: sentimentColor }}></div>
                <span className="text-[8px] text-slate-500 uppercase">Trend</span>
            </div>
            {(thresholds?.goodLevel || thresholds?.badLevel) && (
                <div className="flex items-center gap-1">
                    <div className="w-2 h-px border-t border-dashed border-slate-400"></div>
                    <span className="text-[8px] text-slate-500 uppercase">Limit</span>
                </div>
            )}
        </div>

        {/* Footer Link */}
        <div className="absolute bottom-0 left-0 w-full h-8 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center px-4 backdrop-blur-sm z-20">
            <div className="flex items-center gap-1.5 opacity-60">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Fuente</span>
            </div>
            
            {data.sourceUrl ? (
            <a 
                href={data.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] text-blue-400 hover:text-blue-300 transition-colors group/link"
            >
                <img 
                src={faviconUrl} 
                alt="icon" 
                className="w-3.5 h-3.5 rounded-sm opacity-80 group-hover/link:opacity-100"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="font-medium">{capitalizedSource}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 -ml-0.5">
                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
                </svg>
            </a>
            ) : (
            <span className="text-[10px] text-slate-600">--</span>
            )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
