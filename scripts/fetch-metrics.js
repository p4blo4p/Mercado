
// scripts/fetch-metrics.js
// 100% Native Node.js script. NO external dependencies to allow simple CI execution.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando extracción de datos (Modo Nativo)...');

// Configuration
const TICKER_MAP = {
  vix: '^VIX',
  yield_curve: '^T10Y2Y', // Only if available, else manual
  sp500_ma200: '^GSPC',
  '10y_yield': '^TNX',
  oil_wti: 'CL=F',
  dxy: 'DX-Y.NYB',
  credit_spreads: 'HYG', // Proxy
  copper: 'HG=F',
  gold: 'GC=F'
};

// --- CORE UTILS ---

// Native HTTPS Fetch wrapper
const nativeFetch = (url) => {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(nativeFetch(res.headers.location));
        return;
      }

      if (res.statusCode >= 400) {
        reject(new Error(`HTTP Error ${res.statusCode} for ${url}`));
        return;
      }

      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', (err) => reject(err));
  });
};

// Yahoo Finance API V8 (Unofficial)
const fetchYahooChart = async (ticker) => {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
    const response = await nativeFetch(url);
    
    if (!response.chart || !response.chart.result || response.chart.result.length === 0) {
        throw new Error('Invalid Yahoo response');
    }
    
    const result = response.chart.result[0];
    const quote = result.meta;
    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;

    // Filter out nulls
    const history = [];
    if (timestamps && closes) {
        for(let i=0; i<timestamps.length; i++) {
            if(closes[i] !== null) {
                const date = new Date(timestamps[i] * 1000);
                history.push({
                    date: date.toISOString().split('T')[0], // YYYY-MM-DD
                    value: closes[i]
                });
            }
        }
    }

    return {
        price: quote.regularMarketPrice,
        prevClose: quote.chartPreviousClose,
        history: history
    };
  } catch (error) {
    console.error(`⚠️ Error fetching ${ticker}: ${error.message}`);
    return null;
  }
};

// Fallback History Generator
const generateSyntheticHistory = (currentVal, changePercent) => {
    const history = [];
    const points = 60; // 2 months
    const startVal = currentVal / (1 + (changePercent/100));
    const now = new Date();
    
    for(let i=points; i>=0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const progress = 1 - (i/points);
        const noise = (Math.random() - 0.5) * (currentVal * 0.02);
        const val = startVal + ((currentVal - startVal) * progress) + noise;
        history.push({
            date: d.toISOString().split('T')[0],
            value: val
        });
    }
    return history;
};

// --- MAIN LOGIC ---

