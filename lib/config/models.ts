/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, ProviderId, AIProvider } from "@/lib/ai/types";
import { openai, mistral, anthropic, huggingface, deepseek, zhipu, xai, gemini } from "@/lib/ai/providers";

// Re-export for compatibility
export type { Model, ProviderId } from "@/lib/ai/types";

// 1. Dynamic Provider Registry Array
export const providerRegistry: AIProvider[] = [
    openai, mistral, anthropic, huggingface, deepseek, zhipu, xai, gemini
];

// 2. Aggregate Models dynamically
export const models: Model[] = providerRegistry.flatMap(p => p.models);

// 3. Aggregate Provider Configs (for UI compatibility)
export const providers = providerRegistry.reduce((acc, p) => {
    acc[p.id as ProviderId] = {
        name: p.name,
        logo: p.logo,
        apiConfig: {
            apiKeyEnv: p.config.apiKeyEnv,
            adapterType: p.id as any
        }
    };
    return acc;
}, {} as Record<ProviderId, any>);
