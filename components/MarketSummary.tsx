import React from 'react';

const MarketSummary: React.FC = () => {
  return (
    <div className="mt-12 border-t border-slate-800 pt-12">
      <h2 className="text-2xl font-bold text-indigo-400 mb-6 flex items-center gap-2">
        <span>📊</span> Indicadores Actuales del Mercado Bursátil
      </h2>
      
      <div className="overflow-x-auto mb-12 rounded-xl border border-slate-700 shadow-xl bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800 text-slate-200 uppercase tracking-wider font-bold">
            <tr>
              <th className="p-4 border-b border-slate-600">Indicador</th>
              <th className="p-4 border-b border-slate-600">Tipo</th>
              <th className="p-4 border-b border-slate-600">Valor Actual (Aprox.)</th>
              <th className="p-4 border-b border-slate-600">Rango/Media</th>
              <th className="p-4 border-b border-slate-600">Implicación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 bg-slate-900/50 text-slate-300">
            <tr className="hover:bg-slate-800/50 transition-colors">
              <td className="p-4 font-medium text-white">VIX (Volatilidad)</td>
              <td className="p-4 text-slate-400">Sentimiento</td>
              <td className="p-4">∼16.30</td>
              <td className="p-4">Media: ∼19.4</td>
              <td className="p-4 text-green-400">Neutral/Calma: Volatilidad esperada baja, complacencia.</td>
            </tr>
            <tr className="hover:bg-slate-800/50 transition-colors">
              <td className="p-4 font-medium text-white">Fear & Greed Index</td>
              <td className="p-4 text-slate-400">Sentimiento</td>
              <td className="p-4">∼50 (Neutral)</td>
              <td className="p-4">0 (Miedo) - 100 (Codicia)</td>
              <td className="p-4 text-yellow-400">Neutral: Sin emoción fuerte actual.</td>
            </tr>
            <tr className="hover:bg-slate-800/50 transition-colors">
              <td className="p-4 font-medium text-white">Buffett Indicator</td>
              <td className="p-4 text-slate-400">Valoración</td>
              <td className="p-4 text-red-400 font-bold">∼220%</td>
              <td className="p-4">Media: ∼85%-100%</td>
              <td className="p-4 text-red-400">Bajista (Extremo): Acciones muy caras vs PIB.</td>
            </tr>
            <tr className="hover:bg-slate-800/50 transition-colors">
              <td className="p-4 font-medium text-white">P/E Ratio (S&P 500)</td>
              <td className="p-4 text-slate-400">Valoración</td>
              <td className="p-4 text-red-400 font-bold">∼28 - 30</td>
              <td className="p-4">Media Histórica: ∼16</td>
              <td className="p-4 text-red-400">Bajista: Mercado caro, se paga mucho por beneficios.</td>
            </tr>
            <tr className="hover:bg-slate-800/50 transition-colors">
              <td className="p-4 font-medium text-white">Curva Rendimiento</td>
              <td className="p-4 text-slate-400">Macro</td>
              <td className="p-4 text-red-400 font-bold">Invertida (-0.27%)</td>
              <td className="p-4">Positiva ({'>'} 0)</td>
              <td className="p-4 text-red-400">Recesión: Predictor fiable de crisis futura.</td>
            </tr>
            <tr className="hover:bg-slate-800/50 transition-colors">
              <td className="p-4 font-medium text-white">Bono 10Y</td>
              <td className="p-4 text-slate-400">Macro</td>
              <td className="p-4">∼4.14%</td>
              <td className="p-4">Variable (3.8 - 4.8%)</td>
              <td className="p-4 text-yellow-400">Incierto: Niveles manejables, peligroso si sube rápido.</td>
            </tr>
            <tr className="hover:bg-slate-800/50 transition-colors">
              <td className="p-4 font-medium text-white">Petróleo (WTI)</td>
              <td className="p-4 text-slate-400">Macro</td>
              <td className="p-4">∼59.00 USD</td>
              <td className="p-4">Variable</td>
              <td className="p-4 text-blue-400">Neutro: Baja presión inflacionaria.</td>
            </tr>
            <tr className="hover:bg-slate-800/50 transition-colors">
              <td className="p-4 font-medium text-white">ISM Manufacturero</td>
              <td className="p-4 text-slate-400">Macro</td>
              <td className="p-4 text-orange-400">∼48.2</td>
              <td className="p-4">Umbral: 50</td>
              <td className="p-4 text-orange-400">Desaceleración: Contracción industrial.</td>
            </tr>
          </tbody>
        </table>
        <div className="p-2 bg-slate-800 text-xs text-slate-500 text-right">Nota: Valores aproximados a Dic 2025.</div>
      </div>

      <h3 className="text-xl font-bold text-indigo-400 mb-4 flex items-center gap-2">
        <span>🧐</span> Análisis Conclusivo de la Tensión
      </h3>
      <div className="prose prose-invert max-w-none text-slate-300 mb-12 bg-slate-800/30 p-6 rounded-xl border border-slate-700">
        <p className="mb-4">
          Existe una clara <strong>tensión en el mercado</strong>. Por un lado, los indicadores de Sentimiento (VIX, Fear & Greed) apuntan a una 
          <span className="text-green-400 font-semibold"> calma o neutralidad</span>, sugiriendo que los inversores no anticipan caídas inminentes. 
          Sin embargo, esta complacencia técnica contrasta drásticamente con los fundamentales.
        </p>
        <p className="mb-4">
          Los indicadores de Valoración (Buffett Indicator, P/E) y Macro (Curva Invertida, ISM) gritan 
          <span className="text-red-400 font-semibold"> advertencia</span>. El mercado está históricamente caro en un entorno de desaceleración económica subyacente.
        </p>
        <p className="font-semibold border-l-4 border-indigo-500 pl-4 text-white">
          Conclusión: El mercado vive una divergencia. Los precios suben por inercia y sentimiento, mientras la economía real y las valoraciones sugieren cautela extrema. 
          Cualquier sorpresa negativa podría provocar una corrección rápida para alinear la realidad con el precio.
        </p>
      </div>

      <h3 className="text-xl font-bold text-indigo-400 mb-6 flex items-center gap-2">
        <span>🔗</span> Correlación y Causalidad
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Correlación */}
        <div className="bg-surface rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="bg-slate-800 p-3 font-bold text-slate-200 border-b border-slate-600">Correlación (Se mueven juntos)</div>
          <table className="w-full text-sm text-left">
            <tbody className="divide-y divide-slate-700 text-slate-300">
              <tr>
                <td className="p-3 font-medium text-indigo-300">VIX vs S&P 500</td>
                <td className="p-3 text-slate-400">Negativa Fuerte. Si S&P cae, VIX sube (miedo).</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-indigo-300">Tasa 10Y vs ISM</td>
                <td className="p-3 text-slate-400">Positiva. Economía fuerte sube tasas.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-indigo-300">Valoración vs Curva</td>
                <td className="p-3 text-slate-400">Negativa. Sobrevaloración precede inversión de curva.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-indigo-300">Petróleo vs Tasa 10Y</td>
                <td className="p-3 text-slate-400">Positiva. Petróleo alto impulsa inflación y tasas.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Causalidad */}
        <div className="bg-surface rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="bg-slate-800 p-3 font-bold text-slate-200 border-b border-slate-600">Causalidad (Predictivo)</div>
          <table className="w-full text-sm text-left">
            <tbody className="divide-y divide-slate-700 text-slate-300">
              <tr>
                <td className="p-3 font-medium text-purple-300">Curva Invertida</td>
                <td className="p-3 text-slate-400">Predice <strong>Recesión</strong> (6-18 meses).</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-purple-300">Valoración Alta</td>
                <td className="p-3 text-slate-400">Predice <strong>Bajos Retornos</strong> a largo plazo.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-purple-300">ISM {'<'} 50</td>
                <td className="p-3 text-slate-400">Causa <strong>Menores Beneficios</strong> empresariales.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-purple-300">VIX Extremo</td>
                <td className="p-3 text-slate-400">Señal contraria de <strong>Rebote/Compra</strong>.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketSummary;