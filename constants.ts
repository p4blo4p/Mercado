
import { DataSource, MetricDefinition, TimeRange } from './types';

export const METRICS: MetricDefinition[] = [
  { 
    id: 'yield_curve', 
    name: 'Curva Rendimiento (10Y-2Y)', 
    category: 'Market', 
    suffix: '%',
    searchQuery: 'current US 10 year minus 2 year treasury yield spread',
    description: 'Normal: +0.5% a +2.0% (Crecimiento sano). Recesión: < 0% (Curva Invertida, señal histórica de crisis inminente).',
    thresholds: {
      goodLevel: 0.5, goodDirection: 'above',
      badLevel: 0, badDirection: 'below'
    },
    urls: {
      [DataSource.GENERAL]: 'https://finance.yahoo.com/quote/%5ET10Y2Y',
      [DataSource.OFFICIAL]: 'https://fred.stlouisfed.org/series/T10Y2Y',
      [DataSource.TRADING]: 'https://www.investing.com/rates-bonds/u.s.-10-year-bond-yield'
    }
  },
  { 
    id: 'ism_pmi', 
    name: 'ISM Manufacturero (PMI)', 
    category: 'Economic',
    searchQuery: 'current ISM Manufacturing PMI United States',
    description: 'Expansión: > 50 (Economía creciendo). Contracción/Recesión: < 50. Por debajo de 45 indica recesión profunda.',
    thresholds: {
      goodLevel: 52, goodDirection: 'above',
      badLevel: 48, badDirection: 'below'
    },
    urls: {
      [DataSource.GENERAL]: 'https://tradingeconomics.com/united-states/manufacturing-pmi',
      [DataSource.OFFICIAL]: 'https://www.ismworld.org/supply-management-news-and-reports/reports/ism-pmi-reports/',
      [DataSource.TRADING]: 'https://www.investing.com/economic-calendar/ism-manufacturing-pmi-173'
    }
  },
  { 
    id: 'fed_funds', 
    name: 'Tasa Fondos Federales', 
    category: 'Economic', 
    suffix: '%', 
    isPercentage: true,
    searchQuery: 'current Federal Funds Rate effective',
    description: 'Neutral: ~2.5-3.0%. Restrictiva (frena inflación): > 4%. Estimulativa (combate recesión): < 2%.',
    thresholds: {
      goodLevel: 3.0, goodDirection: 'above',
      badLevel: 5.0, badDirection: 'above'
    },
    urls: {
      [DataSource.GENERAL]: 'https://fred.stlouisfed.org/series/FEDFUNDS',
      [DataSource.OFFICIAL]: 'https://fred.stlouisfed.org/series/FEDFUNDS',
      [DataSource.TRADING]: 'https://www.investing.com/economic-calendar/interest-rate-decision-168'
    }
  },
  { 
    id: 'credit_spreads', 
    name: 'Credit Spreads (Junk)', 
    category: 'Market', 
    suffix: '%',
    searchQuery: 'current US High Yield Option-Adjusted Spread ICE BofA',
    description: 'Normal: < 3.5% (Confianza en empresas). Pánico/Recesión: > 5.0% (Miedo a impagos masivos).',
    thresholds: {
      goodLevel: 3.5, goodDirection: 'below',
      badLevel: 5.0, badDirection: 'above'
    },
    urls: {
      [DataSource.GENERAL]: 'https://fred.stlouisfed.org/series/BAMLH0A0HYM2',
      [DataSource.OFFICIAL]: 'https://fred.stlouisfed.org/series/BAMLH0A0HYM2',
      [DataSource.TRADING]: 'https://www.investing.com/rates-bonds/usa-high-yield'
    }
  },
  { 
    id: 'm2_growth', 
    name: 'Masa Monetaria M2 (YoY)', 
    category: 'Economic', 
    suffix: '%', 
    isPercentage: true,
    searchQuery: 'current US M2 money supply YoY growth rate',
    description: 'Normal: +5-7% (Apoya crecimiento). Negativo: < 0% (Retirada de liquidez, riesgo deflacionario o recesión).',
    thresholds: {
      goodLevel: 5, goodDirection: 'above',
      badLevel: 0, badDirection: 'below'
    },
    urls: {
      [DataSource.GENERAL]: 'https://tradingeconomics.com/united-states/money-supply-m2',
      [DataSource.OFFICIAL]: 'https://fred.stlouisfed.org/series/M2SL',
      [DataSource.TRADING]: 'https://www.investing.com/economic-calendar/m2-money-supply-1051'
    }
  },
  { 
    id: 'unemployment', 
    name: 'Tasa Desempleo (U3)', 
    category: 'Economic', 
    suffix: '%', 
    isPercentage: true,
    searchQuery: 'current US Unemployment Rate',
    description: 'Pleno empleo: 3.5-4.5%. Recesión: > 5% y subiendo rápidamente (Regla de Sahm).',
    thresholds: {
      goodLevel: 4.0, goodDirection: 'below',
      badLevel: 5.0, badDirection: 'above'
    },
    urls: {
      [DataSource.GENERAL]: 'https://finance.yahoo.com/news/unemployment-rate',
      [DataSource.OFFICIAL]: 'https://fred.stlouisfed.org/series/UNRATE',
      [DataSource.TRADING]: 'https://www.investing.com/economic-calendar/unemployment-rate-300'
    }
  },
  { 
    id: 'lei', 
    name: 'Leading Econ Index (LEI)', 
    category: 'Economic',
    searchQuery: 'current Conference Board LEI US value',
    description: 'Crecimiento: > 100 y subiendo. Recesión: < 95 o caídas consecutivas durante 3 meses.',
    thresholds: {
      goodLevel: 100, goodDirection: 'above',
      badLevel: 95, badDirection: 'below'
    },
    urls: {
      [DataSource.GENERAL]: 'https://www.conference-board.org/topics/us-leading-indicators',
      [DataSource.OFFICIAL]: 'https://www.conference-board.org/topics/us-leading-indicators',
      [DataSource.TRADING]: 'https://www.investing.com/economic-calendar/cb-leading-index-215'
    }
  },
  { 
    id: 'nfp', 
    name: 'Nóminas No Agrícolas (NFP)', 
    category: 'Economic', 
    suffix: 'k',
    searchQuery: 'latest US Non-Farm Payrolls actual number',
    description: 'Sólido: > 150k empleos/mes. Recesión: < 100k o negativo (destrucción de empleo).',
    thresholds: {
      goodLevel: 160, goodDirection: 'above',
      badLevel: 100, badDirection: 'below'
    },
    urls: {
      [DataSource.GENERAL]: 'https://finance.yahoo.com/news/nonfarm-payrolls',
      [DataSource.OFFICIAL]: 'https://fred.stlouisfed.org/series/PAYEMS',
      [DataSource.TRADING]: 'https://www.investing.com/economic-calendar/nonfarm-payrolls-227'
    }
  },
  { 
    id: 'cpi', 
    name: 'Inflación CPI (YoY)', 
    category: 'Economic', 
    suffix: '%', 
    isPercentage: true,
    searchQuery: 'current US CPI Inflation Rate YoY',
    description: 'Objetivo Fed: 2%. Aceptable: 1.5-3%. Inflación Alta (Peligro): > 3.5-4%.',
    thresholds: {
      goodLevel: 2.5, goodDirection: 'below',
      badLevel: 3.5, badDirection: 'above'
    },
    urls: {
      [DataSource.GENERAL]: 'https://tradingeconomics.com/united-states/inflation-cpi',
      [DataSource.OFFICIAL]: 'https://fred.stlouisfed.org/series/CPIAUCSL',
      [DataSource.TRADING]: 'https://www.investing.com/economic-calendar/cpi-73'
    }
  },
  { 
    id: 'consumer_conf', 
    name: 'Confianza Consumidor', 
    category: 'Sentiment',
    searchQuery: 'current Conference Board Consumer Confidence Index',
    description: 'Optimismo: > 100. Pesimismo/Recesión: < 90 (El consumidor deja de gastar).',
    thresholds: {
      goodLevel: 100, goodDirection: 'above',
      badLevel: 90, badDirection: 'below'
    },
    urls: {
      [DataSource.GENERAL]: 'https://tradingeconomics.com/united-states/consumer-confidence',
      [DataSource.OFFICIAL]: 'https://www.conference-board.org/topics/consumer-confidence',
      [DataSource.TRADING]: 'https://www.investing.com/economic-calendar/cb-consumer-confidence-48'
    }
  },
  { 
    id: 'buffett', 
    name: 'Buffett Ind (Mkt/GDP)', 
    category: 'Ratio', 
    suffix: '%', 
    isPercentage: true,
    searchQuery: 'current Buffett Indicator Market Cap to GDP ratio',
    description: 'Justo: 75-100%. Sobrevalorado: > 120%. Burbuja Extrema: > 180% (Riesgo de crash).',
    thresholds: {
      goodLevel: 120, goodDirection: 'below',
      badLevel: 180, badDirection: 'above'
    },
    urls: {
      [DataSource.GENERAL]: 'https://www.longtermtrends.net/market-cap-to-gdp-the-buffett-indicator/',
      [DataSource.OFFICIAL]: 'https://fred.stlouisfed.org/series/WILL5000PRFC',
      [DataSource.TRADING]: 'https://www.gurufocus.com/stock-market-valuations.php'
    }
  },
  { 
    id: 'cape', 
    name: 'Shiller PE (CAPE)', 
    category: 'Ratio',
    searchQuery: 'current Shiller PE Ratio value',
    description: 'Histórico: ~17. Caro: > 25. Burbuja: > 35 (Retornos futuros esperados muy bajos).',
    thresholds: {
      goodLevel: 25, goodDirection: 'below',
      badLevel: 35, badDirection: 'above'
    },
    urls: {
      [DataSource.GENERAL]: 'https://www.multpl.com/shiller-pe',
      [DataSource.OFFICIAL]: 'https://www.multpl.com/shiller-pe',
      [DataSource.TRADING]: 'https://www.gurufocus.com/shiller-pe.php'
    }
  },
  { 
    id: 'bond_vs_stock', 
    name: 'Yield Bonos vs Acciones', 
    category: 'Ratio', 
    suffix: '%',
    searchQuery: 'current difference between US 10Y Treasury yield and S&P 500 earnings yield',
    description: 'Acciones atractivas: < 0 (Yield S&P > Bonos). Bonos atractivos: > 1% (Riesgo para acciones).',
    thresholds: {
      goodLevel: 0, goodDirection: 'below',
      badLevel: 1, badDirection: 'above'
    },
    urls: {
      [DataSource.GENERAL]: 'https://www.longtermtrends.net/stocks-vs-bonds/',
      [DataSource.OFFICIAL]: 'https://fred.stlouisfed.org/graph/?g=1Pik',
      [DataSource.TRADING]: 'https://www.gurufocus.com/economic_indicators/56/sp-500-earnings-yield'
    }
  },
  { 
    id: 'sp500_margin', 
    name: 'S&P 500 Margen Neto', 
    category: 'Market', 
    suffix: '%', 
    isPercentage: true,
    searchQuery: 'current S&P 500 net profit margin',
    description: 'Saludable: > 12%. Presión en beneficios: < 10% (Costos suben, riesgo de caídas en bolsa).',
    thresholds: {
      goodLevel: 12, goodDirection: 'above',
      badLevel: 10, badDirection: 'below'
    },
    urls: {
      [DataSource.GENERAL]: 'https://www.yardeni.com/pub/peacockfeval.pdf',
      [DataSource.OFFICIAL]: 'https://www.bea.gov/data/income-saving/corporate-profits',
      [DataSource.TRADING]: 'https://www.gurufocus.com/economic_indicators/76/sp-500-net-profit-margin'
    }
  },
  { 
    id: 'vix', 
    name: 'VIX (Volatilidad)', 
    category: 'Sentiment',
    searchQuery: 'current CBOE VIX Index value',
    description: 'Calma: < 20. Miedo/Corrección: > 25. Pánico/Crisis: > 35.',
    thresholds: {
      goodLevel: 20, goodDirection: 'below',
      badLevel: 30, badDirection: 'above'
    },
    urls: {
      [DataSource.GENERAL]: 'https://finance.yahoo.com/quote/%5EVIX',
      [DataSource.OFFICIAL]: 'https://www.cboe.com/tradable_products/vix/',
      [DataSource.TRADING]: 'https://www.investing.com/indices/volatility-s-p-500'
    }
  },
  { 
    id: 'fear_greed', 
    name: 'Fear & Greed Index', 
    category: 'Sentiment',
    searchQuery: 'current CNN Fear and Greed Index score',
    description: 'Miedo Extremo (Compra): < 25. Codicia Extrema (Venta): > 75. Neutral: 45-55.',
    thresholds: {
      goodLevel: 45, goodDirection: 'above',
      badLevel: 25, badDirection: 'below'
    },
    urls: {
      [DataSource.GENERAL]: 'https://edition.cnn.com/markets/fear-and-greed',
      [DataSource.OFFICIAL]: 'https://edition.cnn.com/markets/fear-and-greed',
      [DataSource.TRADING]: 'https://edition.cnn.com/markets/fear-and-greed'
    }
  },
  { 
    id: 'put_call', 
    name: 'Ratio Put/Call (Equity)', 
    category: 'Sentiment',
    searchQuery: 'current CBOE Equity Put/Call Ratio',
    description: 'Alcista (Bullish): < 0.6. Bajista (Bearish/Miedo): > 1.0 (Inversores compran protección).',
    thresholds: {
      goodLevel: 0.65, goodDirection: 'below',
      badLevel: 1.0, badDirection: 'above'
    },
    urls: {
      [DataSource.GENERAL]: 'https://ycharts.com/indicators/cboe_equity_put_call_ratio',
      [DataSource.OFFICIAL]: 'https://www.cboe.com/us/options/market_statistics/daily/',
      [DataSource.TRADING]: 'https://www.investing.com/indices/cboe-put-call-ratio'
    }
  },
  { 
    id: 'sp500_ma200', 
    name: 'S&P 500 (vs MA200)', 
    category: 'Market', 
    suffix: 'pts',
    searchQuery: 'current S&P 500 price',
    description: 'Tendencia Alcista: Precio > MA200. Tendencia Bajista (Bear Market): Precio < MA200.',
    thresholds: {
      goodLevel: 4200, goodDirection: 'above',
      badLevel: 3800, badDirection: 'below'
    },
    urls: {
      [DataSource.GENERAL]: 'https://finance.yahoo.com/quote/%5EGSPC',
      [DataSource.OFFICIAL]: 'https://www.spglobal.com/spdji/en/indices/equity/sp-500/',
      [DataSource.TRADING]: 'https://www.tradingview.com/symbols/SPX/'
    }
  },
  { 
    id: '10y_yield', 
    name: 'Bono USA 10 Años', 
    category: 'Market', 
    suffix: '%', 
    isPercentage: true,
    searchQuery: 'current US 10 Year Treasury Note Yield',
    description: 'Estable: 3.5-4.0%. Alto riesgo para bolsa: > 4.5% (Encarece crédito).',
    thresholds: {
      goodLevel: 3.5, goodDirection: 'below',
      badLevel: 4.5, badDirection: 'above'
    },
    urls: {
      [DataSource.GENERAL]: 'https://finance.yahoo.com/quote/%5ETNX',
      [DataSource.OFFICIAL]: 'https://fred.stlouisfed.org/series/DGS10',
      [DataSource.TRADING]: 'https://www.investing.com/rates-bonds/u.s.-10-year-bond-yield'
    }
  },
  { 
    id: 'oil_wti', 
    name: 'Petróleo WTI', 
    category: 'Market', 
    suffix: '$',
    searchQuery: 'current Crude Oil WTI price',
    description: 'Estable: $70-80. Inflacionario: > $90. Deflacionario/Recesión: < $60.',
    thresholds: {
      goodLevel: 80, goodDirection: 'below',
      badLevel: 90, badDirection: 'above'
    },
    urls: {
      [DataSource.GENERAL]: 'https://finance.yahoo.com/quote/CL=F',
      [DataSource.OFFICIAL]: 'https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm',
      [DataSource.TRADING]: 'https://www.investing.com/commodities/crude-oil'
    }
  },
  { 
    id: 'dxy', 
    name: 'Índice Dólar (DXY)', 
    category: 'Market',
    searchQuery: 'current US Dollar Index DXY',
    description: 'Estable: 95-100. Dólar fuerte (daña exportaciones/EM): > 105. Dólar débil: < 90.',
    thresholds: {
      goodLevel: 100, goodDirection: 'below',
      badLevel: 105, badDirection: 'above'
    },
    urls: {
      [DataSource.GENERAL]: 'https://finance.yahoo.com/quote/DX-Y.NYB',
      [DataSource.OFFICIAL]: 'https://www.marketwatch.com/investing/index/dxy',
      [DataSource.TRADING]: 'https://www.investing.com/currencies/us-dollar-index'
    }
  },
  { 
    id: 'retail_sales', 
    name: 'Ventas Minoristas (YoY)', 
    category: 'Economic', 
    suffix: '%',
    searchQuery: 'current US Retail Sales YoY',
    description: 'Consumo sano: > 3%. Consumidor débil: < 1%. Negativo = Recesión.',
    thresholds: {
      goodLevel: 3.0, goodDirection: 'above',
      badLevel: 1.0, badDirection: 'below'
    },
    urls: {
      [DataSource.GENERAL]: 'https://tradingeconomics.com/united-states/retail-sales-annual',
      [DataSource.OFFICIAL]: 'https://fred.stlouisfed.org/series/RSAFS',
      [DataSource.TRADING]: 'https://www.investing.com/economic-calendar/retail-sales-256'
    }
  },
  { 
    id: 'copper_gold', 
    name: 'Ratio Cobre/Oro', 
    category: 'Ratio',
    searchQuery: 'current Copper to Gold Ratio',
    description: 'Apetito de Riesgo (Risk-on): > 0.18. Aversión al Riesgo (Miedo): < 0.15.',
    thresholds: {
      goodLevel: 0.18, goodDirection: 'above',
      badLevel: 0.15, badDirection: 'below'
    },
    urls: {
      [DataSource.GENERAL]: 'https://www.longtermtrends.net/copper-gold-ratio/',
      [DataSource.OFFICIAL]: 'https://www.longtermtrends.net/copper-gold-ratio/',
      [DataSource.TRADING]: 'https://www.investing.com/commodities/copper'
    }
  },
];

export const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  [TimeRange.D7]: 7,
  [TimeRange.M1]: 30,
  [TimeRange.M3]: 90,
  [TimeRange.Y1]: 365,
  [TimeRange.Y5]: 1825,
};
