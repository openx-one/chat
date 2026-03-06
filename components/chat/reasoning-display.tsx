/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Search, Globe, HatGlasses, Loader2, ExternalLink, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReasoningStep } from "@/lib/store/chat-store";
import { motion, AnimatePresence } from "framer-motion";
import { observer } from "mobx-react-lite";
import Loading from "./framer-loading";

interface ReasoningDisplayProps {
    steps: ReasoningStep[];
    connectedTo?: { name: string; icon: string };
    citations?: any[];
    isCollapsed?: boolean;
    onToggle?: () => void;
    className?: string;
    isGenerating?: boolean;
}

export const ReasoningDisplay = observer(function ReasoningDisplay({
    connectedTo,
    steps,
    citations,
    isCollapsed = false,
    onToggle,
    className,
    isGenerating = false
}: ReasoningDisplayProps) {
    const [collapsed, setCollapsed] = useState(isCollapsed);

    useEffect(() => {
        setCollapsed(isCollapsed);
    }, [isCollapsed]);

    const handleToggle = () => {
        if (onToggle) onToggle();
        else setCollapsed(!collapsed);
    };

    // Unified Thinking State
    const hasActiveTool = steps.some(s => s.status === 'thinking');
    const isInitialThinking = isGenerating && steps.length === 0;
    const isThinking = hasActiveTool || isInitialThinking;

    // Grouping Logic
    const searchSteps = steps.filter(s => s.toolName === 'web_search');
    const otherSteps = steps.filter(s => s.toolName !== 'web_search');

    const getCurrentStateLabel = () => {
        // Priority 1: Active Tool Call (specific label from executor)
        const activeToolStep = steps.find(s => s.status === 'thinking' && s.toolName);
        if (activeToolStep) {
            return activeToolStep.thought;
        }

        // Priority 2: Initial Gate (Initial model reasoning/planning)
        if (isInitialThinking) {
            return "Thinking...";
        }

        if (!isThinking) return "Done";

        // Priority 3: Analyzing search results
        if (citations && citations.length > 0) return "Analyzing sources...";
        
        return "Thinking...";
    };

    const currentStateLabel = getCurrentStateLabel();

    const getHostname = (url: string) => {
        try {
            return new URL(url).hostname;
        } catch {
            return url || "Unknown source";
        }
    };

    return (
        <div className={cn("flex flex-col font-sans select-none", className)}>
            {/* Header / Trigger - Shining Think */}
             <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={handleToggle}
                    className="flex items-center gap-2 text-base transition-colors py-1 group"
                >
                    <div className={cn(
                        "flex items-center gap-2 transition-all"
                    )}>
                        
                        {isThinking ? (
                            <div className="flex items-center gap-2 h-full">
                                {currentStateLabel !== "Thinking..." && (
                                    <div className="flex items-center justify-center shrink-0">
                                        <Loading />
                                    </div>
                                )}
                                <motion.span 
                                    className="font-semibold tracking-wide text-transparent bg-clip-text inline-flex items-center leading-none"
                                    style={{
                                        backgroundImage: "linear-gradient(135deg, #51565A 30%, #FFFFFF 50%, #51565A 70%)",
                                        backgroundSize: "200% 100%",
                                    }}
                                    animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                >
                                    {currentStateLabel}
                                </motion.span>
                            </div>
                        ) : (
                            <span className="tracking-wide text-neutral-500 dark:text-neutral-400 font-medium inline-flex items-center leading-none">
                                {currentStateLabel}
                            </span>
                        )}
                        <span className="text-neutral-500/50 pt-0.5 flex items-center justify-center translate-y-[0.5px]">
                            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </span>
                    </div>
                </button>

                {/* Connected Badge (if any) */}
                {connectedTo && collapsed && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-900/50 border border-neutral-800 text-xs text-neutral-400">
                         {connectedTo.icon && <img src={connectedTo.icon} alt="" className="h-3 w-3 rounded-sm opacity-70" />}
                         <span>{connectedTo.name}</span>
                    </div>
                )}
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {!collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-2 pl-1.5 pt-1.5 pb-1.5 border-l border-neutral-800 ml-4">
                            
                            {/* 1. Searching Section (Robust) */}
                            {searchSteps.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                        Calling Search Agent..
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {searchSteps.map((step) => {
                                            const query = step.toolArgs?.q || step.toolArgs?.query || step.toolArgs?.query_term || "web";
                                            return (
                                                <div key={step.id} className="flex items-center gap-2 py-1 text-base text-neutral-300">
                                                    <Search className="h-4 w-4 text-neutral-500" />
                                                    <span>{query}</span>
                                                    {step.status === 'thinking' && <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 2. Reviewing Sources Section */}
                            {citations && citations.length > 0 && (
                                <div className="flex flex-col gap-2 mt-2">
                                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                        Analyzing Sources...
                                    </div>
                                    <div className="flex flex-col gap-1 w-full">
                                        {citations.map((cite, idx) => (
                                            <a 
                                                key={idx} 
                                                href={cite.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between py-1.5 hover:opacity-80 transition-colors group/cite cursor-pointer text-decoration-none"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                                    {cite.icon ? (
                                                        <img src={cite.icon} alt="" className="h-4 w-4 rounded-sm shrink-0" />
                                                    ) : (
                                                        <Globe className="h-4 w-4 text-neutral-500 shrink-0" />
                                                    )}
                                                    <span className="text-base text-neutral-300 truncate">{cite.title}</span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-2 shrink-0">
                                                    <span className="text-xs text-neutral-500">
                                                        {(cite.source || getHostname(cite.url)).replace('www.', '')}
                                                    </span>
                                                    <ArrowUpRight className="h-3 w-3 text-neutral-600 opacity-40 group-hover/cite:opacity-100 transition-opacity" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 3. Other Steps (Standard) */}
                            {otherSteps.length > 0 && (
                                <div className="flex flex-col gap-2 mt-1">
                                    {otherSteps.map((step) => (
                                        <div key={step.id} className="flex items-center gap-3 text-base text-neutral-400 py-1">
                                            {step.status === 'thinking' ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                                            ) : (
                                                <HatGlasses className="h-4 w-4 text-neutral-500" />
                                            )}
                                            <span className={cn(step.status === 'thinking' && "text-neutral-300")}>
                                                {step.thought}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Fallback if nothing to show but collapsed was opened toggled manually */}
                            {searchSteps.length === 0 && (!citations || citations.length === 0) && otherSteps.length === 0 && !isThinking && (
                                <div className="text-xs text-neutral-600 italic pl-1">
                                    Ready to think...
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
