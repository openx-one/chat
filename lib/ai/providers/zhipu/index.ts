/* eslint-disable @typescript-eslint/no-explicit-any */
import { AIProvider } from "../../types";
import { OpenAIAdapter } from "../openai/adapter";
import { Model } from "@/lib/config/models";

export const zhipu: AIProvider = {
    id: "zhipu",
    name: "Zhipu AI",
    logo: "/model-logo/zhipu.svg",
    config: { apiKeyEnv: "ZHIPU_API_KEY" },
    createConnection: (modelId: string) => {
        return new OpenAIAdapter(modelId, { 
            baseURL: "https://open.bigmodel.cn/api/paas/v4",
            apiKey: process.env.ZHIPU_API_KEY || process.env.NEXT_PUBLIC_ZHIPU_API_KEY || "" 
        });
    },
    models: [
        {
            id: "glm-4.6",
            name: "GLM 4.6",
            description: "Global Logic Model",
            provider: "zhipu",
            tier: "flagship",
            usageTier: "paid",
            enabled: true,
            capabilities: { vision: true, tools: true, imageGeneration: false, videoRecognition: false },
            icon: undefined as any,
            maxTokens: 0, type: "", cost: { input: 0, output: 0 }
        },
        {
            id: "glm-4-flash",
            name: "GLM 4 Flash",
            description: "High Speed",
            provider: "zhipu",
            tier: "mode",
            usageTier: "free",
            enabled: false,
            capabilities: { vision: true, tools: true, imageGeneration: false, videoRecognition: false },
            icon: undefined as any,
            maxTokens: 0, type: "", cost: { input: 0, output: 0 }
        }
    ] as Model[]
};
