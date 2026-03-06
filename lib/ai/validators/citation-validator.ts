/**
 * Citation Validator — Validates inline citation format in model output.
 * 
 * Checks for:
 * - Proper [Name](https://...) format
 * - No generic anchor text ("More info", "Click here", "Source", etc.)
 * - No footnote-style citations like [1], [2]
 * - No "Sources" footer lists
 * 
 * Returns issues as informational warnings (no auto-repair for now).
 */

export interface CitationIssue {
  type: "generic_anchor" | "missing_url" | "footnote_style" | "sources_footer";
  text: string;
  suggestion: string;
}

const GENERIC_ANCHORS = [
  "more info",
  "click here",
  "read more",
  "source",
  "link",
  "here",
  "this",
  "learn more",
  "details",
  "see more",
];

/**
 * Validates citations in model output text.
 * Returns a list of issues found (informational).
 */
export function validateCitations(text: string): CitationIssue[] {
  const issues: CitationIssue[] = [];

  // 1. Check for generic anchor text in markdown links
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    const anchorText = match[1].trim().toLowerCase();

    if (GENERIC_ANCHORS.includes(anchorText)) {
      issues.push({
        type: "generic_anchor",
        text: match[0],
        suggestion: `Replace "${match[1]}" with the website name (e.g., [Reuters](${match[2]}))`,
      });
    }
  }

  // 2. Check for footnote-style citations: [1], [2], etc.
  const footnoteRegex = /\[(\d+)\](?!\()/g;
  while ((match = footnoteRegex.exec(text)) !== null) {
    issues.push({
      type: "footnote_style",
      text: match[0],
      suggestion: `Replace footnote ${match[0]} with an inline link [Source Name](https://...)`,
    });
  }

  // 3. Check for "Sources" footer section
  const sourcesFooterRegex = /^#{1,3}\s*Sources?\s*$/im;
  if (sourcesFooterRegex.test(text)) {
    issues.push({
      type: "sources_footer",
      text: "Sources footer section detected",
      suggestion: "Remove the Sources footer. Use inline citations instead.",
    });
  }

  // 4. Check for markdown links without URL
  const brokenLinkRegex = /\[([^\]]+)\]\(\s*\)/g;
  while ((match = brokenLinkRegex.exec(text)) !== null) {
    issues.push({
      type: "missing_url",
      text: match[0],
      suggestion: `Link "${match[1]}" is missing a URL`,
    });
  }

  return issues;
}
