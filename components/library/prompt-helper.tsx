"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { observer } from "mobx-react-lite";
import { imageStore } from "@/lib/store/image-store";
import { IMAGE_MODELS } from "@/lib/config/image-models";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    ChevronRight,
    RotateCcw,
    Maximize2,
    Zap,
    Sparkles,
    Palette,
    Settings,
    Activity,
    EyeOff
} from "lucide-react";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export const PromptHelper = observer(() => {
    const isOpen = imageStore.isPromptHelperOpen;
    const { settings } = imageStore;
    const activeModel = IMAGE_MODELS.find(m => m.id === imageStore.activeModel);

    if (!isOpen) return null;

    return (
        <div className="w-80 border-l border-white/10 bg-[#0a0a0a] flex flex-col h-full animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/5 font-sans">
                <span className="text-white font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4 text-indigo-400" />
                    Pro Controls
                </span>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => imageStore.resetSettings()}
                        className="text-indigo-400 hover:text-indigo-300 h-7 text-[10px] uppercase font-bold tracking-wider"
                    >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => imageStore.setPromptHelperOpen(false)}
                        className="text-white/40 hover:text-white h-7 w-7"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 font-sans">
                <div className="p-4 space-y-8">
                    {/* Mode Section */}
                    {imageStore.generationMode === 'i2i' && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">
                                <Activity className="h-3.5 w-3.5" />
                                Image-to-Image
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-white/70">Strength</span>
                                    <span className="text-[10px] font-mono text-white/50">{settings.strength}</span>
                                </div>
                                <Slider 
                                    value={[settings.strength]} 
                                    min={0.01} 
                                    max={1} 
                                    step={0.01}
                                    onValueChange={([val]) => imageStore.updateSetting('strength', val)}
                                    className="py-2"
                                />
                                <p className="text-[10px] text-white/20">How much of the original image to keep (0.01 = almost same, 1.0 = completely different)</p>
                            </div>
                        </section>
                    )}

                    {/* Technical Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">
                            <Zap className="h-3.5 w-3.5" />
                            Technical
                        </div>

                        {/* Aspect Ratio */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/70 flex items-center gap-2">
                                    <Maximize2 className="h-3.5 w-3.5" />
                                    Ratio
                                </span>
                                <span className="text-[10px] font-mono text-white/50">{settings.ratio}</span>
                            </div>
                            <Select 
                                value={settings.ratio} 
                                onValueChange={(val) => imageStore.updateSetting('ratio', val)}
                            >
                                <SelectTrigger className="w-full bg-[#1a1a1a] border-white/10 text-white h-9 rounded-lg text-xs">
                                    <SelectValue placeholder="Select ratio" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                    {activeModel?.capabilities.ratios.map(r => (
                                        <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Guidance Scale */}
                        {activeModel?.capabilities.guidance && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-white/70 flex items-center gap-2">
                                        <Activity className="h-3.5 w-3.5" />
                                        Guidance
                                    </span>
                                    <span className="text-[10px] font-mono text-white/50">{settings.guidance}</span>
                                </div>
                                <Slider 
                                    value={[settings.guidance]} 
                                    min={1} 
                                    max={20} 
                                    step={0.5}
                                    onValueChange={([val]) => imageStore.updateSetting('guidance', val)}
                                    className="py-2"
                                />
                            </div>
                        )}

                        {/* Inference Steps */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/70">Steps</span>
                                <span className="text-[10px] font-mono text-white/50">{settings.steps}</span>
                            </div>
                            <Slider 
                                value={[settings.steps]} 
                                min={1} 
                                max={100} 
                                step={1}
                                onValueChange={([val]) => imageStore.updateSetting('steps', val)}
                                className="py-2"
                            />
                        </div>

                         {/* Quality (DALL-E) */}
                         {activeModel?.capabilities.quality && (
                          <div className="space-y-2">
                             <div className="flex justify-between items-center">
                                 <span className="text-xs text-white/70 flex items-center gap-2">
                                     <Sparkles className="h-3.5 w-3.5" />
                                     Quality
                                 </span>
                             </div>
                              <Select 
                                 value={settings.quality} 
                                 onValueChange={(val) => imageStore.updateSetting('quality', val)}
                             >
                                 <SelectTrigger className="w-full bg-[#1a1a1a] border-white/10 text-white h-9 rounded-lg text-xs">
                                     <SelectValue placeholder="Select quality" />
                                 </SelectTrigger>
                                 <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                     <SelectItem value="standard" className="text-xs">Standard</SelectItem>
                                     <SelectItem value="hd" className="text-xs">HD (High Detail)</SelectItem>
                                 </SelectContent>
                             </Select>
                         </div>
                         )}

                        {/* Seed */}
                        {activeModel?.capabilities.seed && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs text-white/70">
                                    Seed
                                </div>
                                <input 
                                    className="w-full bg-[#1a1a1a] border border-white/10 text-white h-9 rounded-lg px-3 text-xs focus:outline-none focus:border-indigo-500/50"
                                    placeholder="Random (Default)"
                                    value={settings.seed}
                                    onChange={(e) => imageStore.updateSetting('seed', e.target.value)}
                                />
                            </div>
                        )}
                    </section>

                    {/* Negative Prompt */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">
                            <EyeOff className="h-3.5 w-3.5" />
                            Negative Prompt
                        </div>
                        <textarea 
                            className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-lg p-3 text-xs focus:outline-none focus:border-indigo-500/50 min-h-[80px]"
                            placeholder="Describe what NOT to include..."
                            value={imageStore.negativePrompt}
                            onChange={(e) => imageStore.setNegativePrompt(e.target.value)}
                        />
                    </section>

                    {/* Styling Section */}
                    {activeModel?.capabilities.styles && (
                        <section className="space-y-4 pb-10">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">
                                <Palette className="h-3.5 w-3.5" />
                                Artistic Styling
                            </div>

                            <StyleSelector 
                                label="Art Style" 
                                icon={Palette} 
                                value={settings.style} 
                                options={['Standard', 'Cinematic', '3D Render', 'Anime', 'Oil Painting', 'Digital Art', 'Abstract', 'Vaporwave']}
                                onChange={(val: string) => imageStore.updateSetting('style', val)}
                            />
                        </section>
                    )}
                </div>
            </ScrollArea>

            {/* Sticky Bottom Action */}
            <div className="p-4 bg-[#0a0a0a] border-t border-white/10">
                 <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 font-bold shadow-lg shadow-indigo-600/20"
                    onClick={() => {
                        imageStore.generateImage();
                        imageStore.setPromptHelperOpen(false);
                    }}
                >
                    Generate Now
                </Button>
            </div>
        </div>
    );
});

const StyleSelector = ({ label, icon: Icon, value, options, onChange }: any) => (
    <div className="space-y-2">
        <span className="text-xs text-white/70 flex items-center gap-2">
            <Icon className="h-3.5 w-3.5" />
            {label}
        </span>
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full bg-[#1a1a1a] border-white/10 text-white h-9 rounded-lg text-xs">
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                {options.map((opt: string) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);
