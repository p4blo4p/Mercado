
import React from 'react';

const MarketSummary: React.FC = () => {
  return (
    <div className="mt-16 border-t border-slate-800 pt-10 mb-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
            <span className="text-2xl">📊</span>
        </div>
        <div>
            <h2 className="text-2xl font-bold text-white">Resumen de Mercado</h2>
            <p className="text-slate-500 text-sm">Instantánea de los indicadores clave y su interpretación (Tiempo Real).</p>
        </div>
      </div>
      
      <div className="overflow-hidden rounded-xl border border-slate-700 shadow-2xl bg-surface mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[600px]">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold text-xs">
              <tr>
                <th className="p-4 border-b border-slate-700">Indicador</th>
                <th className="p-4 border-b border-slate-700 hidden sm:table-cell">Tipo</th>
                <th className="p-4 border-b border-slate-700">Valor Actual</th>
                <th className="p-4 border-b border-slate-700 hidden md:table-cell">Rango Histórico</th>
                <th className="p-4 border-b border-slate-700">Implicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {/* VIX */}
              <tr className="hover:bg-slate-800/60 transition-colors bg-slate-900/20">
                <td className="p-4 font-medium text-white">VIX (Volatilidad)</td>
                <td className="p-4 text-slate-500 hidden sm:table-cell">Sentimiento</td>
                <td className="p-4 font-mono text-emerald-400">∼17.00</td>
                <td className="p-4 text-slate-500 hidden md:table-cell">Media: ∼19.4</td>
                <td className="p-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-400/10 text-emerald-400">Calma / Complacencia</span></td>
              </tr>
              {/* Fear & Greed */}
              <tr className="hover:bg-slate-800/60 transition-colors">
                <td className="p-4 font-medium text-white">Fear & Greed Index</td>
                <td className="p-4 text-slate-500 hidden sm:table-cell">Sentimiento</td>
                <td className="p-4 font-mono text-yellow-400">∼48</td>
                <td className="p-4 text-slate-500 hidden md:table-cell">0 (Miedo) - 100 (Codicia)</td>
                <td className="p-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-400/10 text-yellow-400">Neutral</span></td>
              </tr>
              {/* Buffett */}
              <tr className="hover:bg-slate-800/60 transition-colors bg-slate-900/20">
                <td className="p-4 font-medium text-white">Buffett Indicator</td>
                <td className="p-4 text-slate-500 hidden sm:table-cell">Valoración</td>
                <td className="p-4 font-mono text-red-400 font-bold">∼198%</td>
                <td className="p-4 text-slate-500 hidden md:table-cell">Media: ∼100%</td>
                <td className="p-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-400/10 text-red-400">Sobrevaloración Extrema</span></td>
              </tr>
              {/* P/E */}
              <tr className="hover:bg-slate-800/60 transition-colors">
                <td className="p-4 font-medium text-white">CAPE Ratio</td>
                <td className="p-4 text-slate-500 hidden sm:table-cell">Valoración</td>
                <td className="p-4 font-mono text-red-400 font-bold">∼36.2</td>
                <td className="p-4 text-slate-500 hidden md:table-cell">Media: ∼17.0</td>
                <td className="p-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-400/10 text-red-400">Mercado Caro</span></td>
              </tr>
              {/* Curva */}
              <tr className="hover:bg-slate-800/60 transition-colors bg-slate-900/20">
                <td className="p-4 font-medium text-white">Curva (10Y-2Y)</td>
                <td className="p-4 text-slate-500 hidden sm:table-cell">Macro</td>
                <td className="p-4 font-mono text-emerald-400 font-bold">+0.16%</td>
                <td className="p-4 text-slate-500 hidden md:table-cell">Positiva ({'>'} 0)</td>
                <td className="p-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-400/10 text-emerald-400">Normalizándose</span></td>
              </tr>
              {/* Bono 10Y */}
              <tr className="hover:bg-slate-800/60 transition-colors">
                <td className="p-4 font-medium text-white">Bono 10Y</td>
                <td className="p-4 text-slate-500 hidden sm:table-cell">Macro</td>
                <td className="p-4 font-mono text-yellow-400">∼4.19%</td>
                <td className="p-4 text-slate-500 hidden md:table-cell">Rango: 3.5 - 5.0%</td>
                <td className="p-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-400/10 text-yellow-400">Presión sobre acciones</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {/* Análisis Texto */}
        <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-indigo-400 mb-4 flex items-center gap-2">
                <span>🧐</span> Diagnóstico de Mercado
            </h3>
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>
                  El mercado actual muestra una <strong className="text-white">divergencia significativa</strong>. 
                  Por un lado, los indicadores de sentimiento como el VIX están en niveles bajos, indicando que los inversores 
                  se sienten seguros y "complacientes".
                </p>
                <p>
                  Sin embargo, las valoraciones (P/E, Buffett Indicator) están en máximos históricos, lo que significa que 
                  se está pagando un precio muy alto por los beneficios futuros. Esto reduce el margen de seguridad.
                </p>
                <div className="p-3 bg-indigo-500/10 border-l-2 border-indigo-500 rounded-r text-indigo-200">
                    <strong>Conclusión:</strong> Entorno de "Ricitos de Oro" sostenido por el optimismo, 
                    pero vulnerable a cualquier shock inflacionario.
                </div>
            </div>
        </div>

        {/* Tablas Pequeñas */}
        <div className="space-y-6">
            <div className="bg-surface rounded-xl border border-slate-700 shadow-sm overflow-hidden">
                <div className="bg-slate-800 px-4 py-2 font-bold text-slate-200 text-xs uppercase tracking-wide">Correlaciones Clave</div>
                <table className="w-full text-xs text-left">
                    <tbody className="divide-y divide-slate-700 text-slate-300">
                    <tr><td className="p-3">📉 Si <strong>S&P 500</strong> cae...</td><td className="p-3 text-right">📈 <strong>VIX</strong> sube (Miedo)</td></tr>
                    <tr><td className="p-3">📈 Si <strong>Petróleo</strong> sube...</td><td className="p-3 text-right">📈 <strong>Bonos</strong> suben (Inflación)</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* --- SECCIÓN NUEVA: ESTRATEGIA TÉCNICA --- */}
      <div className="border-t border-slate-800 pt-10">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-purple-500/10 rounded-lg"><span className="text-2xl">📈</span></div>
             <h3 className="text-xl font-bold text-white">Estrategia Técnica: Qué buscar en la gráfica</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card A: MM200 */}
              <div className="bg-slate-800/40 border border-slate-700 p-5 rounded-xl hover:border-purple-500/50 transition-colors">
                  <h4 className="font-bold text-purple-300 mb-2 text-sm uppercase">A. Media Móvil 200 (MM200)</h4>
                  <p className="text-slate-400 text-xs mb-3">La "línea en la arena" de los grandes fondos. Promedio de precios de 200 días.</p>
                  <ul className="text-xs space-y-2 text-slate-300">
                      <li className="flex gap-2">
                          <span className="text-emerald-400 font-bold">● Compra:</span>
                          Si el precio rebota al tocarla o cruza hacia arriba.
                      </li>
                      <li className="flex gap-2">
                          <span className="text-red-400 font-bold">● Venta:</span>
                          Si el precio la cruza hacia abajo con fuerza.
                      </li>
                  </ul>
              </div>

              {/* Card B: RSI */}
              <div className="bg-slate-800/40 border border-slate-700 p-5 rounded-xl hover:border-purple-500/50 transition-colors">
                  <h4 className="font-bold text-purple-300 mb-2 text-sm uppercase">B. RSI (Divergencias)</h4>
                  <p className="text-slate-400 text-xs mb-3">No mires solo "sobrecompra" ({'>'}70). Busca divergencias.</p>
                  <ul className="text-xs space-y-2 text-slate-300">
                      <li className="flex gap-2">
                          <span className="text-emerald-400 font-bold">● Señal Real:</span>
                          Precio hace un <u>nuevo mínimo</u>, pero el RSI hace un <u>mínimo más alto</u>.
                      </li>
                      <li className="pl-4 text-slate-500 italic">
                          "Los vendedores se agotan aunque el precio baje". Anticipa rebote.
                      </li>
                  </ul>
              </div>

              {/* Card C: Volumen */}
              <div className="bg-slate-800/40 border border-slate-700 p-5 rounded-xl hover:border-purple-500/50 transition-colors">
                  <h4 className="font-bold text-purple-300 mb-2 text-sm uppercase">C. Volumen (La Verdad)</h4>
                  <p className="text-slate-400 text-xs mb-3">El precio puede mentir, el volumen no. Es la "gasolina".</p>
                  <ul className="text-xs space-y-2 text-slate-300">
                      <li className="flex gap-2">
                          <span className="text-red-400 font-bold">● Falsa Subida:</span>
                          Precio sube, pero volumen baja. Probable caída pronto.
                      </li>
                      <li className="flex gap-2">
                          <span className="text-emerald-400 font-bold">● Ruptura Válida:</span>
                          Rompe resistencia (techo) con <u>mucho volumen</u>.
                      </li>
                  </ul>
              </div>
          </div>
      </div>
    </div>
  );
};

export default MarketSummary;
