import { Tool } from "../types";
import { getStockData } from "@/lib/stocks/stockTool";

export const stockTool: Tool = {
    definition: {
        name: "get_stock",
        description: "Fetch real-time stock prices, crypto rates, or market data. ALWAYS use this tool first when a user mentions a stock symbol (e.g. AAPL, TSLA) or asks for price data. Do NOT use web search for ticker prices if this tool can handle it.",
        parameters: {
            type: "object",
            properties: {
                 query: { type: "string", description: "Symbol or name (e.g. 'Apple', 'BTC', 'Reliance')" }
            },
            required: ["query"]
        }
    },
    execute: async (args) => {
        const data = await getStockData(args.query);
        return {
            content: JSON.stringify(data)
        };
    }
};
