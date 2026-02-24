/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeAutoObservable, runInAction } from "mobx";
import { IMAGE_MODELS, ImageModelMode } from "../config/image-models";

export type ImageGenerationViewMode = "gallery" | "editor";

export interface ImageGenerationSettings {
    ratio: string;
    quality: string;
    style: string;
    seed: string;
    guidance: number;
    strength: number;
    steps: number;
}

const DEFAULT_SETTINGS: ImageGenerationSettings = {
    ratio: "1:1",
    quality: "standard",
    style: "none",
    seed: "",
    guidance: 7.5,
    strength: 0.75,
    steps: 20,
};

class ImageStore {
    viewMode: ImageGenerationViewMode = "gallery";
    generationMode: ImageModelMode = "t2i";
    isHistoryOpen: boolean = true;
    isPromptHelperOpen: boolean = false;
    
    // Active prompt text
    prompt: string = "";
    negativePrompt: string = "";
    
    // Source Image for I2I
    sourceImage: string | null = null;
    
    // History
    history: any[] = [];
    isLoadingHistory: boolean = false;
    
    // Active Model
    activeModel: string = "dall-e-3";
    
    // Settings
    settings: ImageGenerationSettings = { ...DEFAULT_SETTINGS };
    
    // Active Generation State
    isGenerating: boolean = false;
    activeGeneration: any | null = null;
    
    // Lightbox State
    lightboxImage: string | null = null;

    constructor() {
        makeAutoObservable(this);
        // Load history on initialization if browser-side
        if (typeof window !== "undefined") {
            this.loadHistory();
        }
    }

    setViewMode(mode: ImageGenerationViewMode) {
        this.viewMode = mode;
    }

    setLightboxImage(url: string | null) {
        this.lightboxImage = url;
    }

    setGenerationMode(mode: ImageModelMode) {
        this.generationMode = mode;
    }

    setHistoryOpen(open: boolean) {
        this.isHistoryOpen = open;
    }

    setPromptHelperOpen(open: boolean) {
        this.isPromptHelperOpen = open;
    }

    setPrompt(prompt: string) {
        this.prompt = prompt;
    }

    setNegativePrompt(prompt: string) {
        this.negativePrompt = prompt;
    }

    setSourceImage(url: string | null) {
        this.sourceImage = url;
    }

    setActiveModel(modelId: string) {
        this.activeModel = modelId;
        // Optionally reset settings that might not be compatible
    }

    updateSetting<K extends keyof ImageGenerationSettings>(key: K, value: ImageGenerationSettings[K]) {
        this.settings[key] = value;
    }

    resetSettings() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.sourceImage = null;
        this.negativePrompt = "";
    }

    async loadHistory() {
        this.isLoadingHistory = true;
        try {
            const response = await fetch("/api/image/history");
            if (response.ok) {
                const data = await response.json();
                runInAction(() => {
                    this.history = data.history || [];
                });
            }
        } catch (err) {
            console.error("Failed to load image history", err);
        } finally {
            runInAction(() => {
                this.isLoadingHistory = false;
            });
        }
    }

    async generateImage() {
        if (!this.prompt.trim()) return;

        this.isGenerating = true;
        this.setViewMode("editor");

        try {
            const response = await fetch("/api/image/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: this.prompt,
                    negativePrompt: this.negativePrompt,
                    model: this.activeModel,
                    mode: this.generationMode,
                    sourceImage: this.sourceImage,
                    ...this.settings
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Generation failed");
            }

            const data = await response.json();
            runInAction(() => {
                this.activeGeneration = data;
                this.history.unshift(data); // Optimistic update
            });
        } catch (err: any) {
            console.error("Generation Error:", err);
            // Handle error in UI
        } finally {
            runInAction(() => {
                this.isGenerating = false;
            });
        }
    }
}

export const imageStore = new ImageStore();
