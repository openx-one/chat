/* eslint-disable @typescript-eslint/no-explicit-any */
import { AIProvider } from "../../types";
import { OpenAIAdapter } from "../openai/adapter";
import { Model } from "@/lib/config/models";

export const gemini: AIProvider = {
    id: "gemini",
    name: "Google Gemini",
    logo: "/model-logo/gemini.svg",
    config: { apiKeyEnv: "GEMINI_API_KEY" },
    createConnection: (modelId: string) => {
        return new OpenAIAdapter(modelId, { 
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
            apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" 
        });
    },
    models: [
        {
            id: "gemini-3-pro",
            name: "Gemini 3 Pro",
            description: "Google Flagship",
            provider: "gemini",
            tier: "mode",
            usageTier: "paid",
            enabled: false,
            capabilities: { vision: true, tools: true, imageGeneration: false, videoRecognition: false },
            icon: undefined as any,
            maxTokens: 0, type: "", cost: { input: 0, output: 0 }
        }
    ] as Model[]
};
