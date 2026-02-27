import { AIProvider } from "../../types";
import { OpenAIAdapter } from "../openai/adapter";
import { Model } from "@/lib/config/models";

export const xai: AIProvider = {
    id: "xai",
    name: "xAI",
    logo: "/model-logo/grok.svg",
    config: { apiKeyEnv: "XAI_API_KEY" },
    createConnection: (modelId: string) => {
        return new OpenAIAdapter(modelId, { 
            baseURL: "https://api.x.ai/v1",
            apiKey: process.env.XAI_API_KEY || process.env.NEXT_PUBLIC_XAI_API_KEY || "" 
        });
    },
    models: [
        {
            id: "grok-3",
            name: "Grok 3",
            description: "Truth-seeking & Real-time",
            provider: "xai",
            tier: "flagship",
            usageTier: "paid",
            enabled: true,
            capabilities: { vision: true, tools: true, imageGeneration: false, videoRecognition: false },
            icon: undefined as any,
            maxTokens: 0, type: "", cost: { input: 0, output: 0 }
        }
    ] as Model[]
};
