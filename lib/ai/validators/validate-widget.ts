import { FinanceWidgetSchema, WeatherWidgetSchema } from "./schemas";

export interface WidgetValidationResult {
  valid: boolean;
  errors: WidgetError[];
}

export interface WidgetError {
  widgetType: "finance" | "weather";
  rawJson: string;
  issues: string[];
}

/**
 * Extracts and validates widget JSON blocks from streamed model output.
 * 
 * Looks for ```finance and ```weather code blocks, extracts the JSON,
 * and validates against Zod schemas.
 * 
 * @param text The full accumulated model response text
 * @returns Validation result with any errors found
 */
export function validateWidgetBlocks(text: string): WidgetValidationResult {
  const errors: WidgetError[] = [];

  // Match ```finance ... ``` blocks
  const financeRegex = /```finance\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = financeRegex.exec(text)) !== null) {
    const rawJson = match[1].trim();
    const issues = validateJson(rawJson, "finance");
    if (issues.length > 0) {
      errors.push({ widgetType: "finance", rawJson, issues });
    }
  }

  // Match ```weather ... ``` blocks
  const weatherRegex = /```weather\s*\n([\s\S]*?)```/g;

  while ((match = weatherRegex.exec(text)) !== null) {
    const rawJson = match[1].trim();
    const issues = validateJson(rawJson, "weather");
    if (issues.length > 0) {
      errors.push({ widgetType: "weather", rawJson, issues });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a single JSON string against the appropriate widget schema.
 */
function validateJson(rawJson: string, type: "finance" | "weather"): string[] {
  const issues: string[] = [];

  // Step 1: Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (e) {
    issues.push(`Invalid JSON: ${(e as Error).message}`);
    return issues;
  }

  // Step 2: Schema validation
  const schema = type === "finance" ? FinanceWidgetSchema : WeatherWidgetSchema;
  const result = schema.safeParse(parsed);

  if (!result.success) {
    result.error.issues.forEach((issue: { path: (string | number)[]; message: string }) => {
      issues.push(`${issue.path.join(".")}: ${issue.message}`);
    });
  }

  return issues;
}

/**
 * Builds a correction prompt for the model to fix a malformed widget block.
 * Used when auto-retry is triggered.
 */
export function buildWidgetCorrectionPrompt(errors: WidgetError[]): string {
  const errorDescriptions = errors.map((e) => {
    return `Widget type: ${e.widgetType}\nIssues: ${e.issues.join("; ")}\nOriginal JSON: ${e.rawJson}`;
  }).join("\n\n");

  return `Your previous response contained invalid JSON in a widget block. Please fix the following errors and return the corrected response.

${errorDescriptions}

IMPORTANT: Return the FULL corrected response (not just the JSON block). Keep all surrounding text intact. Only fix the widget JSON.`;
}
