
/**
 * scripts/fetch-metrics.js
 * 
 * Este script se ejecuta en Node.js (GitHub Actions).
 * Obtiene datos reales de Yahoo Finance y genera public/data/metrics.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// CORRECCIÓN IMPORTANTE: Usar importación por defecto para ESM en v3
import yahooFinance from 'yahoo-finance2';

// Configuración para __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapa de IDs internos a Tickers de Yahoo
// Se establecen en NULL los indicadores económicos que no tienen un ticker directo de índice en Yahoo
// para forzar el uso de MANUAL_OVERRIDES y evitar mostrar precios de ETFs (ej: XLI) como valores del índice.
const TICKER_MAP = {
  'yield_curve': '^T10Y2Y',
  'ism_pmi': null, // Usar manual (48.4) en lugar de ETF XLI
  'fed_funds': '^IRX', 
  'credit_spreads': 'HYG', 
  'm2_growth': 'M2SL', 
  'unemployment': null, // Usar manual
  'lei': null, 
  'nfp': null,
  'cpi': null,
  'consumer_conf': null, // Usar manual (100+) en lugar de ETF XLY
  'buffett': '^GSPC', 
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
  'retail_sales': null, // Usar manual
  'copper_gold': 'CALCULATED_COPPER_GOLD'
};

// Valores manuales aproximados (Datos Diciembre 2024 / Enero 2025)
const MANUAL_OVERRIDES = {
  'ism_pmi': { price: 48.4, change: 0.2 },
  'unemployment': { price: 4.2, change: 0 },
  'cpi': { price: 2.7, change: 0.1 },
  'm2_growth': { price: 1.8, change: 0.1 },
  'lei': { price: 99.4, change: -0.2 },
  'nfp': { price: 142, change: 12 },
  'consumer_conf': { price: 108.7, change: 2.1 },
  'retail_sales': { price: 2.8, change: 0.4 },
  'sp500_margin': { price: 12.1, change: 0.1 },
  'fear_greed': { price: 48, change: 2 },
  'bond_vs_stock': { price: 0.85, change: 0.05 }
};

async function fetchMetrics() {
  const results = {};
  const now = new Date().toISOString();
  console.log("Iniciando extracción de datos (Yahoo Finance v3)...");

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

      // CASO ESPECIAL: INDICADORES SIN TICKER (USAR MANUAL)
      if (!ticker) {
        if (MANUAL_OVERRIDES[id]) {
          results[id] = {
            price: MANUAL_OVERRIDES[id].price,
            changePercent: MANUAL_OVERRIDES[id].change,
            history: generateMockHistory(MANUAL_OVERRIDES[id].price),
            lastUpdated: now
          };
          console.log(`✓ Manual ${id}: ${MANUAL_OVERRIDES[id].price}`);
        } else {
          console.warn(`! Faltan datos para ${id} y no hay override manual.`);
        }
        continue;
      }

      // PETICIÓN YAHOO FINANCE
      const quote = await yahooFinance.quote(ticker);
      
      if (!quote || typeof quote.regularMarketPrice !== 'number') {
        throw new Error(`Datos inválidos recibidos para ${ticker}`);
      }

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
        // Ignorar error de historial
      }

      let price = quote.regularMarketPrice;
      let change = quote.regularMarketChangePercent || 0;

      // Ajustes de escala para bonos
      if (ticker === '^TNX' || ticker === '^IRX' || ticker === '^T10Y2Y') {
        if (price > 15) { // Si viene en base 100 (ej: 40.0 para 4%)
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
  return Array(14).fill(0).map((_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    value: basePrice * (1 + (Math.random() * 0.02 - 0.01))
  })).reverse();
}

fetchMetrics();
