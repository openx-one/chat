import { resolveSymbol } from "./symbolResolver";
import { getAlphaVantageQuote } from "./providers/alphavantage";

export async function getStockData(query: string, range: string = "1d") {
  // AlphaVantage doesn't always need symbol resolution, but it's good to keep
  // to convert company names (like "Apple") into symbols ("AAPL")
  const resolved = await resolveSymbol(query);

  try {
    const avData = await getAlphaVantageQuote(resolved.symbol, range);
    return avData;
  } catch (e) {
    console.error("Stock Tool Error:", e);
    // Fallback could go here if implemented
    throw e;
  }
}
