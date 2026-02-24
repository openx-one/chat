"use client";

import React from "react";
import { observer } from "mobx-react-lite";
import { imageStore } from "@/lib/store/image-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Grid, 
    Image as ImageIcon, 
    Plus, 
    ChevronLeft, 
    Search,
    Settings,
    HelpCircle,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ImageHistorySidebar = observer(() => {
    const isOpen = imageStore.isHistoryOpen;

    if (!isOpen) {
        return (
            <div className="w-12 border-right border-white/10 flex flex-col items-center py-4 gap-4 bg-[#0a0a0a]">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => imageStore.setHistoryOpen(true)}
                    className="text-white/50 hover:text-white"
                >
                    <Plus className="h-5 w-5" />
                </Button>
                <div className="h-px w-6 bg-white/10" />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => imageStore.setViewMode('gallery')}
                    className={cn("text-white/50 hover:text-white", imageStore.viewMode === 'gallery' && "text-indigo-400")}
                >
                    <Grid className="h-5 w-5" />
                </Button>
            </div>
        );
    }

    return (
        <div className="w-64 border-r border-white/10 bg-[#0a0a0a] flex flex-col h-full animate-in slide-in-from-left duration-300 font-sans">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold">
                    <ImageIcon className="h-5 w-5 text-indigo-500" />
                    <span>Library</span>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => imageStore.setHistoryOpen(false)}
                    className="text-white/40 hover:text-white h-7 w-7"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>

            {/* Main Actions */}
            <div className="px-3 space-y-1">
                 <Button 
                    className="w-full justify-start gap-3 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl h-10 shadow-lg shadow-indigo-600/20"
                    onClick={() => {
                        imageStore.setViewMode('editor');
                        imageStore.activeGeneration = null;
                        imageStore.prompt = "";
                    }}
                >
                    <Plus className="h-4 w-4" />
                    Generate
                </Button>

                <Button 
                    variant="ghost" 
                    className={cn(
                        "w-full justify-start gap-3 text-white/60 hover:text-white hover:bg-white/5 h-10 rounded-xl",
                        imageStore.viewMode === 'gallery' && "bg-white/5 text-white"
                    )}
                    onClick={() => imageStore.setViewMode('gallery')}
                >
                    <Grid className="h-4 w-4" />
                    My Images
                </Button>

                 <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 text-white/60 hover:text-white hover:bg-white/5 h-10 rounded-xl"
                >
                    <Search className="h-4 w-4" />
                    Explore
                </Button>
            </div>

            {/* Recent Generations Section */}
            <div className="mt-8 flex-1 flex flex-col min-h-0">
                <div className="px-4 mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Recent</span>
                    {imageStore.isLoadingHistory && <Loader2 className="h-3 w-3 animate-spin text-white/20" />}
                </div>
                
                <ScrollArea className="flex-1 px-2">
                    <div className="space-y-1 pb-4">
                        {imageStore.history.length === 0 && !imageStore.isLoadingHistory && (
                            <div className="px-2 py-4 text-center">
                                <p className="text-[10px] text-white/20 uppercase font-medium">No history yet</p>
                            </div>
                        )}
                        {imageStore.history.map((item) => (
                            <HistoryItem 
                                key={item.id}
                                title={item.prompt} 
                                isActive={imageStore.activeGeneration?.id === item.id} 
                                icon={ImageIcon}
                                onClick={() => {
                                    imageStore.activeGeneration = item;
                                    imageStore.setViewMode('editor');
                                }}
                            />
                        ))}
                    </div>

                </ScrollArea>
            </div>
        </div>
    );
});

interface HistoryItemProps {
    title: string;
    isActive: boolean;
    icon: React.ElementType;
    onClick?: () => void;
}

const HistoryItem = ({ title, isActive, icon: Icon, onClick }: HistoryItemProps) => (
    <Button 
        variant="ghost" 
        onClick={onClick}
        className={cn(
            "w-full justify-start gap-3 text-white/50 hover:text-white hover:bg-white/5 h-9 rounded-lg px-2 text-xs transition-all group overflow-hidden",
            isActive && "bg-white/10 text-white"
        )}
    >
        <Icon className={cn("h-3.5 w-3.5 shrink-0", "text-white/40 group-hover:text-white/80")} />
        <span className="truncate text-left font-normal">{title}</span>
    </Button>
);

interface FooterItemProps {
    icon: React.ElementType;
    label: string;
}

const FooterItem = ({ icon: Icon, label }: FooterItemProps) => (
    <Button variant="ghost" className="w-full justify-start gap-3 text-white/40 hover:text-white hover:bg-white/5 h-8 rounded-lg px-2 text-[11px]">
        <Icon className="h-3.5 w-3.5" />
        {label}
    </Button>
);
