

const API_KEY = process.env.ALPHAVANTAGE_API_KEY || "R76VHCG9YJOS86V5";
const BASE_URL = "https://www.alphavantage.co/query";

// Simple in-memory cache to prevent AlphaVantage absolute rate limit blowout (5/min, 25/day)
// In a real prod app, use Redis. Here a module-level map works for serverless edge (partially) or node process.
// API returns heterogeneous JSON, using explicitly permitted any or unknown for cache payload.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

async function fetchWithCache(url: string, keyPrefix: string) {
    const cacheKey = `${keyPrefix}_${url}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        console.log(`[AlphaVantage Cache Hit] ${keyPrefix}`);
        return cached.data;
    }

    const res = await fetch(url);
    const data = await res.json();
    
    // Check for API Rate Limit exhaustion
    if (data.Information && typeof data.Information === 'string' && data.Information.includes("rate limit")) {
        console.warn(`[AlphaVantage RATE LIMIT] URL: ${url}`);
        // If we have stale cache, serve it rather than failing
        if (cached) {
            console.log(`[AlphaVantage Serving Stale Cache] ${keyPrefix}`);
            return cached.data;
        }
        return { _rateLimitHit: true };
    }

    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
}

export async function getAlphaVantageQuote(symbol: string, range: string = "1d") {
  try {
    // 1. Fetch the Fundamental Overview (Market Cap, P/E, Name, Description)
    const overview = await fetchWithCache(`${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`, `overview_${symbol}`);

    // 2. Fetch the current real-time Global Quote (Latest Price, Change)
    const quoteData = await fetchWithCache(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`, `quote_${symbol}`);
    const globalQuote = quoteData["Global Quote"] || {};

    // 3. Fetch the Time Series Chart Data based on the UI requested range
    let timeSeriesUrl = "";
    let seriesKey = "";
    
    const r = range.toLowerCase();
    if (r === "1d" || r === "today") {
       timeSeriesUrl = `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;
       seriesKey = "Time Series (5min)";
    } else if (r === "5d" || r === "1m") {
       // Daily compact returns 100 days (~4.5 months)
       timeSeriesUrl = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
       seriesKey = "Time Series (Daily)";
    } else if (r === "6m" || r === "ytd" || r === "1y") {
       // Daily full is a premium feature, use Weekly for historic data
       timeSeriesUrl = `${BASE_URL}?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${API_KEY}`;
       seriesKey = "Weekly Time Series";
    } else { // 5y, max
       timeSeriesUrl = `${BASE_URL}?function=TIME_SERIES_MONTHLY&symbol=${symbol}&apikey=${API_KEY}`;
       seriesKey = "Monthly Time Series";
    }

    const seriesData = await fetchWithCache(timeSeriesUrl, `chart_${symbol}_${r}`);
    const rawSeries = seriesData[seriesKey] || {};

    // 4. Parse the Chart Data
    const chartData = Object.keys(rawSeries)
        .map(dateStr => {
            const entry = rawSeries[dateStr];
            return {
                time: new Date(dateStr).getTime(),
                value: parseFloat(entry["4. close"]),
                open: parseFloat(entry["1. open"]),
                high: parseFloat(entry["2. high"]),
                low: parseFloat(entry["3. low"])
            };
        })
        .sort((a, b) => a.time - b.time); // Chronological

    // 5. Filter Chart Data by Range Date Bounds
    let filteredChart = chartData;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    if (r === "5d") filteredChart = chartData.filter(p => now - p.time <= 7 * dayMs); 
    if (r === "1m") filteredChart = chartData.filter(p => now - p.time <= 30 * dayMs);
    if (r === "6m") filteredChart = chartData.filter(p => now - p.time <= 180 * dayMs);
    if (r === "1y") filteredChart = chartData.filter(p => now - p.time <= 365 * dayMs);
    if (r === "5y") filteredChart = chartData.filter(p => now - p.time <= 5 * 365 * dayMs);
    if (r === "ytd") {
       const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
       filteredChart = chartData.filter(p => p.time >= startOfYear);
    }

    // Determine current price. If Global Quote hit rate limit, use the last chart data point.
    let currentPrice = parseFloat(globalQuote["05. price"]);
    let currentChange = parseFloat(globalQuote["09. change"]);
    let currentChangePercentStr = globalQuote["10. change percent"];
    const currentVolume = parseInt(globalQuote["06. volume"]);

    if (isNaN(currentPrice) && filteredChart.length > 0) {
        const lastPoint = filteredChart[filteredChart.length - 1];
        const firstPoint = filteredChart[0]; // simplistic fallback change
        currentPrice = lastPoint.value;
        currentChange = lastPoint.value - firstPoint.open;
        currentChangePercentStr = `${((currentChange / firstPoint.open) * 100).toFixed(2)}%`;
    }

    // 6. Extrapolate interval Open/High/Low from the filtered chart block
    let rangeOpen = parseFloat(globalQuote["02. open"]);
    let rangeHigh = parseFloat(globalQuote["03. high"]);
    let rangeLow = parseFloat(globalQuote["04. low"]);
    
    if (filteredChart.length > 0 && r !== "1d" && r !== "today") {
        rangeOpen = filteredChart[0].open;
        rangeHigh = Math.max(...filteredChart.map(p => p.high));
        rangeLow = Math.min(...filteredChart.map(p => p.low));
    } else if (filteredChart.length > 0) {
         // Even for 1d, if global quote failed, calculate from chart
         if (isNaN(rangeHigh)) rangeHigh = Math.max(...filteredChart.map(p => p.high));
         if (isNaN(rangeLow)) rangeLow = Math.min(...filteredChart.map(p => p.low));
         if (isNaN(rangeOpen)) rangeOpen = filteredChart[0].open;
    }

    // Safely parse percentage
    let changePctVal = 0;
    if (currentChangePercentStr) {
        changePctVal = parseFloat(currentChangePercentStr.replace("%", ""));
    }

    // 7. Compose Final Normalized Object
    // Gracefully handle missing Overview data if it got rate-limited.
    return {
        symbol: globalQuote["01. symbol"] || overview.Symbol || symbol,
        name: overview.Name || symbol,
        price: currentPrice || 0,
        change: currentChange || 0,
        changePercent: changePctVal || 0,
        open: isNaN(rangeOpen) ? 0 : rangeOpen,
        high: isNaN(rangeHigh) ? 0 : rangeHigh,
        low: isNaN(rangeLow) ? 0 : rangeLow,
        volume: isNaN(currentVolume) ? 0 : currentVolume,
        marketCap: overview.MarketCapitalization ? formatMarketCap(parseInt(overview.MarketCapitalization)) : "-",
        peRatio: overview.PERatio && overview.PERatio !== "None" ? parseFloat(overview.PERatio) : undefined,
        dividendYield: overview.DividendYield && overview.DividendYield !== "None" ? (parseFloat(overview.DividendYield) * 100).toFixed(2) + "%" : "-",
        currency: overview.Currency || "USD",
        exchange: overview.Exchange || "US",
        description: overview.Description || "Detailed company description unavailable at this time.",
        sector: overview.Sector || "-",
        industry: overview.Industry || "-",
        chart: filteredChart
    };

  } catch (e) {
      console.error("AlphaVantage API Error:", e);
      throw e;
  }
}

function formatMarketCap(num: number) {
    if (!num || isNaN(num)) return "-";
    if (num > 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num > 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num > 1e6) return (num / 1e6).toFixed(2) + "M";
    return num.toString();
}
