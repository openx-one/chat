/**
 * Runtime Context — Dynamic context injected at request time.
 * Includes: date/time, RAG context, canvas context.
 */
export function buildRuntimeContext(
  ragContext: string | null,
  canvasContent: string | null = null,
  canvasLanguage: string = "markdown"
): string {
  const now = new Date();
  const dateString = now.toLocaleDateString("en-US", {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeString = now.toLocaleTimeString("en-US", {
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
  });

  let context = `Current Date: ${dateString}. Current Time: ${timeString}.`;

  if (ragContext) {
    context += `\n\nUse the following retrieved context to answer the user's question:\n${ragContext}`;
  }

  if (canvasContent) {
    context += `\n\n### CANVAS CONTEXT (PREVIOUSLY GENERATED CODE):
The user has the following code open in their Canvas editor. This is your "memory" of what they are working on. You can edit this or reference it.

\`\`\`${canvasLanguage}
${canvasContent}
\`\`\`

If the user asks to "fix" or "change" specific lines, refer to the code above.`;
  }

  return context;
}
