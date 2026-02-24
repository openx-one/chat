"use client"

import React from "react";
import { observer } from "mobx-react-lite";
import { imageStore } from "@/lib/store/image-store";
import { ImageHistorySidebar } from "./image-history-sidebar";
import { PromptHelper } from "./prompt-helper";
import { ImagePromptHub } from "./image-prompt-hub";
import { GalleryGrid } from "./gallery-grid";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { 
    Dialog, 
    DialogContent 
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Sparkles, Image as ImageIcon, Loader2, Maximize2, X, Download } from "lucide-react";

export const ImageGeneratorView = observer(() => {
    
    // Switch between gallery and active editor
    const isEditor = imageStore.viewMode === "editor";

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
            {/* Left History Sidebar */}
            <ImageHistorySidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative min-w-0">
                <ScrollArea className="flex-1">
                    <div className="h-full w-full flex flex-col">
                        {isEditor ? (
                            <ImageEditorView />
                        ) : (
                            <div className="p-8 max-w-7xl mx-auto w-full">
                                <div className="flex items-center justify-between mb-8">
                                    <h1 className="text-2xl font-bold flex items-center gap-3">
                                        <Sparkles className="h-6 w-6 text-indigo-500" />
                                        My Gallery
                                    </h1>
                                </div>
                                <GalleryGrid />
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Central Input Hub */}
                <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
                    <div className="w-full h-40 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent" />
                    <div className="pointer-events-auto">
                        <ImagePromptHub />
                    </div>
                </div>

                {/* Lightbox / Fullscreen Viewer */}
                {imageStore.lightboxImage && (
                    <Dialog open={!!imageStore.lightboxImage} onOpenChange={(open) => !open && imageStore.setLightboxImage(null)}>
                        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-white/10 overflow-hidden flex items-center justify-center">
                            <div className="relative w-full h-full flex items-center justify-center">
                                <Image 
                                    src={imageStore.lightboxImage} 
                                    alt="Generated Image Fullscreen" 
                                    width={1200}
                                    height={1200}
                                    className="object-contain max-w-full max-h-[90vh]"
                                />
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <a 
                                        href={imageStore.lightboxImage} 
                                        download="generated-image.png"
                                        className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
                                    >
                                        <Download className="h-5 w-5" />
                                    </a>
                                    <button 
                                        onClick={() => imageStore.setLightboxImage(null)}
                                        className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </main>

            {/* Right Prompt Helper Sidebar */}
            <PromptHelper />
        </div>
    );
});

const ImageEditorView = observer(() => {
    const { activeGeneration, isGenerating, prompt } = imageStore;

    if (isGenerating && !activeGeneration) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="relative mb-8">
                    <div className="h-24 w-24 rounded-full border-t-2 border-indigo-500 animate-spin" />
                    <ImageIcon className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
                </div>
                <h2 className="text-xl font-medium mb-2">Creating your masterpiece...</h2>
                <p className="text-white/40 text-sm max-w-md mx-auto italic">&quot;{prompt}&quot;</p>
            </div>
        );
    }

    if (!activeGeneration) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-white/20 p-8 text-center">
                <Sparkles className="h-12 w-12 mb-4 opacity-10" />
                <p className="text-lg font-medium">Start your creation by entering a prompt below</p>
                <p className="text-sm">Experiment with ratios, styles, and quality in the helper sidebar</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="max-w-2xl w-full">
                {/* Image Card - Modern Compact Taste */}
                <div className="relative group rounded-[40px] overflow-hidden shadow-[0_48px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/10 bg-[#0a0a0a] aspect-square transition-all hover:ring-white/20">
                    {isGenerating && (
                         <div className="absolute inset-0 bg-black/60 backdrop-blur-xl z-10 flex flex-col items-center justify-center text-center p-12">
                            <div className="relative mb-8">
                                <div className="h-24 w-24 rounded-full border-t-2 border-indigo-500/50 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                                </div>
                            </div>
                            <h3 className="text-lg font-medium text-white/80">Updating...</h3>
                         </div>
                    )}
                    
                    <Image 
                        src={activeGeneration.url} 
                        alt={activeGeneration.prompt} 
                        fill
                        className={cn(
                            "object-contain transition-all duration-1000 ease-out cursor-pointer",
                            isGenerating ? "scale-95 blur-md opacity-30" : "scale-100 blur-0 opacity-100 group-hover:scale-[1.02]"
                        )}
                        onClick={() => imageStore.setLightboxImage(activeGeneration.url)}
                    />
                    
                    {/* Action Overlay */}
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <button 
                            onClick={() => imageStore.setLightboxImage(activeGeneration.url)}
                            className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-2xl"
                        >
                            <Maximize2 className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent translate-y-full group-hover:translate-y-0 transition-all duration-500 ease-out">
                         <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em]">Model Active</div>
                                <div className="text-sm font-medium text-white/90">
                                    {activeGeneration.model} • {activeGeneration.ratio}
                                </div>
                            </div>
                            <button className="h-10 px-4 rounded-xl bg-indigo-600/20 text-indigo-400 text-xs font-bold border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all">
                                Enhance Prompt
                            </button>
                         </div>
                    </div>
                </div>

                {/* Prompt Card - Minimal & Clean */}
                <div className="mt-12 group transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-1 w-12 bg-indigo-500/30 rounded-full" />
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Technical Details</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:border-white/10 group-hover:shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
                        <p className="text-white/70 leading-relaxed text-base italic line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                            &quot;{activeGeneration.prompt}&quot;
                        </p>
                        
                        {activeGeneration.revised_prompt && (
                             <div className="mt-6 pt-6 border-t border-white/5 animate-in slide-in-from-top-2">
                                <div className="text-[10px] font-bold text-indigo-400/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Sparkles className="h-3 w-3" />
                                    Refined by Assistant
                                </div>
                                <p className="text-white/40 text-xs leading-relaxed max-w-xl">{activeGeneration.revised_prompt}</p>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});
