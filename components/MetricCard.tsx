
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { MetricData } from '../types';

interface MetricCardProps {
  data: MetricData;
}

const MetricCard: React.FC<MetricCardProps> = ({ data }) => {
  const isPositive = data.change >= 0;
  const sentimentColor = isPositive ? '#10b981' : '#ef4444'; 

  const chartData = useMemo(() => data.history, [data.history]);
  const thresholds = data.definition.thresholds;

  const allValues = data.history.map(d => d.value);
  if (thresholds?.goodLevel !== undefined) allValues.push(thresholds.goodLevel);
  if (thresholds?.badLevel !== undefined) allValues.push(thresholds.badLevel);

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  
  const padding = range === 0 ? minValue * 0.1 : range * 0.15; 
  const yDomain = [minValue - padding, maxValue + padding];

  // Helper to extract hostname for favicon
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'google.com';
    }
  };

  const domain = getHostname(data.sourceUrl || '');
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  const sourceName = domain.replace('www.', '');

  return (
    <div 
      className="bg-surface rounded-xl border border-slate-700 shadow-lg hover:shadow-xl hover:border-slate-600 transition-all duration-300 flex flex-col h-[340px] group relative"
    >
      {/* Header Section */}
      <div className="p-4 pb-2 flex flex-col justify-between items-start bg-slate-800/30 border-b border-slate-700/50 rounded-t-xl">
        <div className="w-full flex justify-between items-center pr-1">
           <div className="flex items-center gap-1.5 relative">
             <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider truncate cursor-default">
               {data.definition.name}
             </h3>
             {/* Info Icon with Tooltip */}
             <div 
               className="group/info relative flex items-center z-50" 
             >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400 transition-colors cursor-help">
                 <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM9 5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm.75 2.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9 8.75a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
               </svg>
               {/* Tooltip Content */}
               {data.definition.description && (
                 <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl text-xs text-slate-200 opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-[60]">
                   <div className="font-semibold text-blue-300 mb-1">Análisis:</div>
                   {data.definition.description}
                   <div className="absolute left-1.5 -bottom-1 w-2 h-2 bg-slate-800 border-r border-b border-slate-600 transform rotate-45"></div>
                 </div>
               )}
             </div>
           </div>
        </div>
        
        <div className="w-full flex justify-between items-baseline mt-1">
            <span className={`text-2xl font-bold tracking-tight ${data.isSimulated ? 'text-amber-400' : 'text-white'}`} title={data.isSimulated ? "Dato estimado (no en tiempo real)" : "Dato en tiempo real"}>
              {data.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-sm font-medium text-slate-500 ml-1">{data.definition.suffix}</span>
              {data.isSimulated && <span className="ml-1 text-[10px] text-amber-500/80 align-top cursor-help" title="Fuente de datos alternativa">(Est)</span>}
            </span>
            
            <div className={`text-right ${sentimentColor}`}>
              <div className="text-xs font-bold bg-slate-900/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                <span>{isPositive ? '▲' : '▼'}</span>
                <span>{Math.abs(data.changePercent).toFixed(2)}%</span>
              </div>
            </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 w-full min-h-0 relative bg-slate-900/20 overflow-hidden rounded-b-xl mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${data.definition.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={sentimentColor} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={sentimentColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
            
            <XAxis 
              dataKey="date" 
              hide={false}
              tick={{fill: '#64748b', fontSize: 9}}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
              interval="preserveStartEnd"
              height={20}
              dy={5}
            />
            
            <YAxis 
              hide={false}
              domain={yDomain}
              tick={{fill: '#64748b', fontSize: 9}}
              tickLine={false}
              axisLine={false}
              width={35}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(1)}
              dx={-5}
            />

            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '6px', fontSize: '12px', padding: '8px', zIndex: 100 }}
              itemStyle={{ color: '#f1f5f9' }}
              formatter={(value: number) => [value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'Valor']}
              labelStyle={{ color: '#94a3b8', marginBottom: '2px' }}
              cursor={{ stroke: '#475569', strokeWidth: 1 }}
            />
            
            {thresholds?.goodLevel !== undefined && (
               <ReferenceLine 
                 y={thresholds.goodLevel} 
                 stroke="#10b981" 
                 strokeDasharray="3 3" 
                 strokeWidth={1}
                 label={{ 
                   position: thresholds.goodDirection === 'above' ? 'insideBottomRight' : 'insideTopRight', 
                   value: 'BUENO', 
                   fill: '#10b981', 
                   fontSize: 9,
                   fontWeight: 'bold',
                   offset: 5
                 }} 
               />
            )}

            {thresholds?.badLevel !== undefined && (
               <ReferenceLine 
                 y={thresholds.badLevel} 
                 stroke="#ef4444" 
                 strokeDasharray="3 3" 
                 strokeWidth={1}
                 label={{ 
                   position: thresholds.badDirection === 'above' ? 'insideTopRight' : 'insideBottomRight', 
                   value: 'RIESGO', 
                   fill: '#ef4444', 
                   fontSize: 9,
                   fontWeight: 'bold',
                   offset: 5
                 }} 
               />
            )}
            
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={sentimentColor} 
              fill={`url(#gradient-${data.definition.id})`} 
              strokeWidth={2}
              activeDot={{ r: 4, fill: '#fff' }}
              isAnimationActive={true}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer / Source Link Section */}
      <div className="absolute bottom-0 left-0 right-0 h-9 bg-slate-900/90 border-t border-slate-700/50 px-3 flex justify-between items-center rounded-b-xl z-20 backdrop-blur-sm">
        <span className="text-[10px] text-slate-500">Verificar en:</span>
        
        {data.sourceUrl ? (
          <a 
            href={data.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-slate-300 hover:text-white transition-colors group/link bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700 hover:border-slate-500"
            title={`Verificar dato en ${sourceName}`}
          >
            <img 
              src={faviconUrl} 
              alt="icon" 
              className="w-3.5 h-3.5 rounded-sm"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="truncate max-w-[100px] font-medium">{sourceName}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 opacity-50 group-hover/link:opacity-100">
              <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z" clipRule="evenodd" />
            </svg>
          </a>
        ) : (
           <span className="text-[10px] text-slate-600">Fuente no disponible</span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
