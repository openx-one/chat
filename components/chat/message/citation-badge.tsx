"use client";

import React from "react";
import { CustomPopover } from "@/components/ui/custom-popover";
import { CitationCard } from "./citation-card";
import { SearchResult } from "@/lib/tools/web-search";

interface CitationBadgeProps {
  /** The primary citation(s) matched to this specific link */
  citations: SearchResult[];
  /** ALL citations available for this message (enables navigation across sources) */
  allCitations?: SearchResult[];
}

export function CitationBadge({ citations, allCitations }: CitationBadgeProps) {
  if (!citations || citations.length === 0) return null;

  // Build the full list: primary citations first, then remaining from allCitations
  const primaryLinks = new Set(citations.map(c => c.link));
  const remaining = (allCitations || []).filter(c => !primaryLinks.has(c.link));
  const fullList = [...citations, ...remaining];

  // Use the first match as the primary label
  const primary = citations[0];
  
  // Extract a clean short source name
  let sourceLabel = primary.source || "Web";
  if (sourceLabel.includes(".")) {
      const parts = sourceLabel.split('.');
      if (parts.length >= 2) {
          const namePart = parts[parts.length - 2];
          sourceLabel = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      }
  }
  // Truncate long names
  if (sourceLabel.length > 18) {
    sourceLabel = sourceLabel.slice(0, 16) + '…';
  }

  const Badge = (
    <span 
        className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors cursor-pointer select-none align-baseline text-[10px] leading-none"
        style={{ verticalAlign: 'baseline' }}
    >
      <span className="text-gray-600 hover:text-gray-400 font-medium truncate">{sourceLabel}</span>
    </span>
  );

  return (
    <CustomPopover 
        content={<CitationCard citations={fullList} initialIndex={0} />}
        align="center"
        side="top"
        openDelay={200}
    >
        {Badge}
    </CustomPopover>
  );
}
