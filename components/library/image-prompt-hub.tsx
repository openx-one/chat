"use client";

import React from "react";
import { observer } from "mobx-react-lite";
import { imageStore } from "@/lib/store/image-store";
import { IMAGE_MODELS } from "@/lib/config/image-models";
import { Send, Sparkles, SlidersHorizontal, ChevronDown, Check, ImageIcon, X, Loader2, MoveUpIcon } from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";

export const ImagePromptHub = observer(() => {
    const handleSend = () => {
        if (!imageStore.prompt.trim()) return;
        imageStore.generateImage();
        imageStore.setPrompt(""); // Clear input on send
    };

    const activeModelObj = IMAGE_MODELS.find(m => m.id === imageStore.activeModel);

    return (
        <div className="w-full max-w-4xl mx-auto px-6 pb-10">
            <div className="bg-[#0f0f0f]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)] p-2 transition-all hover:border-white/20 ring-1 ring-white/5">
                
                {/* Compact Mode & Model Row */}
                <div className="flex items-center justify-between px-3 h-10 mb-1">
                    <div className="flex items-center gap-2">
                        <div className="flex bg-white/5 rounded-full p-0.5">
                            <button 
                                onClick={() => imageStore.setGenerationMode('t2i')}
                                className={cn(
                                    "px-4 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5",
                                    imageStore.generationMode === 't2i' ? "bg-indigo-600 text-white" : "text-white/30 hover:text-white"
                                )}
                            >
                                <Sparkles className="h-3 w-3" />
                                Text
                            </button>
                            <button 
                                onClick={() => imageStore.setGenerationMode('i2i')}
                                className={cn(
                                    "px-4 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5",
                                    imageStore.generationMode === 'i2i' ? "bg-indigo-600 text-white" : "text-white/30 hover:text-white"
                                )}
                            >
                                <ImageIcon className="h-3 w-3" />
                                Image
                            </button>
                        </div>

                        <div className="h-3 w-[1px] bg-white/10 mx-1" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                 <button className="h-7 px-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-all flex items-center gap-2 group/mode">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{activeModelObj?.name || "Model"}</span>
                                    <ChevronDown className="h-3 w-3 opacity-30 group-hover/mode:opacity-100" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-[#0f0f0f] border-white/10 text-white w-64 rounded-3xl overflow-hidden shadow-2xl p-1.5 backdrop-blur-3xl">
                                {IMAGE_MODELS.map((model) => (
                                    <DropdownMenuItem 
                                        key={model.id}
                                        onClick={() => imageStore.setActiveModel(model.id)}
                                        className="flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-2xl hover:bg-white/5 focus:bg-white/5 data-[highlighted]:bg-white/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                <model.icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{model.name}</span>
                                                <span className="text-[10px] text-white/40">{model.provider}</span>
                                            </div>
                                        </div>
                                        {imageStore.activeModel === model.id && <Check className="h-4 w-4 text-indigo-400" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Quick status for pro controls */}
                    <div className="flex items-center gap-3 pr-2">
                        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] font-bold text-white/20">
                            Ratio <span className="text-indigo-400/80">{imageStore.settings.ratio}</span>
                        </div>
                        {imageStore.settings.style !== 'none' && (
                             <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] font-bold text-white/20">
                                Style <span className="text-indigo-400/80">{imageStore.settings.style}</span>
                             </div>
                        )}
                    </div>
                </div>

                {/* Main Input Pill */}
                <div className="flex items-center gap-2 pl-3 pr-1 py-1">
                    {/* I2I Source Preview - Very Compact */}
                    {imageStore.generationMode === 'i2i' && (
                        <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 shrink-0 relative overflow-hidden group/img animate-in zoom-in-95">
                           {imageStore.sourceImage ? (
                               <>
                                <Image src={imageStore.sourceImage} alt="Source" fill className="object-cover" />
                                <button 
                                    onClick={() => imageStore.setSourceImage(null)}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center z-10"
                                >
                                    <X className="h-3 w-3 text-white" />
                                </button>
                               </>
                           ) : (
                               <div className="w-full h-full flex items-center justify-center text-white/10">
                                  <ImageIcon className="h-4 w-4" />
                               </div>
                           )}
                        </div>
                    )}

                    <input 
                        value={imageStore.prompt}
                        onChange={(e) => imageStore.setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSend();
                            }
                        }}
                        placeholder={imageStore.generationMode === 'i2i' ? "What should happen to this image?" : "Imagine anything..."}
                        className="flex-1 bg-transparent border-none text-white placeholder:text-white/10 py-2 h-10 text-sm focus:ring-0 focus:outline-none"
                    />

                    <div className="flex items-center gap-1">
                        <button 
                            className={cn(
                                "h-10 px-3 rounded-full transition-all flex items-center gap-2",
                                imageStore.isPromptHelperOpen ? "bg-indigo-500/10 text-indigo-400" : "text-white/20 hover:text-white/60 hover:bg-white/5"
                            )}
                            onClick={() => imageStore.setPromptHelperOpen(!imageStore.isPromptHelperOpen)}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            {imageStore.isPromptHelperOpen ? <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Close</span> : null}
                        </button>

                        <button 
                            disabled={!imageStore.prompt.trim() || imageStore.isGenerating}
                            onClick={handleSend}
                            className={cn(
                                "h-10 w-10 rounded-full transition-all flex items-center justify-center",
                                imageStore.prompt.trim() && !imageStore.isGenerating
                                    ? "bg-white text-black hover:scale-105 active:scale-95" 
                                    : "bg-white/5 text-white/10"
                            )}
                        >
                            {imageStore.isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoveUpIcon className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});
