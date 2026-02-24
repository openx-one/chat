import { Sparkles, Zap, Palette } from "lucide-react";

export type ImageModelMode = 't2i' | 'i2i';

export interface ImageModel {
    id: string;
    name: string;
    provider: string;
    description: string;
    modes: ImageModelMode[];
    capabilities: {
        ratios: string[];
        quality: boolean;
        styles: boolean;
        guidance: boolean;
        seed: boolean;
    };
    icon: React.ComponentType<any>;
}

export const IMAGE_MODELS: ImageModel[] = [
    {
        id: "dall-e-3",
        name: "DALL-E 3",
        provider: "OpenAI",
        description: "Specialized in following complex instructions and logic.",
        modes: ['t2i'],
        capabilities: {
            ratios: ["1:1", "16:9", "9:16"],
            quality: true,
            styles: false,
            guidance: false,
            seed: false
        },
        icon: Sparkles
    },
    {
        id: "stability-ultra",
        name: "Stability Ultra",
        provider: "Stability AI",
        description: "State-of-the-art cinematic and artistic generations.",
        modes: ['t2i', 'i2i'],
        capabilities: {
            ratios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
            quality: false, // Handled differently in Stability
            styles: true,
            guidance: true,
            seed: true
        },
        icon: Zap
    },
    {
        id: "flux-schnell",
        name: "FLUX.1 [schnell]",
        provider: "Black Forest Labs",
        description: "Ultra-fast, high-realism open-weight model.",
        modes: ['t2i'],
        capabilities: {
            ratios: ["1:1", "16:9", "9:16"],
            quality: false,
            styles: false,
            guidance: true,
            seed: true
        },
        icon: Palette
    }
];
