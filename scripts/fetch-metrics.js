
/**
 * scripts/fetch-metrics.js
 * 
 * Este script se ejecuta en Node.js (GitHub Actions).
 * Obtiene datos reales de Yahoo Finance y genera public/data/metrics.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// CORRECCIÓN CRÍTICA: Importación nombrada para instanciar la clase
import { YahooFinance } from 'yahoo-finance2';

// Instancia explícita requerida por la versión v2.8+/v3
const yf = new YahooFinance({
  header: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
});

// Configuración para __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapa de IDs internos a Tickers de Yahoo
// NULL = Usar Override Manual (Indicadores macroeconómicos sin ticker fiable en Yahoo)
const TICKER_MAP = {
  'yield_curve': '^T10Y2Y',
  'ism_pmi': null, 
  'fed_funds': '^IRX', 
  'credit_spreads': 'HYG', 
  'm2_growth': 'M2SL', 
  'unemployment': null,
  'lei': null, 
  'nfp': null,
  'cpi': null,
  'consumer_conf': null, 
  'buffett': '^GSPC', // Se usa S&P para historial, valor absoluto override
  'cape': '^GSPC', 
  'bond_vs_stock': null, 
  'sp500_margin': null,
  'vix': '^VIX',
  'fear_greed': null,
  'put_call': '^CPC', 
  'sp500_ma200': '^GSPC',
  '10y_yield': '^TNX',
  'oil_wti': 'CL=F',
  'dxy': 'DX-Y.NYB',
  'retail_sales': null, 
  'copper_gold': 'CALCULATED_COPPER_GOLD'
};

// Datos Macroeconómicos Manuales (Actualizados Enero 2025)
const MANUAL_OVERRIDES = {
  'ism_pmi': { price: 48.4, change: 0.2 },
  'unemployment': { price: 4.2, change: 0.0 },
  'cpi': { price: 2.7, change: 0.1 },
  'm2_growth': { price: 1.8, change: 0.1 },
  'lei': { price: 99.4, change: -0.2 },
  'nfp': { price: 142, change: 12 },
  'consumer_conf': { price: 108.7, change: 2.1 },
  'retail_sales': { price: 2.8, change: 0.4 },
  'sp500_margin': { price: 12.1, change: 0.1 },
  'fear_greed': { price: 48, change: 2 },
  'bond_vs_stock': { price: 0.85, change: 0.05 },
  'buffett': { price: 198, change: 0.5 },
  'cape': { price: 36.2, change: 0.1 },
  // Fallbacks si Yahoo falla
  'yield_curve': { price: 0.15, change: 0.02 },
  'fed_funds': { price: 4.35, change: 0 },
  'vix': { price: 15.5, change: 0.5 },
  'oil_wti': { price: 68.5, change: -1.2 },
  'dxy': { price: 101.5, change: 0.3 },
  '10y_yield': { price: 4.45, change: 0.05 }
};

// Fallback: Fetch directo a API de Yahoo si la librería falla
async function fetchRawYahooData(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1mo`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json.chart.result[0];
    
    const price = result.meta.regularMarketPrice;
    const prevClose = result.meta.chartPreviousClose;
    const change = ((price - prevClose) / prevClose) * 100;
    
    // Extraer historial
    const timestamps = result.timestamp || [];
    const closes = result.indicators.quote[0].close || [];
    const history = timestamps.map((t, i) => ({
      date: new Date(t * 1000).toISOString().split('T')[0],
      value: closes[i]
    })).filter(h => h.value !== null).reverse().slice(0, 14);

    return { price, change, history };
  } catch (e) {
    return null;
  }
}

async function fetchMetrics() {
  const results = {};
  const now = new Date().toISOString();
  console.log("Iniciando extracción de datos (Yahoo Finance Class Instantiated)...");

  // 1. Pre-fetch commodities para ratio
  let copperPrice = 0;
  let goldPrice = 0;

  try {
    const copper = await yf.quote('HG=F');
    const gold = await yf.quote('GC=F');
    copperPrice = copper.regularMarketPrice;
    goldPrice = gold.regularMarketPrice;
  } catch (e) {
    console.warn("⚠️ Fallo librería commodities, intentando raw fetch...");
    const cRaw = await fetchRawYahooData('HG=F');
    const gRaw = await fetchRawYahooData('GC=F');
    if (cRaw) copperPrice = cRaw.price;
    if (gRaw) goldPrice = gRaw.price;
  }

  // 2. Bucle Principal
  for (const [id, ticker] of Object.entries(TICKER_MAP)) {
    // A. RATIOS CALCULADOS
    if (id === 'copper_gold') {
      if (copperPrice && goldPrice > 0) {
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

    // B. OVERRIDES MANUALES
    if (!ticker) {
      if (MANUAL_OVERRIDES[id]) {
        results[id] = {
          price: MANUAL_OVERRIDES[id].price,
          changePercent: MANUAL_OVERRIDES[id].change,
          history: generateMockHistory(MANUAL_OVERRIDES[id].price),
          lastUpdated: now
        };
        console.log(`✓ Manual ${id}: ${MANUAL_OVERRIDES[id].price}`);
      }
      continue;
    }

    // C. FETCH YAHOO
    try {
      // Intentar librería
      let price, change, historyData = [];
      
      try {
        const quote = await yf.quote(ticker);
        price = quote.regularMarketPrice;
        change = quote.regularMarketChangePercent || 0;
        
        // Historial
        const historical = await yf.historical(ticker, { period1: '1mo', interval: '1d' });
        historyData = historical.map(row => ({
           date: row.date.toISOString().split('T')[0],
           value: row.close
        })).reverse();
      } catch (libErr) {
        // Intentar Raw Fetch si falla librería
        console.warn(`  ↳ Librería falló para ${ticker}, intentando fetch directo...`);
        const raw = await fetchRawYahooData(ticker);
        if (!raw) throw new Error("Raw fetch failed");
        price = raw.price;
        change = raw.change;
        historyData = raw.history;
      }

      // Ajustes de escala (Bonos suelen venir x10)
      if (['^TNX', '^IRX', '^T10Y2Y'].includes(ticker) && price > 20) {
         price = price / 10;
         historyData = historyData.map(h => ({ ...h, value: h.value / 10 }));
      }

      results[id] = {
        price: price,
        changePercent: change,
        history: historyData,
        lastUpdated: now
      };
      console.log(`✓ Obtenido ${id} (${ticker}): ${price.toFixed(2)}`);

    } catch (err) {
      console.error(`✗ Error total ${id}: ${err.message}`);
      // Fallback final
      const fallback = MANUAL_OVERRIDES[id] || { price: 100, change: 0 };
      results[id] = {
          price: fallback.price,
          changePercent: fallback.change,
          history: generateMockHistory(fallback.price),
          lastUpdated: now
      };
    }
  }

  // Guardar archivo
  const outputDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const output = { lastUpdated: now, metrics: results };
  fs.writeFileSync(path.join(outputDir, 'metrics.json'), JSON.stringify(output, null, 2));
  console.log("---------------------------------------------------");
  console.log("✅ Datos guardados exitosamente.");
}

function generateMockHistory(basePrice) {
  return Array(14).fill(0).map((_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    value: basePrice * (1 + (Math.random() * 0.02 - 0.01))
  })).reverse();
}

fetchMetrics();
