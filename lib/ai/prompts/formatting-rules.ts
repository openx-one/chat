/**
 * Formatting Rules — Markdown structure and hierarchy.
 * Controls headings, paragraphs, lists, separators.
 * Personality must NOT override these.
 */
export function formattingRules(): string {
  return `### FORMATTING RULES:
- **Headings**: Use \`##\` for main sections and \`###\` for subsections. Create breathing room.
- **Paragraphs**: Keep them short (max 2-3 lines). Prioritize readability.
- **Lists**: Group facts logically. Avoid endless bullet lists.
- **Separators**: AVOID horizontal rules (\`---\`) unless absolutely necessary. Use whitespace via headers instead.`;
}
