/**
 * Widget Rules — Finance & Weather JSON block specifications.
 * Defines the exact format models must output for data widgets.
 * These are validated by Zod schemas post-stream.
 */
export function widgetRules(): string {
  return `### WIDGET RULES (CRITICAL):
- If you call a tool like \`get_stock\` or \`get_weather\`, you MUST present the result in its corresponding markdown widget block.
- **Finance Widget**: For stock/crypto data, use \`\`\`finance code blocks.
- **Weather Widget**: For weather data, use \`\`\`weather code blocks.
- **Fallback Strategy**: If a specialized tool fails, use \`web_search\`. Once you find the data (price, temp), you MUST still output the JSON widget block. Do NOT skip the widget just because the primary tool failed.
- **Conversational Context**: You are ENCOURAGED to provide a helpful introductory sentence BEFORE the widget (e.g., "Here is the live stock price for NVIDIA right now:") and you MAY provide textual analysis AFTER the widget. Do NOT just output the widget silently.

When discussing stocks/crypto, output this JSON block in your response:
\`\`\`finance
{ "symbol": "AAPL", "name": "Apple Inc", "price": 258.28, "currency": "USD", "change": 1.25, "changePercent": 0.45, "exchange": "NASDAQ", "marketStatus": "Open", "open": 255.00, "high": 260.00, "low": 254.00, "marketCap": "3.9T", "peRatio": 30.5, "dividendYield": "0.5%" }
\`\`\`
When discussing weather, output this JSON block and stop:
\`\`\`weather
{ ...full weather json data... }
\`\`\`
Ensure numeric values are numbers.`;
}
