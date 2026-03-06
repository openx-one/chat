import { z } from "zod";

/**
 * Zod schema for the finance widget JSON block.
 * Matches the ```finance code block format specified in widget-rules.
 * Uses .passthrough() to allow extra fields without failing validation.
 */
export const FinanceWidgetSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  currency: z.string().optional(),
  change: z.number().optional(),
  changePercent: z.number().optional(),
  exchange: z.string().optional(),
  marketStatus: z.string().optional(),
  open: z.number().optional(),
  high: z.number().optional(),
  low: z.number().optional(),
  marketCap: z.union([z.string(), z.number()]).optional(),
  peRatio: z.union([z.string(), z.number()]).optional(),
  dividendYield: z.union([z.string(), z.number()]).optional(),
}).passthrough();

/**
 * Zod schema for weather widget hourly entry.
 */
const WeatherHourlySchema = z.object({
  time: z.string(),
  temp: z.number(),
  condition: z.string(),
}).passthrough();

/**
 * Zod schema for weather widget daily entry.
 */
const WeatherDailySchema = z.object({
  date: z.string(),
  dayName: z.string().optional(),
  high: z.number(),
  low: z.number(),
  condition: z.string(),
}).passthrough();

/**
 * Zod schema for the weather widget JSON block.
 * Matches the ```weather code block format.
 * Flexible enough to accept both model-generated and tool-returned data.
 */
export const WeatherWidgetSchema = z.object({
  city: z.string(),
  current: z.object({
    temp: z.number(),
    condition: z.string(),
    humidity: z.number().optional(),
    windSpeed: z.number().optional(),
    isDay: z.boolean().optional(),
  }).passthrough(),
  daily: z.array(WeatherDailySchema).optional(),
  hourly: z.array(WeatherHourlySchema).optional(),
}).passthrough();
