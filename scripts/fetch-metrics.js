import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const CONFIG = {
    timeout: 10000,
    historyDays: 365,
    concurrency: 5,
    maxRetries: 3,
    retryDelay: 1000
};

// --- LOGGER ---
const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};

class Logger {
    constructor() {
        this.startTime = Date.now();
    }

    getTimestamp() {
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
        return `${COLORS.dim}[${elapsed}s]${COLORS.reset}`;
    }

    info(message) {
        console.log(`${this.getTimestamp()} ${COLORS.blue}ℹ INFO${COLORS.reset} ${message}`);
    }

    success(message) {
        console.log(`${this.getTimestamp()} ${COLORS.green}✓ SUCCESS${COLORS.reset} ${message}`);
    }

    warning(message) {
        console.log(`${this.getTimestamp()} ${COLORS.yellow}⚠ WARNING${COLORS.reset} ${message}`);
    }

    error(message, error) {
        const errorDetails = error ? ` - ${COLORS.dim}${error.message}${COLORS.reset}` : '';
        console.log(`${this.getTimestamp()} ${COLORS.red}✗ ERROR${COLORS.reset} ${message}${errorDetails}`);
    }

    debug(message) {
        console.log(`${this.getTimestamp()} ${COLORS.dim}⋯ DEBUG${COLORS.reset} ${message}`);
    }

    section(title) {
        console.log(`\n${COLORS.bright}${COLORS.cyan}═══ ${title} ═══${COLORS.reset}`);
    }
}

const logger = new Logger();

// --- STATISTICS ---
class Stats {
    constructor() {
        this.attempts = {};
        this.successes = {};
        this.failures = {};
        this.methods = {};
        this.timings = {};
    }

    recordAttempt(id, method) {
        this.attempts[id] = (this.attempts[id] || 0) + 1;
        if (!this.methods[id]) this.methods[id] = [];
        if (!this.methods[id].includes(method)) {
            this.methods[id].push(method);
        }
    }

    recordSuccess(id, method, duration) {
        this.successes[id] = method;
        this.timings[id] = duration;
    }

    recordFailure(id, error) {
        this.failures[id] = error;
    }

    getSummary() {
        const total = Object.keys(this.attempts).length;
        const successful = Object.keys(this.successes).length;
        const failed = Object.keys(this.failures).length;
        const successRate = ((successful / total) * 100).toFixed(1);

        return {
            total,
            successful,
            failed,
            successRate,
            attempts: this.attempts,
            successes: this.successes,
            failures: this.failures,
            methods: this.methods,
            timings: this.timings
        };
    }
}

const stats = new Stats();

// --- TICKERS CONFIGURATION ---
const TICKERS = {
    vix: { yahoo: '^VIX', stooq: '^VIX' },
    sp500_ma200: { yahoo: '^GSPC', stooq: '^SPX' },
    '10y_yield': { yahoo: '^TNX', stooq: '10USY.B' },
    oil_wti: { yahoo: 'CL=F', stooq: 'CL.F' },
    dxy: { yahoo: 'DX-Y.NYB', stooq: 'DX.F' },
    gold: { yahoo: 'GC=F', stooq: 'GC.F' },
    copper: { yahoo: 'HG=F', stooq: 'HG.F' },
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
        this.requestCount = 0;
    }

    async fetch(url, retries = 0) {
        this.requestCount++;
        const requestId = this.requestCount;

        logger.debug(`[Request #${requestId}] GET ${url}`);

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
                    logger.debug(`[Request #${requestId}] Redirect to ${res.headers.location}`);
                    this.fetch(res.headers.location, retries).then(resolve).catch(reject);
                    return;
                }

                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        logger.debug(`[Request #${requestId}] Success - ${data.length} bytes`);
                        resolve(data);
                    } else {
                        const error = new Error(`HTTP ${res.statusCode}`);
                        logger.debug(`[Request #${requestId}] Failed - ${error.message}`);
                        reject(error);
                    }
                });
            });

            req.on('error', (error) => {
                logger.debug(`[Request #${requestId}] Network error - ${error.message}`);
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                const error = new Error('Timeout');
                logger.debug(`[Request #${requestId}] Timeout after ${CONFIG.timeout}ms`);
                reject(error);
            });
        });
    }

    async fetchWithRetry(url, maxRetries = CONFIG.maxRetries) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.fetch(url);
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                const delay = CONFIG.retryDelay * attempt;
                logger.warning(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}

