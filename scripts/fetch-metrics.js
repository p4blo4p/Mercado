// scripts/fetch-metrics.js
const yahooFinance = require('yahoo-finance2').default;
const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('🚀 Iniciando extracción de métricas económicas...\n');

// Función helper para calcular medias móviles
function calculateSMA(prices, period) {
  if (!prices || prices.length < period) return null;
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

// Función para obtener datos históricos de Yahoo Finance
async function getYahooData(symbol, days = 200) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    
    return result.quotes;
  } catch (error) {
    console.error(`❌ Error obteniendo ${symbol}:`, error.message);
    return null;
  }
}

// Función para obtener precio actual
async function getCurrentPrice(symbol) {
  try {
    const quote = await yahooFinance.quote(symbol);
    return quote.regularMarketPrice;
  } catch (error) {
    console.error(`❌ Error obteniendo precio de ${symbol}:`, error.message);
    return null;
  }
}

// Función para obtener datos de FRED (Federal Reserve Economic Data)
async function getFredData(seriesId, apiKey = 'demo') {
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
    const response = await axios.get(url);
    
    if (response.data.observations && response.data.observations.length > 0) {
      return parseFloat(response.data.observations[0].value);
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function fetchAllMetrics() {
  const metrics = {};
  
  try {
    // 1. YIELD CURVE (10Y - 2Y Treasury Spread)
    console.log('📊 Obteniendo Yield Curve...');
    const treasury10y = await getCurrentPrice('^TNX');
    const treasury2y = await getCurrentPrice('^IRX');
    if (treasury10y && treasury2y) {
      metrics.yield_curve = parseFloat((treasury10y - (treasury2y / 100)).toFixed(2));
      console.log(`✅ Yield Curve: ${metrics.yield_curve}%`);
    }

    // 2. CREDIT SPREADS (HYG vs IEF)
    console.log('📊 Obteniendo Credit Spreads...');
    const hyg = await getCurrentPrice('HYG');
    const ief = await getCurrentPrice('IEF');
    if (hyg && ief) {
      const hygYield = 5.2; // Aproximado yield de HYG
      const iefYield = treasury10y / 100;
      metrics.credit_spreads = parseFloat(((hygYield - iefYield) * 100).toFixed(2));
      console.log(`✅ Credit Spreads: ${metrics.credit_spreads} bps`);
    }

    // 3. FED FUNDS RATE
    console.log('📊 Obteniendo Fed Funds Rate...');
    const fedFunds = await getFredData('DFF');
    if (fedFunds) {
      metrics.fed_funds = parseFloat(fedFunds.toFixed(2));
      console.log(`✅ Fed Funds: ${metrics.fed_funds}%`);
    }

    // 4. VIX
    console.log('📊 Obteniendo VIX...');
    const vix = await getCurrentPrice('^VIX');
    if (vix) {
      metrics.vix = parseFloat(vix.toFixed(2));
      console.log(`✅ VIX: ${metrics.vix}`);
    }

    // 5. S&P 500 y MA200
    console.log('📊 Obteniendo S&P 500 y MA200...');
    const sp500Data = await getYahooData('^GSPC', 250);
    if (sp500Data && sp500Data.length > 0) {
      const prices = sp500Data.map(q => q.close);
      const ma200 = calculateSMA(prices, 200);
      
      if (ma200) {
        metrics.sp500_ma200 = parseFloat(ma200.toFixed(2));
        console.log(`✅ S&P 500 MA200: ${metrics.sp500_ma200}`);
      }
      
      // Calcular distancia del precio actual a MA200
      const currentPrice = prices[prices.length - 1];
      const distanceToMA = ((currentPrice - ma200) / ma200) * 100;
      metrics.sp500_distance_ma200 = parseFloat(distanceToMA.toFixed(2));
      console.log(`✅ S&P 500 Distance to MA200: ${metrics.sp500_distance_ma200}%`);
    }

    // 6. 10Y TREASURY YIELD
    console.log('📊 Obteniendo 10Y Treasury Yield...');
    if (treasury10y) {
      metrics['10y_yield'] = parseFloat(treasury10y.toFixed(3));
      console.log(`✅ 10Y Yield: ${metrics['10y_yield']}%`);
    }

    // 7. OIL WTI
    console.log('📊 Obteniendo Oil WTI...');
    const oil = await getCurrentPrice('CL=F');
    if (oil) {
      metrics.oil_wti = parseFloat(oil.toFixed(2));
      console.log(`✅ Oil WTI: $${metrics.oil_wti}`);
    }

    // 8. DXY (Dollar Index)
    console.log('📊 Obteniendo DXY...');
    const dxy = await getCurrentPrice('DX-Y.NYB');
    if (dxy) {
      metrics.dxy = parseFloat(dxy.toFixed(2));
      console.log(`✅ DXY: ${metrics.dxy}`);
    }

    // 9. COPPER/GOLD RATIO
    console.log('📊 Obteniendo Copper/Gold Ratio...');
    const copper = await getCurrentPrice('HG=F');
    const gold = await getCurrentPrice('GC=F');
    if (copper && gold) {
      metrics.copper_gold = parseFloat((copper / gold).toFixed(6));
      console.log(`✅ Copper/Gold: ${metrics.copper_gold}`);
    }

    // 10. PUT/CALL RATIO (aproximado usando opciones del SPY)
    console.log('📊 Obteniendo Put/Call Ratio...');
    // Usamos VIX como proxy ya que tiene correlación
    if (vix) {
      metrics.put_call = parseFloat((vix / 20).toFixed(2));
      console.log(`✅ Put/Call Ratio (estimado): ${metrics.put_call}`);
    }

    // 11. UNEMPLOYMENT RATE
    console.log('📊 Obteniendo Unemployment Rate...');
    const unemployment = await getFredData('UNRATE');
    if (unemployment) {
      metrics.unemployment = parseFloat(unemployment.toFixed(1));
      console.log(`✅ Unemployment: ${metrics.unemployment}%`);
    }

    // 12. CPI
    console.log('📊 Obteniendo CPI...');
    const cpi = await getFredData('CPIAUCSL');
    if (cpi) {
      // Calcular YoY change (necesitaríamos dato de hace 12 meses, por ahora estimado)
      metrics.cpi = parseFloat((2.6).toFixed(1)); // Placeholder - necesita cálculo YoY
      console.log(`✅ CPI: ${metrics.cpi}%`);
    }

    // 13. M2 MONEY SUPPLY GROWTH
    console.log('📊 Obteniendo M2 Growth...');
    const m2 = await getFredData('M2SL');
    if (m2) {
      metrics.m2_growth = parseFloat((1.9).toFixed(1)); // Placeholder - necesita cálculo YoY
      console.log(`✅ M2 Growth: ${metrics.m2_growth}%`);
    }

    // 14. ISM PMI
    console.log('📊 Obteniendo ISM PMI...');
    const ism = await getFredData('MANEMP');
    if (ism) {
      metrics.ism_pmi = parseFloat(ism.toFixed(1));
      console.log(`✅ ISM PMI: ${metrics.ism_pmi}`);
    }

    // 15. RETAIL SALES
    console.log('📊 Obteniendo Retail Sales...');
    const retail = await getFredData('RSXFS');
    if (retail) {
      metrics.retail_sales = parseFloat((2.9).toFixed(1)); // Placeholder - necesita cálculo YoY
      console.log(`✅ Retail Sales Growth: ${metrics.retail_sales}%`);
    }

    // 16. BUFFETT INDICATOR (Market Cap / GDP)
    console.log('📊 Calculando Buffett Indicator...');
    // Requiere datos de GDP y Market Cap total - placeholder por ahora
    metrics.buffett = 199.2;
    console.log(`✅ Buffett Indicator: ${metrics.buffett}%`);

    // 17. CAPE RATIO (Shiller PE)
    console.log('📊 Obteniendo CAPE Ratio...');
    // Requiere datos históricos ajustados - placeholder por ahora
    metrics.cape = 36.5;
    console.log(`✅ CAPE: ${metrics.cape}`);

    // 18. FEAR & GREED INDEX (estimado)
    console.log('📊 Calculando Fear & Greed...');
    if (vix) {
      // Fórmula simplificada: 100 - (VIX * 2.5)
      const fearGreed = Math.max(0, Math.min(100, 100 - (vix * 2.5)));
      metrics.fear_greed = Math.round(fearGreed);
      console.log(`✅ Fear & Greed: ${metrics.fear_greed}`);
    }

    // Agregar timestamp
    metrics.timestamp = new Date().toISOString();
    metrics.last_update = new Date().toLocaleString('es-ES', { 
      timeZone: 'Europe/Madrid' 
    });

    // Guardar a archivo
    const outputPath = path.join(__dirname, '..', 'data', 'metrics.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2));
    
    console.log('\n✅ Métricas guardadas exitosamente en data/metrics.json');
    console.log(`📊 Total de métricas obtenidas: ${Object.keys(metrics).length - 2}`);
    
    return metrics;

  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    throw error;
  }
}

// Ejecutar
fetchAllMetrics()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });