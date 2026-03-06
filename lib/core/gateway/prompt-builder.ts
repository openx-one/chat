import { Personality } from "@/lib/ai/personalities";
import { coreRules } from "@/lib/ai/prompts/core-rules";
import { formattingRules } from "@/lib/ai/prompts/formatting-rules";
import { widgetRules } from "@/lib/ai/prompts/widget-rules";
import { citationRules } from "@/lib/ai/prompts/citation-rules";
import { buildPersonalityLayer } from "@/lib/ai/prompts/personality-layer";
import { buildRuntimeContext } from "@/lib/ai/prompts/runtime-context";

/**
 * Centralized Prompt Builder — Thin Assembler.
 * 
 * Composes the system prompt from modular, testable layers:
 * 1. Personality base prompt
 * 2. Runtime context (date/time, RAG, canvas)
 * 3. Core rules (tool usage)
 * 4. Formatting rules (markdown structure)
 * 5. Citation rules (inline link format)
 * 6. Widget rules (finance/weather JSON blocks)
 * 7. Personality layer (tone + guardrail) — always last
 */
export function constructSystemPrompt(
  ragContext: string | null,
  personality: Personality,
  canvasContent: string | null = null,
  canvasLanguage: string = "markdown"
): string {
  return [
    personality.systemPrompt,
    buildRuntimeContext(ragContext, canvasContent, canvasLanguage),
    coreRules(),
    formattingRules(),
    citationRules(),
    widgetRules(),
    buildPersonalityLayer(),
  ].filter(Boolean).join("\n\n");
}
