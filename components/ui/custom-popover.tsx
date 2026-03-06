"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface CustomPopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  openDelay?: number;
  closeDelay?: number;
}

export function CustomPopover({
  children,
  content,
  align = "center",
  side = "top",
  openDelay = 200,
  closeDelay = 300,
}: CustomPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const calculatePosition = () => {
    if (!wrapperRef.current || !popoverRef.current) return;

    const triggerRect = wrapperRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newTop = 0;
    let newLeft = 0;

    // Y Axis (Top/Bottom)
    if (side === "top") {
      newTop = triggerRect.top - popoverRect.height - 8;
      // Flip to bottom if clipping top
      if (newTop < 10) newTop = triggerRect.bottom + 8;
    } else {
      newTop = triggerRect.bottom + 8;
      // Flip to top if clipping bottom
      if (newTop + popoverRect.height > viewportHeight - 10) {
         newTop = triggerRect.top - popoverRect.height - 8;
      }
    }

    // X Axis (Align)
    if (align === "center") {
      newLeft = triggerRect.left + (triggerRect.width / 2) - (popoverRect.width / 2);
    } else if (align === "start") {
      newLeft = triggerRect.left;
    } else if (align === "end") {
      newLeft = triggerRect.right - popoverRect.width;
    }

    // Horizontal Viewport boundaries
    if (newLeft < 10) newLeft = 10;
    if (newLeft + popoverRect.width > viewportWidth - 10) {
       newLeft = viewportWidth - popoverRect.width - 10;
    }

    setPosition({ top: newTop, left: newLeft });
  };

  useEffect(() => {
    if (isOpen) {
      // Small timeout to let DOM render before calculating
      setTimeout(calculatePosition, 0); 
      window.addEventListener("scroll", calculatePosition, true);
      window.addEventListener("resize", calculatePosition);
    }
    return () => {
      window.removeEventListener("scroll", calculatePosition, true);
      window.removeEventListener("resize", calculatePosition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(true), openDelay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(false), closeDelay);
  };

  return (
    <span
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-block relative cursor-pointer"
    >
      {children}

      {isMounted && isOpen && createPortal(
        <div 
          ref={popoverRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="fixed z-[100] animate-in fade-in zoom-in-95 duration-200"
          style={{ top: position.top, left: position.left }}
        >
           {content}
        </div>,
        document.body
      )}
    </span>
  );
}