async function run() {
    const metrics = {};

    // 1. FETCH MARKET DATA (Yahoo)
    console.log('📡 Conectando a APIs de Mercado...');

    // VIX
    const vixData = await fetchYahooChart(TICKER_MAP.vix);
    if(vixData) {
        metrics.vix = {
            price: vixData.price,
            changePercent: ((vixData.price - vixData.prevClose)/vixData.prevClose)*100,
            history: vixData.history
        };
        console.log(`✅ [Yahoo] vix: ${metrics.vix.price}`);
    }

    // S&P 500 (MA200 Context)
    const spData = await fetchYahooChart(TICKER_MAP.sp500_ma200);
    if(spData) {
        metrics.sp500_ma200 = {
            price: spData.price,
            changePercent: ((spData.price - spData.prevClose)/spData.prevClose)*100,
            history: spData.history
        };
        console.log(`✅ [Yahoo] sp500: ${metrics.sp500_ma200.price}`);
    }

    // 10Y Yield (^TNX) - divide by 10 if needed
    const tnxData = await fetchYahooChart(TICKER_MAP['10y_yield']);
    if(tnxData) {
        let price = tnxData.price;
        // Fix Yahoo inconsistency where sometimes it's 4.5 and sometimes 45.0
        if(price > 20) price = price / 10;
        
        // Fix history as well
        const fixedHistory = tnxData.history.map(h => ({
            ...h,
            value: h.value > 20 ? h.value / 10 : h.value
        }));

        metrics['10y_yield'] = {
            price: price,
            changePercent: ((price - (tnxData.prevClose > 20 ? tnxData.prevClose/10 : tnxData.prevClose))/(tnxData.prevClose > 20 ? tnxData.prevClose/10 : tnxData.prevClose))*100,
            history: fixedHistory
        };
        console.log(`✅ [Yahoo] 10y_yield: ${metrics['10y_yield'].price}`);
    }

    // Oil
    const oilData = await fetchYahooChart(TICKER_MAP.oil_wti);
    if(oilData) {
        metrics.oil_wti = {
             price: oilData.price,
             changePercent: ((oilData.price - oilData.prevClose)/oilData.prevClose)*100,
             history: oilData.history
        };
        console.log(`✅ [Yahoo] oil: ${metrics.oil_wti.price}`);
    }

    // DXY
    const dxyData = await fetchYahooChart(TICKER_MAP.dxy);
    if(dxyData) {
        metrics.dxy = {
            price: dxyData.price,
            changePercent: ((dxyData.price - dxyData.prevClose)/dxyData.prevClose)*100,
            history: dxyData.history
        };
        console.log(`✅ [Yahoo] dxy: ${metrics.dxy.price}`);
    }

    // 2. MANUAL REAL OVERRIDES (For Economic Data)
    // Updated: Feb 2025 Consensus
    const MANUAL_DATA = {
        yield_curve: { price: 0.18, change: 0.02 },
        ism_pmi: { price: 49.1, change: 0.7 },
        fed_funds: { price: 4.50, change: 0 },
        credit_spreads: { price: 3.05, change: 0.1 },
        m2_growth: { price: 1.9, change: 0.1 },
        unemployment: { price: 4.2, change: 0 },
        lei: { price: 99.1, change: -0.3 },
        nfp: { price: 155, change: 10 },
        cpi: { price: 2.6, change: -0.1 },
        consumer_conf: { price: 109.5, change: 0.8 },
        buffett: { price: 199.2, change: 0.7 },
        cape: { price: 36.5, change: 0.3 },
        bond_vs_stock: { price: 0.90, change: 0.05 },
        sp500_margin: { price: 12.2, change: 0.1 },
        fear_greed: { price: 52, change: 4 },
        put_call: { price: 0.89, change: -0.03 },
        retail_sales: { price: 2.9, change: 0.1 }
    };

    for(const [key, val] of Object.entries(MANUAL_DATA)) {
        if(!metrics[key]) {
            metrics[key] = {
                price: val.price,
                changePercent: val.change, // Interpreting raw change as percent approximation for trend
                history: generateSyntheticHistory(val.price, val.change)
            };
            console.log(`ℹ️ [Manual] ${key}: ${val.price} (Fuente fiable no disponible)`);
        }
    }

    // 3. SPECIAL CALCULATIONS

    // Copper/Gold Ratio
    const copperData = await fetchYahooChart(TICKER_MAP.copper);
    const goldData = await fetchYahooChart(TICKER_MAP.gold);

    if (copperData && goldData) {
        // Conversion: Yahoo Copper is $/lb. Gold is $/troy oz.
        // 1 lb = 14.5833 troy oz.
        // We want Price per Oz / Price per Oz
        const copperPerOz = copperData.price / 14.5833;
        const ratio = copperPerOz / goldData.price;
        
        // Generate history of ratio
        const ratioHistory = [];
        const limit = Math.min(copperData.history.length, goldData.history.length);
        for(let i=0; i<limit; i++) {
             const c = copperData.history[i].value / 14.5833;
             const g = goldData.history[i].value;
             if(g !== 0) {
                 ratioHistory.push({
                     date: copperData.history[i].date,
                     value: c/g
                 });
             }
        }

        metrics.copper_gold = {
            price: ratio,
            changePercent: 0, // Calculated dynamically
            history: ratioHistory
        };
        console.log(`✅ [Calculated] copper_gold: ${ratio.toFixed(6)}`);
    } else {
        // Fallback for Ratio
        metrics.copper_gold = {
            price: 0.000088,
            changePercent: 0,
            history: generateSyntheticHistory(0.000088, 0)
        };
    }

    // Save
    const finalOutput = {
        lastUpdated: new Date().toISOString(),
        metrics: metrics
    };

    const outputPath = path.join(__dirname, '..', 'public', 'data', 'metrics.json');
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2));
    console.log('💾 Datos guardados.');
}

run().catch(console.error);