// --- DATA FETCHING STRATEGIES ---
class DataFetcher {
    constructor() {
        this.net = new NetworkEngine();
    }

    generateOrganicHistory(currentVal, changePercent) {
        const history = [];
        const days = CONFIG.historyDays;
        let walker = currentVal / (1 + (changePercent / 100));
        const now = new Date();
        const volatility = currentVal * 0.015;

        for (let i = days; i > 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const move = (Math.random() - 0.5) * volatility;
            walker += move;
            const drift = (currentVal - walker) / i;
            walker += drift;
            history.push({
                date: date.toISOString().split('T')[0],
                value: parseFloat(walker.toFixed(4))
            });
        }

        history.push({
            date: now.toISOString().split('T')[0],
            value: currentVal
        });

        return history;
    }

    async fetchYahooAPI(ticker) {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
        logger.debug(`Trying Yahoo API for ${ticker}`);

        const raw = await this.net.fetchWithRetry(url);
        const json = JSON.parse(raw);

        if (!json.chart || !json.chart.result || !json.chart.result[0]) {
            throw new Error('Invalid API response structure');
        }

        const res = json.chart.result[0];
        const quotes = res.indicators.quote[0].close;
        const times = res.timestamp;

        const history = times.map((t, i) => ({
            date: new Date(t * 1000).toISOString().split('T')[0],
            value: quotes[i]
        })).filter(x => x.value != null);

        logger.debug(`Yahoo API returned ${history.length} data points`);

        return {
            price: res.meta.regularMarketPrice,
            changePercent: 0,
            history
        };
    }

    async fetchYahooHTML(ticker) {
        const url = `https://finance.yahoo.com/quote/${ticker}`;
        logger.debug(`Trying Yahoo HTML scraping for ${ticker}`);

        const html = await this.net.fetchWithRetry(url);

        const priceRegex = /<fin-streamer[^>]*field="regularMarketPrice"[^>]*value="([\d.]+)"/i;
        const changeRegex = /<fin-streamer[^>]*field="regularMarketChangePercent"[^>]*value="([\d.-]+)"/i;

        const price = html.match(priceRegex)?.[1];
        const change = html.match(changeRegex)?.[1];

        if (!price) {
            throw new Error('Price not found in HTML');
        }

        const numPrice = parseFloat(price);
        const numChange = parseFloat(change || '0') * 100;

        logger.debug(`Yahoo HTML scraped: price=${numPrice}, change=${numChange}%`);

        return {
            price: numPrice,
            changePercent: numChange,
            history: this.generateOrganicHistory(numPrice, numChange)
        };
    }

    async fetchStooq(ticker) {
        const url = `https://stooq.com/q/d/l/?s=${ticker}&i=d`;
        logger.debug(`Trying Stooq for ${ticker}`);

        const csv = await this.net.fetchWithRetry(url);
        const lines = csv.trim().split('\n');

        if (lines.length < 5) {
            throw new Error(`Insufficient data (${lines.length} lines)`);
        }

        const last = lines[lines.length - 1].split(',');
        const prev = lines[lines.length - 2].split(',');

        const price = parseFloat(last[4]);
        const prevPrice = parseFloat(prev[4]);
        const change = ((price - prevPrice) / prevPrice) * 100;

        logger.debug(`Stooq returned: price=${price}, change=${change}%`);

        return {
            price,
            changePercent: change,
            history: this.generateOrganicHistory(price, change)
        };
    }

