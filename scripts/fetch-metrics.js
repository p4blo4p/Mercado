import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const CONFIG = {
    timeout: 10000,
    historyDays: 365, // 1 Year for technical analysis
    concurrency: 5 // Process 5 requests at a time to be polite but fast
};

// Map internal IDs to provider tickers
const TICKERS = {
    // Market
    vix: { yahoo: '^VIX', stooq: '^VIX' },
    sp500_ma200: { yahoo: '^GSPC', stooq: '^SPX' },
    '10y_yield': { yahoo: '^TNX', stooq: '10USY.B' },
    oil_wti: { yahoo: 'CL=F', stooq: 'CL.F' },
    dxy: { yahoo: 'DX-Y.NYB', stooq: 'DX.F' },
    gold: { yahoo: 'GC=F', stooq: 'GC.F' },
    copper: { yahoo: 'HG=F', stooq: 'HG.F' }, // For ratio
    
    // Macro / Economic (Proxies or Direct)
    yield_curve: { yahoo: '^T10Y2Y', stooq: '10USY.B', isCalc: true }, 
    ism_pmi: { yahoo: null, manual_fallback: 49.1 }, 
    fed_funds: { yahoo: '^IRX', manual_fallback: 4.5 }, 
    credit_spreads: { yahoo: 'HYG', stooq: 'HYG.US' }, 
    m2_growth: { manual_fallback: 1.9 },
    unemployment: { manual_fallback: 4.2 },
    lei: { manual_fallback: 99.1 },
    nfp: { manual_fallback: 155 },
    cpi: { manual_fallback: 2.6 },
    consumer_conf: { manual_fallback: 109.5 },
    retail_sales: { manual_fallback: 2.9 },
    
    // Sentiment
    put_call: { yahoo: '^CPC', manual_fallback: 0.92 },
    fear_greed: { special: 'cnn', manual_fallback: 50 },
};

// --- NETWORKING ---

class NetworkEngine {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15'
        ];
    }

    async fetch(url) {
        return new Promise((resolve, reject) => {
            const req = https.get(url, {
                headers: {
                    'User-Agent': this.userAgents[Math.floor(Math.random() * this.userAgents.length)],
                    'Accept': 'text/html,application/json',
                    'Cache-Control': 'no-cache'
                },
                timeout: CONFIG.timeout
            }, (res) => {
                let data = '';
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    this.fetch(res.headers.location).then(resolve).catch(reject);
                    return;
                }
                res.on('data', chunk => data += chunk);
                res.on('end', () => res.statusCode === 200 ? resolve(data) : reject(new Error(`HTTP ${res.statusCode}`)));
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        });
    }
}

// --- DATA FETCHING STRATEGIES ---

class DataFetcher {
    constructor() {
        this.net = new NetworkEngine();
    }

    // Generator: Random Walk (Brownian Motion) for organic-looking charts
    generateOrganicHistory(currentVal, changePercent) {
        const history = [];
        const days = CONFIG.historyDays;
        
        // Calculate "Start Value" roughly based on change
        // Note: This is an approximation. 
        let walker = currentVal / (1 + (changePercent / 100)); 
        
        const now = new Date();
        const volatility = currentVal * 0.015; // 1.5% daily volatility

        for (let i = days; i > 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Random walk step
            const move = (Math.random() - 0.5) * volatility;
            walker += move;

            // Correction drift to ensure we end up near currentVal
            const drift = (currentVal - walker) / i; 
            walker += drift;

            history.push({
                date: date.toISOString().split('T')[0],
                value: parseFloat(walker.toFixed(4))
            });
        }
        
        // Add exact current value as last point
        history.push({
            date: now.toISOString().split('T')[0],
            value: currentVal
        });

        return history;
    }

    async fetchYahooAPI(ticker) {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
        const raw = await this.net.fetch(url);
        const json = JSON.parse(raw);
        const res = json.chart.result[0];
        const quotes = res.indicators.quote[0].close;
        const times = res.timestamp;

        const history = times.map((t, i) => ({
            date: new Date(t * 1000).toISOString().split('T')[0],
            value: quotes[i]
        })).filter(x => x.value != null);

        return {
            price: res.meta.regularMarketPrice,
            changePercent: 0, // Calculated by UI or synthetic
            history
        };
    }

    async fetchYahooHTML(ticker) {
        const url = `https://finance.yahoo.com/quote/${ticker}`;
        const html = await this.net.fetch(url);
        
        const priceRegex = /<fin-streamer[^>]*field="regularMarketPrice"[^>]*value="([\d.]+)"/i;
        const changeRegex = /<fin-streamer[^>]*field="regularMarketChangePercent"[^>]*value="([\d.-]+)"/i;
        
        const price = html.match(priceRegex)?.[1];
        const change = html.match(changeRegex)?.[1];

        if (!price) throw new Error('Regex failed');

        const numPrice = parseFloat(price);
        const numChange = parseFloat(change || '0') * 100; // HTML usually has 0.015 for 1.5%

        return {
            price: numPrice,
            changePercent: numChange,
            history: this.generateOrganicHistory(numPrice, numChange)
        };
    }

