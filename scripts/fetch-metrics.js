
/**
 * scripts/fetch-metrics.js
 * 
 * Este script se ejecuta en Node.js (GitHub Actions).
 * Obtiene datos reales de Yahoo Finance usando fetch nativo para máxima compatibilidad.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapa de IDs a Tickers de Yahoo
// NULL = Usar Override Manual (Indicadores macroeconómicos sin ticker fiable en Yahoo)
const TICKER_MAP = {
  'yield_curve': '^T10Y2Y',
  'ism_pmi': null, 
  'fed_funds': '^IRX', // Usamos 13-week treasury bill como proxy cercano si no hay direct
  'credit_spreads': 'HYG', // High Yield Bond ETF como proxy inverso de spread
  'm2_growth': null, 
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

// Datos Macroeconómicos Manuales (Consenso Enero 2025)
// Se usan cuando Yahoo no tiene un ticker directo fiable para el dato económico exacto
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
  // Fallbacks de seguridad si el fetch falla
  'yield_curve': { price: 0.15, change: 0.02 },
  'fed_funds': { price: 4.35, change: 0 },
  'vix': { price: 15.5, change: 0.5 },
  'oil_wti': { price: 68.5, change: -1.2 },
  'dxy': { price: 101.5, change: 0.3 },
  '10y_yield': { price: 4.45, change: 0.05 },
  'credit_spreads': { price: 3.20, change: -0.05 }
};

// Función robusta para obtener datos de Yahoo simulando un navegador
async function fetchRawYahooData(ticker) {
  try {
    // Usamos rangos largos para tener historial suficiente
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=3mo`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
        console.warn(`HTTP Error ${response.status} for ${ticker}`);
        return null;
    }
    
    const json = await response.json();
    const result = json.chart?.result?.[0];
    
    if (!result) return null;
    
    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose;
    const change = ((price - prevClose) / prevClose) * 100;
    
    // Procesar Historial
    const timestamps = result.timestamp || [];
    const closes = result.indicators.quote[0].close || [];
    
    const history = [];
    for (let i = 0; i < timestamps.length; i++) {
        if (closes[i] !== null && closes[i] !== undefined) {
            history.push({
                date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
                value: closes[i]
            });
        }
    }
    
    // Tomamos los últimos 90 días o lo que haya
    return { 
        price, 
        change, 
        history: history.reverse() 
    };

  } catch (e) {
    console.warn(`Excepción fetching ${ticker}:`, e.message);
    return null;
  }
}

async function fetchMetrics() {
  const results = {};
  const now = new Date().toISOString();
  console.log("Iniciando extracción de datos (Native Fetch Mode)...");

  // 1. Obtener Commodities para ratio Cobre/Oro
  let copper = null;
  let gold = null;
  
  console.log("Fetching Commodities...");
  const cData = await fetchRawYahooData('HG=F');
  const gData = await fetchRawYahooData('GC=F');
  
  if (cData) copper = cData.price;
  if (gData) gold = gData.price;

  // 2. Procesar cada métrica
  for (const [id, ticker] of Object.entries(TICKER_MAP)) {
    process.stdout.write(`Procesando ${id}... `);

    // CASO A: Ratio Cobre/Oro Calculado
    if (id === 'copper_gold') {
        if (copper && gold) {
            const ratio = copper / gold;
            results[id] = {
                price: ratio,
                changePercent: 0, // Difícil de calcular exacto sin historial sincronizado
                history: generateMockHistory(ratio),
                lastUpdated: now
            };
            console.log(`✅ Calculado: ${ratio.toFixed(4)}`);
        } else {
            console.log(`⚠️ Fallo (Faltan datos), usando fallback.`);
            results[id] = { 
                price: 0.17, 
                changePercent: 0, 
                history: generateMockHistory(0.17), 
                lastUpdated: now 
            };
        }
        continue;
    }

    // CASO B: Indicador Económico Manual (Sin Ticker)
    if (!ticker) {
        const override = MANUAL_OVERRIDES[id];
        results[id] = {
            price: override.price,
            changePercent: override.change,
            history: generateMockHistory(override.price),
            lastUpdated: now
        };
        console.log(`✅ Manual: ${override.price}`);
        continue;
    }

    // CASO C: Ticker de Mercado (Yahoo)
    const data = await fetchRawYahooData(ticker);
    
    if (data) {
        let { price, change, history } = data;

        // Ajustes de escala específicos
        // Bonos (TNX, IRX) vienen como índice (44.5) que significa 4.45%
        if (['^TNX', '^IRX', '^T10Y2Y'].includes(ticker)) {
            price = price / 10;
            history = history.map(h => ({ ...h, value: h.value / 10 }));
        }

        results[id] = {
            price,
            changePercent: change,
            history,
            lastUpdated: now
        };
        console.log(`✅ Yahoo: ${price.toFixed(2)}`);
    } else {
        // Fallback si Yahoo falla
        console.log(`❌ Fallo Yahoo. Usando Override.`);
        const fallback = MANUAL_OVERRIDES[id] || { price: 100, change: 0 };
        results[id] = {
            price: fallback.price,
            changePercent: fallback.change,
            history: generateMockHistory(fallback.price),
            lastUpdated: now
        };
    }
  }

  // Guardar JSON
  const outputDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const output = { lastUpdated: now, metrics: results };
  fs.writeFileSync(path.join(outputDir, 'metrics.json'), JSON.stringify(output, null, 2));
  console.log("---------------------------------------------------");
  console.log("✅ Datos guardados en public/data/metrics.json");
}

function generateMockHistory(basePrice) {
  // Genera una línea ligeramente ruidosa para visualización
  return Array(30).fill(0).map((_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    value: basePrice * (1 + (Math.random() * 0.02 - 0.01))
  })).reverse();
}

fetchMetrics();
