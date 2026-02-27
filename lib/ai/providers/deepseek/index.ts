/* eslint-disable @typescript-eslint/no-explicit-any */
import { AIProvider } from "../../types";
import { OpenAIAdapter } from "../openai/adapter";
import { Model } from "@/lib/config/models";

export const deepseek: AIProvider = {
    id: "deepseek",
    name: "DeepSeek",
    logo: "/model-logo/deepseek.svg",
    config: { apiKeyEnv: "DEEPSEEK_API_KEY" },
    createConnection: (modelId: string) => {
        return new OpenAIAdapter(modelId, { 
            baseURL: "https://api.deepseek.com",
            apiKey: process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || "" 
        });
    },
    models: [
        {
            id: "deepseek-chat",
            name: "DeepSeek V3",
            description: "Advanced Logic",
            provider: "deepseek",
            tier: "flagship",
            usageTier: "paid",
            enabled: true,
            capabilities: { vision: true, tools: true, imageGeneration: false, videoRecognition: false },
            icon: undefined as any,
            maxTokens: 0,
            type: "",
            cost: { input: 0, output: 0 }
        }
    ] as Model[]
};
