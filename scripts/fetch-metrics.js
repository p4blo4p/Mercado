
/**
 * scripts/fetch-metrics.js
 * 
 * Este script se ejecuta en Node.js (GitHub Actions).
 * Obtiene datos reales de Yahoo Finance y genera public/data/metrics.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yahooFinance from 'yahoo-finance2';

// Configuración para __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapa de IDs internos a Tickers de Yahoo
// Usamos proxies (ETFs/Futuros) para indicadores que no tienen feed directo gratuito
const TICKER_MAP = {
  'yield_curve': '^T10Y2Y',
  'ism_pmi': 'XLI', // Proxy: Industrial Sector ETF
  'fed_funds': '^IRX', // 13 Week T-Bill
  'credit_spreads': 'HYG', // High Yield Bond ETF (Inverso al spread)
  'm2_growth': 'M2SL', // A veces no disponible, usará override
  'unemployment': null, 
  'lei': null, 
  'nfp': null,
  'cpi': null,
  'consumer_conf': 'XLY', // Consumo discrecional
  'buffett': '^GSPC', 
  'cape': '^GSPC', 
  'bond_vs_stock': null, // Calculado
  'sp500_margin': null,
  'vix': '^VIX',
  'fear_greed': null,
  'put_call': '^CPC', // CBOE Put/Call Ratio
  'sp500_ma200': '^GSPC',
  '10y_yield': '^TNX',
  'oil_wti': 'CL=F',
  'dxy': 'DX-Y.NYB',
  'retail_sales': 'XRT', // Retail ETF
  'copper_gold': 'CALCULATED_COPPER_GOLD'
};

// Valores manuales aproximados (2025) para datos sin feed en Yahoo
const MANUAL_OVERRIDES = {
  'unemployment': { price: 4.2, change: 0 },
  'cpi': { price: 2.7, change: 0.1 },
  'm2_growth': { price: 1.8, change: 0.1 },
  'lei': { price: 99.4, change: -0.2 },
  'nfp': { price: 142, change: 12 },
  'sp500_margin': { price: 12.1, change: 0.1 },
  'fear_greed': { price: 48, change: 2 },
  'bond_vs_stock': { price: 0.85, change: 0.05 }
};

async function fetchMetrics() {
  const results = {};
  const now = new Date().toISOString();
  console.log("Iniciando extracción de datos (Yahoo Finance v3)...");

  // Configuración compatible con Yahoo Finance v3
  // Eliminamos 'headers' manuales ya que v3 gestiona esto internamente
  yahooFinance.setGlobalConfig({ 
    validation: { logErrors: false },
    queue: { concurrency: 4 } // Evitar rate limiting
  });

  // 1. Pre-fetch para ratios calculados
  let copperPrice = 0;
  let goldPrice = 0;

  try {
    const copper = await yahooFinance.quote('HG=F');
    const gold = await yahooFinance.quote('GC=F');
    copperPrice = copper.regularMarketPrice;
    goldPrice = gold.regularMarketPrice;
  } catch (e) { 
    console.warn("⚠️ No se pudieron obtener commodities para ratio Copper/Gold"); 
  }

  // 2. Bucle Principal
  for (const [id, ticker] of Object.entries(TICKER_MAP)) {
    try {
      // CASO ESPECIAL: RATIOS CALCULADOS
      if (id === 'copper_gold') {
        if (copperPrice && goldPrice && goldPrice > 0) {
          const ratio = copperPrice / goldPrice;
          results[id] = {
            price: ratio,
            changePercent: 0,
            history: generateMockHistory(ratio),
            lastUpdated: now
          };
          console.log(`✓ Calculado ${id}: ${ratio.toFixed(5)}`);
        } else {
            const fallback = 0.17;
            results[id] = { price: fallback, changePercent: 0, history: generateMockHistory(fallback), lastUpdated: now };
            console.log(`⚠ Fallback ${id} (Missing data)`);
        }
        continue;
      }

      if (!ticker) {
        // Usar override manual
        if (MANUAL_OVERRIDES[id]) {
          results[id] = {
            price: MANUAL_OVERRIDES[id].price,
            changePercent: MANUAL_OVERRIDES[id].change,
            history: generateMockHistory(MANUAL_OVERRIDES[id].price),
            lastUpdated: now
          };
        }
        continue;
      }

      // PETICIÓN YAHOO FINANCE
      const quote = await yahooFinance.quote(ticker);
      
      if (!quote || typeof quote.regularMarketPrice !== 'number') {
        throw new Error(`Datos inválidos recibidos para ${ticker}`);
      }

      // Intentar obtener historial
      const queryOptions = { period1: '1mo', interval: '1d' };
      let historyData = [];
      try {
        const historical = await yahooFinance.historical(ticker, queryOptions);
        if (historical && Array.isArray(historical)) {
           historyData = historical
            .filter(row => row.close !== null && row.close !== undefined)
            .map(row => ({
              date: row.date.toISOString().split('T')[0],
              value: row.close
            }));
        }
      } catch (hErr) {
        // Ignorar error de historial, usaremos mock
      }

      // Lógica de Normalización
      let price = quote.regularMarketPrice;
      let change = quote.regularMarketChangePercent || 0;

      // Ajuste para Yields (Yahoo a veces los da multiplicados por 10)
      if (ticker === '^TNX' || ticker === '^IRX' || ticker === '^T10Y2Y') {
        // Verificación de cordura: Si el yield es > 20%, probablemente esté en puntos base o x10
        if (price > 10) {
           price = price / 10;
           historyData = historyData.map(h => ({ ...h, value: h.value / 10 }));
        }
      }

      results[id] = {
        price: price,
        changePercent: change,
        history: historyData,
        lastUpdated: now
      };

      console.log(`✓ Obtenido ${id} (${ticker}): ${price.toFixed(2)}`);

    } catch (err) {
      console.error(`✗ Falló ${id} (${ticker}): ${err.message}`);
      // Fallback en caso de error de API para no romper el dashboard
      if (MANUAL_OVERRIDES[id]) {
        results[id] = {
          price: MANUAL_OVERRIDES[id].price,
          changePercent: MANUAL_OVERRIDES[id].change,
          history: generateMockHistory(MANUAL_OVERRIDES[id].price),
          lastUpdated: now
        };
        console.log(`  ↳ Usando fallback manual para ${id}`);
      }
    }
  }

  // Asegurar directorio de salida
  const outputDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(outputDir)){
      fs.mkdirSync(outputDir, { recursive: true });
  }

  const output = {
    lastUpdated: now,
    metrics: results
  };

  fs.writeFileSync(path.join(outputDir, 'metrics.json'), JSON.stringify(output, null, 2));
  console.log("---------------------------------------------------");
  console.log("✅ Completado. Guardado en public/data/metrics.json");
}

function generateMockHistory(basePrice) {
  // Genera una línea plana con ligero ruido para cuando no hay historial
  return Array(14).fill(0).map((_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    value: basePrice * (1 + (Math.random() * 0.02 - 0.01))
  })).reverse();
}

fetchMetrics();