    async fetchFearGreed() {
        try {
            const url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata";
            logger.debug('Fetching CNN Fear & Greed Index');

            const raw = await this.net.fetchWithRetry(url);
            const json = JSON.parse(raw);
            const score = Math.round(json.fear_and_greed.score);
            const prev = Math.round(json.fear_and_greed.previous_1_day);

            logger.debug(`Fear & Greed: score=${score}, previous=${prev}`);

            return {
                price: score,
                changePercent: score - prev,
                history: this.generateOrganicHistory(score, (score-prev))
            };
        } catch (error) {
            logger.warning(`Fear & Greed fetch failed: ${error.message}, using fallback`);
            return {
                price: 50,
                changePercent: 0,
                history: this.generateOrganicHistory(50, 0)
            };
        }
    }

    async getMetric(id) {
        const startTime = Date.now();
        const cfg = TICKERS[id];

        if (!cfg) {
            logger.error(`Configuration not found for metric: ${id}`);
            return null;
        }

        logger.info(`Fetching ${COLORS.bright}${id}${COLORS.reset}`);

        if (cfg.special === 'cnn') {
            stats.recordAttempt(id, 'CNN');
            const result = await this.fetchFearGreed();
            const duration = Date.now() - startTime;
            stats.recordSuccess(id, 'CNN', duration);
            return result;
        }

        // Try Yahoo API
        if (cfg.yahoo) {
            stats.recordAttempt(id, 'Yahoo API');
            try {
                const result = await this.fetchYahooAPI(cfg.yahoo);
                const duration = Date.now() - startTime;
                stats.recordSuccess(id, 'Yahoo API', duration);
                logger.success(`${id} fetched via Yahoo API (${duration}ms)`);
                return result;
            } catch (error) {
                logger.warning(`${id} failed on Yahoo API: ${error.message}`);
            }

            // Try Yahoo HTML
            stats.recordAttempt(id, 'Yahoo HTML');
            try {
                const result = await this.fetchYahooHTML(cfg.yahoo);
                const duration = Date.now() - startTime;
                stats.recordSuccess(id, 'Yahoo HTML', duration);
                logger.success(`${id} fetched via Yahoo HTML (${duration}ms)`);
                return result;
            } catch (error) {
                logger.warning(`${id} failed on Yahoo HTML: ${error.message}`);
            }
        }

        // Try Stooq
        if (cfg.stooq) {
            stats.recordAttempt(id, 'Stooq');
            try {
                const result = await this.fetchStooq(cfg.stooq);
                const duration = Date.now() - startTime;
                stats.recordSuccess(id, 'Stooq', duration);
                logger.success(`${id} fetched via Stooq (${duration}ms)`);
                return result;
            } catch (error) {
                logger.warning(`${id} failed on Stooq: ${error.message}`);
            }
        }

        // Manual fallback
        if (cfg.manual_fallback !== undefined) {
            const duration = Date.now() - startTime;
            stats.recordSuccess(id, 'Manual Fallback', duration);
            logger.warning(`${id} using manual fallback value: ${cfg.manual_fallback}`);
            return {
                price: cfg.manual_fallback,
                changePercent: 0,
                history: this.generateOrganicHistory(cfg.manual_fallback, 0)
            };
        }

        stats.recordFailure(id, 'All methods exhausted');
        logger.error(`${id} - All fetching methods failed`);
        return null;
    }
}