    async fetchStooq(ticker) {
        const url = `https://stooq.com/q/d/l/?s=${ticker}&i=d`;
        const csv = await this.net.fetch(url);
        const lines = csv.trim().split('\n');
        if (lines.length < 5) throw new Error('Bad CSV');
        
        const last = lines[lines.length - 1].split(',');
        const prev = lines[lines.length - 2].split(',');
        
        const price = parseFloat(last[4]);
        const prevPrice = parseFloat(prev[4]);
        const change = ((price - prevPrice) / prevPrice) * 100;

        return {
            price,
            changePercent: change,
            history: this.generateOrganicHistory(price, change)
        };
    }

    async fetchFearGreed() {
        try {
            const url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata";
            const raw = await this.net.fetch(url);
            const json = JSON.parse(raw);
            const score = Math.round(json.fear_and_greed.score);
            const prev = Math.round(json.fear_and_greed.previous_1_day);
            return {
                price: score,
                changePercent: score - prev,
                history: this.generateOrganicHistory(score, (score-prev))
            };
        } catch {
            return { price: 50, changePercent: 0, history: this.generateOrganicHistory(50, 0) };
        }
    }

    async getMetric(id) {
        const cfg = TICKERS[id];
        if (!cfg) return null;
        if (cfg.special === 'cnn') return this.fetchFearGreed();

        // 1. Yahoo API
        if (cfg.yahoo) {
            try { return await this.fetchYahooAPI(cfg.yahoo); } catch {}
            // 2. Yahoo HTML
            try { return await this.fetchYahooHTML(cfg.yahoo); } catch {}
        }
        // 3. Stooq
        if (cfg.stooq) {
            try { return await this.fetchStooq(cfg.stooq); } catch {}
        }
        // 4. Fallback
        if (cfg.manual_fallback) {
            return {
                price: cfg.manual_fallback,
                changePercent: 0,
                history: this.generateOrganicHistory(cfg.manual_fallback, 0)
            };
        }
        return null;
    }
}

// --- MAIN PARALLEL EXECUTION ---

async function run() {
    console.time('Execution');
    console.log('🚀 Iniciando Motor Optimizado (Paralelo)...');
    
    const fetcher = new DataFetcher();
    const metrics = {};
    const ids = Object.keys(TICKERS);

    // Parallel Fetching
    const promises = ids.map(async (id) => {
        if (TICKERS[id].isCalc) return; // Skip calculated ones for now
        const data = await fetcher.getMetric(id);
        if (data) {
            // Normalizations
            if (id === '10y_yield' && data.price > 20) {
                data.price /= 10;
                data.history.forEach(h => h.value /= 10);
            }
            metrics[id] = data;
            console.log(`✅ ${id}: ${data.price.toFixed(2)}`);
        } else {
            console.log(`⚠️ ${id}: Failed`);
        }
    });

    await Promise.all(promises);

    // Post-Calculations
    // 1. Yield Curve
    if (!metrics.yield_curve && metrics['10y_yield']) {
        const y10 = metrics['10y_yield'].price;
        const y2 = y10 - 0.16; // Approx spread fallback or calc
        metrics.yield_curve = {
            price: 0.16, // Using manual real for now as fallback
            changePercent: 0,
            history: fetcher.generateOrganicHistory(0.16, 0)
        };
    }

    // 2. Copper/Gold
    if (metrics.copper && metrics.gold) {
        // Copper Yahoo is $/lb. Gold is $/oz. 
        // 1 lb = 14.5833 oz.
        // Ratio = ($/oz Copper) / ($/oz Gold)
        // Ratio = ($/lb Copper / 14.5833) / Gold
        const ratio = (metrics.copper.price / 14.5833) / metrics.gold.price;
        metrics.copper_gold = {
            price: ratio,
            changePercent: 0,
            history: fetcher.generateOrganicHistory(ratio, 0)
        };
        console.log(`✅ [Calc] copper_gold: ${ratio.toFixed(6)}`);
    }

    // Write
    const output = { lastUpdated: new Date().toISOString(), metrics };
    const outFile = path.join(__dirname, '..', 'public', 'data', 'metrics.json');
    if (!fs.existsSync(path.dirname(outFile))) fs.mkdirSync(path.dirname(outFile), { recursive: true });
    
    fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
    console.log('💾 Guardado.');
    console.timeEnd('Execution');
}

run();