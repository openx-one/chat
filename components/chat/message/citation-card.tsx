"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { SearchResult } from "@/lib/tools/web-search";

export function CitationCard({ citations, initialIndex = 0 }: { citations: SearchResult[]; initialIndex?: number }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!citations || citations.length === 0) return null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % citations.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + citations.length) % citations.length);
  };

  const current = citations[currentIndex];
  
  // Format origin nicely
  const displayHost = current.source || (current.link ? new URL(current.link).hostname : "Web");
  const fallbackIcon = `https://www.google.com/s2/favicons?domain=${displayHost}`;

  return (
    <div 
        className="w-[320px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent clicking the card from closing it
    >
      {/* Header controls (if multiple citations) */}
      {citations.length > 1 && (
        <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 select-none">
          <div className="flex items-center gap-1">
            <button 
                onClick={handlePrev}
                className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 transition-colors"
                title="Previous Source"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
                onClick={handleNext}
                className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 transition-colors"
                title="Next Source"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
             {currentIndex + 1} of {citations.length}
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div 
          onClick={() => window.open(current.link, "_blank", "noopener,noreferrer")}
          role="button"
          tabIndex={0}
          className="flex flex-col p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors group cursor-pointer"
      >
          {/* Source branding */}
          <div className="flex items-center gap-2 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.imageUrl || fallbackIcon} alt={displayHost} className="w-4 h-4 rounded-sm object-cover bg-white" />
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {displayHost}
              </span>
              <ExternalLink className="w-3 h-3 text-neutral-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold text-neutral-900 dark:text-white leading-snug line-clamp-2 mb-1">
              {current.title}
          </h4>

          {/* Snippet & Date */}
          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3 mt-1 leading-relaxed">
              {current.date && <span className="font-medium mr-1">{current.date} —</span>}
              {current.snippet || current.title}
          </p>
      </div>
    </div>
  );
}
