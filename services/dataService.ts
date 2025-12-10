
import { DataSource, MetricData, MetricDefinition, TimeRange } from '../types';
import { METRICS, TIME_RANGE_DAYS } from '../constants';

// Realistic Defaults (Fallback only used if JSON fetch fails completely)
const REALISTIC_DEFAULTS: Record<string, number> = {
  yield_curve: 0.15, ism_pmi: 48.5, fed_funds: 4.50, credit_spreads: 3.25,
  m2_growth: 1.8, unemployment: 4.2, lei: 99.2, nfp: 145, cpi: 2.7,
  consumer_conf: 102.5, buffett: 198.0, cape: 36.2, bond_vs_stock: 0.85,
  sp500_margin: 12.4, vix: 15.8, fear_greed: 52, put_call: 0.88,
  sp500_ma200: 5900, '10y_yield': 4.35, oil_wti: 69.50, dxy: 102.1,
  retail_sales: 2.4, copper_gold: 0.17
};

// Types for the static JSON file
interface StaticMetricData {
  price: number;
  changePercent: number;
  history: { date: string; value: number }[];
  lastUpdated: string;
}

interface StaticDataResponse {
  lastUpdated: string;
  metrics: Record<string, StaticMetricData>;
}

// Generate fallback history if static file is missing history
const generateTrendHistory = (currentVal: number, changePercent: number, days: number): { date: string; value: number }[] => {
  const history = [];
  const now = new Date();
  const startVal = currentVal / (1 + (changePercent / 100));
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const progress = 1 - (i / days);
    let estimatedValue = startVal + (currentVal - startVal) * progress;
    estimatedValue += (currentVal * 0.01) * (Math.random() - 0.5); 
    history.push({
      date: date.toLocaleDateString('es-ES', { month: '2-digit', day: '2-digit' }),
      value: parseFloat(estimatedValue.toFixed(2)),
    });
  }
  history[history.length - 1].value = currentVal;
  return history;
};

// Fallback simulation
const simulateData = (days: number, source: DataSource): MetricData[] => {
  return METRICS.map((metric) => {
    const val = REALISTIC_DEFAULTS[metric.id] ?? 100;
    const randomChange = (Math.random() * 1) - 0.5; 
    const reliableUrl = metric.urls[source] || metric.urls[DataSource.GENERAL];

    return {
      definition: metric,
      currentValue: val,
      change: val * (randomChange / 100),
      changePercent: randomChange,
      history: generateTrendHistory(val, randomChange, days),
      sourceUrl: reliableUrl,
      isSimulated: true // Amber color
    };
  });
};

export const fetchDashboardData = async (
  source: DataSource,
  range: TimeRange
): Promise<MetricData[]> => {
  const days = TIME_RANGE_DAYS[range];

  try {
    // 1. Try to fetch local static JSON (for dev or normal production)
    let response = await fetch(`./data/metrics.json?t=${new Date().getTime()}`);
    
    // 2. Fallback: Try fetching from GitHub Raw (if running locally but want real data)
    // Updated to point to p4blo4p/Mercado
    if (!response.ok) {
        // console.log("Local data not found, trying GitHub Raw...");
        response = await fetch(`https://raw.githubusercontent.com/p4blo4p/Mercado/main/public/data/metrics.json?t=${new Date().getTime()}`);
    }

    if (!response.ok) {
      throw new Error(`Static data not found: ${response.status}`);
    }

    const staticData: StaticDataResponse = await response.json();
    
    // 3. Map static data to application model
    return METRICS.map((metric) => {
      const metricData = staticData.metrics[metric.id];
      const reliableUrl = metric.urls[source] || metric.urls[DataSource.GENERAL];

      if (!metricData) {
        // Partial fallback if specific metric is missing in JSON
        const val = REALISTIC_DEFAULTS[metric.id] ?? 0;
        return {
          definition: metric,
          currentValue: val,
          change: 0,
          changePercent: 0,
          history: generateTrendHistory(val, 0, days),
          sourceUrl: reliableUrl,
          isSimulated: true
        };
      }

      // Filter/Slice history based on selected Range
      let rawHistory = metricData.history || [];
      let history = rawHistory;
      if (history.length > days) {
        history = history.slice(-days);
      } else if (history.length === 0) {
        history = generateTrendHistory(metricData.price, metricData.changePercent, days);
      }

      return {
        definition: metric,
        currentValue: metricData.price,
        change: metricData.price * (metricData.changePercent / 100),
        changePercent: metricData.changePercent,
        history: history,
        sourceUrl: reliableUrl,
        isSimulated: false // White color (Real Data from JSON)
      };
    });

  } catch (error) {
    console.warn("Could not load static real-time data, falling back to simulation.", error);
    // If local dev or file doesn't exist yet, show simulation
    return simulateData(days, source);
  }
};