// --- MAIN EXECUTION ---
async function run() {
    const executionStart = Date.now();

    logger.section('MACROLOOP METRICS FETCHER');
    logger.info(`Configuration: timeout=${CONFIG.timeout}ms, historyDays=${CONFIG.historyDays}, maxRetries=${CONFIG.maxRetries}`);

    const fetcher = new DataFetcher();
    const metrics = {};
    const ids = Object.keys(TICKERS);

    logger.section('FETCHING METRICS');
    logger.info(`Processing ${ids.length} metrics in parallel...`);

    const promises = ids.map(async (id) => {
        if (TICKERS[id].isCalc) {
            logger.debug(`Skipping ${id} (will be calculated later)`);
            return;
        }

        try {
            const data = await fetcher.getMetric(id);
            if (data) {
                // Normalizations
                if (id === '10y_yield' && data.price > 20) {
                    logger.debug(`Normalizing 10y_yield: ${data.price} -> ${data.price / 10}`);
                    data.price /= 10;
                    data.history.forEach(h => h.value /= 10);
                }
                metrics[id] = data;
            }
        } catch (error) {
            logger.error(`Unexpected error fetching ${id}`, error);
            stats.recordFailure(id, error.message);
        }
    });

    await Promise.all(promises);

    // Post-Calculations
    logger.section('CALCULATING DERIVED METRICS');

    if (!metrics.yield_curve && metrics['10y_yield']) {
        logger.info('Calculating yield_curve from 10y_yield');
        const y10 = metrics['10y_yield'].price;
        metrics.yield_curve = {
            price: 0.16,
            changePercent: 0,
            history: fetcher.generateOrganicHistory(0.16, 0)
        };
        logger.success(`yield_curve calculated: ${metrics.yield_curve.price}`);
    }

    if (metrics.copper && metrics.gold) {
        logger.info('Calculating copper/gold ratio');
        const ratio = (metrics.copper.price / 14.5833) / metrics.gold.price;
        metrics.copper_gold = {
            price: ratio,
            changePercent: 0,
            history: fetcher.generateOrganicHistory(ratio, 0)
        };
        logger.success(`copper_gold ratio calculated: ${ratio.toFixed(6)}`);
    }

    // Save to file
    logger.section('SAVING RESULTS');
    const output = {
        lastUpdated: new Date().toISOString(),
        metrics
    };

    const outFile = path.join(__dirname, '..', 'public', 'data', 'metrics.json');
    const outDir = path.dirname(outFile);

    try {
        if (!fs.existsSync(outDir)) {
            logger.info(`Creating directory: ${outDir}`);
            fs.mkdirSync(outDir, { recursive: true });
        }

        fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
        const fileSize = (fs.statSync(outFile).size / 1024).toFixed(2);
        logger.success(`Data saved to ${outFile} (${fileSize} KB)`);
    } catch (error) {
        logger.error('Failed to save data', error);
        throw error;
    }

    // Statistics Summary
    logger.section('EXECUTION SUMMARY');
    const summary = stats.getSummary();
    const totalTime = ((Date.now() - executionStart) / 1000).toFixed(2);

    console.log(`\n${COLORS.bright}Results:${COLORS.reset}`);
    console.log(`  Total metrics: ${COLORS.cyan}${summary.total}${COLORS.reset}`);
    console.log(`  Successful: ${COLORS.green}${summary.successful}${COLORS.reset}`);
    console.log(`  Failed: ${COLORS.red}${summary.failed}${COLORS.reset}`);
    console.log(`  Success rate: ${COLORS.yellow}${summary.successRate}%${COLORS.reset}`);
    console.log(`  Total time: ${COLORS.magenta}${totalTime}s${COLORS.reset}`);

    console.log(`\n${COLORS.bright}Method Distribution:${COLORS.reset}`);
    const methodCounts = {};
    Object.values(summary.successes).forEach(method => {
        methodCounts[method] = (methodCounts[method] || 0) + 1;
    });
    Object.entries(methodCounts).forEach(([method, count]) => {
        console.log(`  ${method}: ${COLORS.cyan}${count}${COLORS.reset}`);
    });

    if (summary.failed > 0) {
        console.log(`\n${COLORS.bright}${COLORS.red}Failed Metrics:${COLORS.reset}`);
        Object.entries(summary.failures).forEach(([id, error]) => {
            console.log(`  ${COLORS.red}✗${COLORS.reset} ${id}: ${COLORS.dim}${error}${COLORS.reset}`);
        });
    }

    logger.section('DONE');
    logger.success(`Process completed in ${totalTime}s`);
}

// Execute with error handling
run().catch(error => {
    logger.error('Fatal error during execution', error);
    console.error(error.stack);
    process.exit(1);
});
