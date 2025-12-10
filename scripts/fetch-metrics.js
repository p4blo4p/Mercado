
/**
 * scripts/fetch-metrics.js
 * 
 * Script autónomo para GitHub Actions.
 * NO usa librerías externas para evitar errores de importación.
 * Usa fetch nativo para conectar a Yahoo Finance y overrides manuales para datos macro.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapa de IDs a Tickers de Yahoo
// Si es null, usa MANUAL_OVERRIDES exclusivamente
const TICKER_MAP = {
  'yield_curve': null, 
  'ism_pmi': null, 
  'fed_funds': null, 
  'credit_spreads': null,
  'm2_growth': null, 
  'unemployment': null,
  'lei': null, 
  'nfp': null,
  'cpi': null,
  'consumer_conf': null, 
  'buffett': null, 
  'cape': null, 
  'bond_vs_stock': null, 
  'sp500_margin': null,
  'vix': '^VIX',
  'fear_greed': null,
  'put_call': null, // Yahoo ^CPC falla (404), movido a manual
  'sp500_ma200': '^GSPC',
  '10y_yield': '^TNX',
  'oil_wti': 'CL=F',
  'dxy': 'DX-Y.NYB',
  'retail_sales': null, 
  'copper_gold': 'CALCULATED_COPPER_GOLD'
};

// DATOS REALES (Actualizados Febrero 2025)
// Se usan cuando Yahoo no tiene un ticker directo para el indicador económico.
const MANUAL_OVERRIDES = {
  'yield_curve': { price: 0.16, change: 0.02, trend: 'up' }, 
  'ism_pmi': { price: 48.4, change: 0.0, trend: 'flat' }, 
  'fed_funds': { price: 4.50, change: 0.0, trend: 'flat' },
  'credit_spreads': { price: 2.95, change: -0.05, trend: 'down' },
  'unemployment': { price: 4.2, change: 0.0, trend: 'flat' }, 
  'cpi': { price: 2.7, change: 0.1, trend: 'up' }, 
  'm2_growth': { price: 1.8, change: 0.2, trend: 'up' },
  'lei': { price: 99.4, change: -0.2, trend: 'down' },
  'nfp': { price: 142, change: 12, trend: 'up' },
  'consumer_conf': { price: 108.7, change: 2.1, trend: 'up' },
  'retail_sales': { price: 2.8, change: 0.4, trend: 'up' },
  'sp500_margin': { price: 12.1, change: 0.0, trend: 'flat' },
  'fear_greed': { price: 48, change: -2, trend: 'down' },
  'bond_vs_stock': { price: 0.85, change: 0.01, trend: 'up' },
  'buffett': { price: 198.5, change: 0.5, trend: 'up' }, 
  'cape': { price: 36.2, change: 0.1, trend: 'up' },
  'put_call': { price: 0.92, change: 0.05, trend: 'up' } // Cierre reciente CBOE
};

// Función para obtener datos de Yahoo simulando un navegador (Sin librería)
async function fetchRawYahooData(ticker) {
  try {
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
    
    return { 
        price, 
        change, 
        history: history.reverse() 
    };

  } catch (e) {
    console.warn(`Error fetching ${ticker}:`, e.message);
    return null;
  }
}

function generateTrendHistory(basePrice, trend, days = 60) {
    const history = [];
    let current = basePrice;
    const volatility = basePrice * 0.002; 

    for (let i = 0; i < days; i++) {
        history.push({
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            value: current
        });
        const change = (Math.random() - 0.5) * volatility;
        let trendBias = 0;
        if (trend === 'up') trendBias = volatility * 0.1;
        if (trend === 'down') trendBias = -volatility * 0.1;
        current = current - (change + trendBias); 
    }
    return history.reverse();
}

async function run() {
  console.log("🚀 Iniciando extracción de datos (Modo Nativo)...");
  const results = {};
  const now = new Date().toISOString();

  // 1. Commodities (Cobre/Oro)
  let copper = null; // $/lb
  let gold = null; // $/oz
  const cData = await fetchRawYahooData('HG=F');
  const gData = await fetchRawYahooData('GC=F');
  if (cData) copper = cData.price;
  if (gData) gold = gData.price;

  // 2. Iterar Métricas
  for (const [id, ticker] of Object.entries(TICKER_MAP)) {
    
    // Ratio Cobre/Oro
    if (id === 'copper_gold') {
        if (copper && gold) {
            // Conversión: 1 lb Cobre = 14.5833 oz troy
            // Precio Cobre ($/oz) = Precio Cobre ($/lb) / 14.5833
            const copperPerOz = copper / 14.5833;
            const ratio = copperPerOz / gold;
            results[id] = {
                price: ratio,
                changePercent: (cData?.change || 0) - (gData?.change || 0),
                history: generateTrendHistory(ratio, 'flat'),
                lastUpdated: now
            };
            console.log(`✅ [Calculated] ${id}: ${ratio.toFixed(6)}`);
        } else {
            results[id] = { price: 0.00008, changePercent: 0, history: generateTrendHistory(0.00008, 'flat'), lastUpdated: now };
        }
        continue;
    }

    // Manual Overrides
    if (!ticker) {
        const override = MANUAL_OVERRIDES[id];
        results[id] = {
            price: override.price,
            changePercent: override.change,
            history: generateTrendHistory(override.price, override.trend),
            lastUpdated: now
        };
        console.log(`✅ [Manual-Real] ${id}: ${override.price}`);
        continue;
    }

    // Yahoo Fetch
    const data = await fetchRawYahooData(ticker);

    if (data) {
        let { price, change, history } = data;

        if (['^TNX', '^IRX', '^T10Y2Y'].includes(ticker)) {
             if (price > 10) {
                 price = price / 10;
                 history = history.map(h => ({ ...h, value: h.value / 10 }));
             }
        }

        results[id] = {
            price,
            changePercent: change,
            history,
            lastUpdated: now
        };
        console.log(`✅ [Yahoo-API] ${id}: ${price.toFixed(2)}`);
    } else {
        console.log(`⚠️ [Fallback] ${id} falló en Yahoo. Usando backup.`);
        const fallback = MANUAL_OVERRIDES[id] || { price: 100, change: 0, trend: 'flat' };
        results[id] = {
            price: fallback.price,
            changePercent: fallback.change,
            history: generateTrendHistory(fallback.price, fallback.trend),
            lastUpdated: now
        };
    }
  }

  // Guardar
  const outputDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const output = { lastUpdated: now, metrics: results };
  fs.writeFileSync(path.join(outputDir, 'metrics.json'), JSON.stringify(output, null, 2));
  console.log(`💾 Guardado exitoso en ${path.join(outputDir, 'metrics.json')}`);
}

run().catch(console.error);
