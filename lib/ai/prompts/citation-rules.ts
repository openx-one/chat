/**
 * Citation Rules — Keep AI output clean.
 * Citations are handled automatically by the UI — the AI does NOT need to format them.
 */
export function citationRules(): string {
  return `### CITATION RULES:
- Do NOT include source URLs or links in your response.
- Do NOT create References, Sources, or footnote sections.
- Do NOT write [Source](url) or paste raw URLs.
- Just write your answer naturally. Sources are shown automatically by the UI.`;
}
