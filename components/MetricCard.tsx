
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { MetricData } from '../types';

interface MetricCardProps {
  data: MetricData;
}

const MetricCard: React.FC<MetricCardProps> = ({ data }) => {
  const isPositive = data.change >= 0;
  // Visual Sentiment: Green if Up? Or Green if "Good"? 
  // Standard finance UI: Green = Price Up, Red = Price Down.
  // We will stick to price movement color for the main value.
  const sentimentColor = isPositive ? '#10b981' : '#ef4444'; 

  const chartData = useMemo(() => data.history, [data.history]);
  const thresholds = data.definition.thresholds;

  // Calculate domain for Y-Axis
  const allValues = data.history.map(d => d.value);
  if (thresholds?.goodLevel !== undefined) allValues.push(thresholds.goodLevel);
  if (thresholds?.badLevel !== undefined) allValues.push(thresholds.badLevel);

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  
  // Add padding so lines aren't on the absolute edge
  const padding = range === 0 ? minValue * 0.1 : range * 0.15; 
  const yDomain = [minValue - padding, maxValue + padding];

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (data.sourceUrl) {
      window.open(data.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-surface rounded-xl border border-slate-700 shadow-lg hover:border-blue-500 hover:shadow-blue-500/10 transition-all duration-200 flex flex-col h-[320px] overflow-hidden group cursor-pointer relative"
      role="link"
      tabIndex={0}
      title={`Ver fuente: ${data.sourceUrl}`}
    >
      {/* External Link Icon (Absolute) */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
         <div className="bg-slate-800 p-1.5 rounded-full border border-slate-600 text-blue-400">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
             <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
           </svg>
         </div>
      </div>

      {/* Header Section */}
      <div className="p-4 pb-2 flex flex-col justify-between items-start bg-slate-800/30 border-b border-slate-700/50">
        <div className="w-full flex justify-between items-center pr-6">
           <div className="flex items-center gap-1.5 overflow-hidden">
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider truncate">
               {data.definition.name}
             </h3>
             {/* Info Icon with Tooltip */}
             <div 
               className="group/info relative flex items-center z-20" 
               onClick={(e) => e.stopPropagation()}
             >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400 transition-colors cursor-help">
                 <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM9 5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm.75 2.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9 8.75a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
               </svg>
               {/* Tooltip Content */}
               {data.definition.description && (
                 <div className="absolute left-0 bottom-full mb-2 w-64 p-2.5 bg-slate-800 border border-slate-600 rounded-lg shadow-xl text-xs text-slate-200 z-50 opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity">
                   <div className="font-semibold text-blue-300 mb-1">Referencia:</div>
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
              {data.isSimulated && <span className="ml-1 text-[10px] text-amber-500/80 align-top">(Est)</span>}
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
      <div className="flex-1 w-full min-h-0 relative bg-slate-900/20">
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
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '6px', fontSize: '12px', padding: '8px' }}
              itemStyle={{ color: '#f1f5f9' }}
              formatter={(value: number) => [value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'Valor']}
              labelStyle={{ color: '#94a3b8', marginBottom: '2px' }}
              cursor={{ stroke: '#475569', strokeWidth: 1 }}
            />
            
            {/* Reference Lines for Good/Bad Thresholds */}
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
    </div>
  );
};

export default MetricCard;
