
/**
 * Telemetry — Structured logging for AI pipeline observability.
 * 
 * Currently logs to console as structured JSON.
 * Extensible: can later pipe to Supabase, analytics, or external services.
 */

export interface RequestLog {
  model: string;
  latencyMs: number;
  retryCount: number;
  validationErrors: string[];
  toolCalls?: string[];
  tokenUsage?: { input: number; output: number };
}

/**
 * Log a completed AI request with telemetry data.
 */
export function logRequest(data: RequestLog): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...data,
    status: data.validationErrors.length > 0 ? "validation_warning" : "ok",
  };

  if (data.validationErrors.length > 0) {
    console.warn("[Telemetry]", JSON.stringify(logEntry));
  } else {
    console.log("[Telemetry]", JSON.stringify(logEntry));
  }
}

/**
 * Log a tool execution event.
 */
export function logToolExecution(data: {
  toolName: string;
  executionMs: number;
  success: boolean;
  error?: string;
}): void {
  console.log("[Telemetry:Tool]", JSON.stringify({
    timestamp: new Date().toISOString(),
    ...data,
  }));
}
