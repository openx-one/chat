import { AIProvider } from "../../types";
import { AnthropicAdapter } from "./adapter";
import { Model } from "@/lib/config/models";

export const anthropic: AIProvider = {
    id: "anthropic",
    name: "Anthropic",
    logo: "/model-logo/anthropic.svg",
    titleModelId: "claude-3-haiku-20240307",
    config: {
        apiKeyEnv: "ANTHROPIC_API_KEY"
    },
    createConnection: (modelId: string) => {
        return new AnthropicAdapter(modelId, { 
            apiKey: process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "" 
        });
    },
    models: [
        {
            id: "claude-4.6-opus",
            name: "Claude Opus 4.5",
            description: "Deepest Reasoning",
            provider: "anthropic",
            tier: "flagship",
            usageTier: "paid",
            enabled: true,
            capabilities: {
                vision: true, tools: true,
                imageGeneration: false,
                videoRecognition: false
            },
            icon: undefined as any,
            maxTokens: 0,
            type: "",
            cost: { input: 0, output: 0 }
        },
        {
            id: "claude-3-5-sonnet",
            name: "Claude 3.5 Sonnet",
            description: "Balanced Intelligence",
            provider: "anthropic",
            tier: "mode",
            usageTier: "paid",
            enabled: false,
            capabilities: {
                vision: true, tools: true,
                imageGeneration: false,
                videoRecognition: false
            },
            icon: undefined as any,
            maxTokens: 0,
            type: "",
            cost: { input: 0, output: 0 }
        },
        {
            id: "claude-3-haiku-20240307",
            name: "Claude 3 Haiku",
            description: "Fast & Light",
            provider: "anthropic",
            tier: "other",
            usageTier: "free",
            enabled: false,
            capabilities: {
                vision: true, tools: true,
                imageGeneration: false,
                videoRecognition: false
            },
            icon: undefined as any,
            maxTokens: 0,
            type: "",
            cost: { input: 0, output: 0 }
        }
    ] as Model[]
};
