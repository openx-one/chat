/* eslint-disable @typescript-eslint/no-explicit-any */
import { MessageNode } from "@/lib/store/chat-store";
import { Gateway } from "./gateway";
import { models, Model } from "@/lib/config/models";
import * as aiProviders from "@/lib/ai/providers"; 
import { RateLimiter } from "./rate-limiter";

export interface ModelResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export type StreamChunk = 
  | { type: "text"; content: string }
  | { type: "usage"; stats: { tokensPerSec: number; totalTokens: number; timeToFirstToken: number; stopReason: string; } }
  | { type: "tool_result"; content: string; name: string; tool_call_id: string }
  | { type: "tool_call"; tool_call: any; thought?: string }
  | { type: "tool_call_chunk"; tool_call: any; thought?: string };

export interface ModelAdapter {
  id: string;
  streamChat(messages: MessageNode[], userId?: string): AsyncGenerator<StreamChunk, void, unknown>;
}

class UnifiedRouter {
  private adapters: Map<string, ModelAdapter> = new Map();

  constructor() {
    this.refreshAdapters();
  }

  refreshAdapters() {
    this.adapters.clear(); // Safe to clear and rebuild
    
    models.forEach(model => {
        if (this.adapters.has(model.id)) return;

        try {
            const adapter = this.createAdapterFor(model);
            if (adapter) {
                this.registerAdapter(adapter);
            }
        } catch (e) {
            console.error(`Failed to initialize adapter for ${model.id}`, e);
        }
    });

    // Title models are loaded efficiently on-demand by generateTitle().
  }

  registerAdapter(adapter: ModelAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  private createAdapterFor(model: Model): ModelAdapter | null {
      const providerModule = (aiProviders as Record<string, any>)[model.provider];

      if (providerModule && typeof providerModule.createConnection === 'function') {
           try {
               console.log(`[Router] Initializing ${model.provider} connection for ${model.id}...`);
               const connection = providerModule.createConnection(model.id);
               return new Gateway(model.id, connection);
           } catch (e) {
               console.error(`Factory failed for ${model.provider}`, e);
           }
      }

      console.warn(`[Router] No provider found for ${model.provider}`);
      return null;
  }
  
  /* 
   * Dynamically ensures a specific model is ready. 
   * Crucial for Title Generation which uses models strictly defined by the Provider.
   */
  private ensureModelAvailable(targetModelId: string, providerId: string) {
     if (!this.adapters.has(targetModelId)) {
        const mockModel: any = { 
             id: targetModelId, 
             provider: providerId, 
             tier: 'other' // System tier
        };
        try {
             const adapter = this.createAdapterFor(mockModel);
             if (adapter) this.registerAdapter(adapter);
        } catch(e) { console.error(`Failed to init system model ${targetModelId}`, e); }
     }
  }

  async *streamChat(modelId: string, messages: MessageNode[], userId?: string): AsyncGenerator<StreamChunk, void, unknown> {
    console.log("Router: streaming chat for model:", modelId);
    
    if (!this.adapters.has(modelId)) this.refreshAdapters();

    const adapter = this.adapters.get(modelId);
    
    if (!adapter) {
       yield { type: "text", content: `Configuration Error: Model '${modelId}'. Adapter not initialized or provider disabled.` };
       return;
    }

    // --- Rate Limiting (Free Tier) ---
    const modelDef = models.find(m => m.id === modelId);
    if (modelDef && modelDef.usageTier === 'free') {
        const uid = userId || "anonymous_ip"; 
        const { allowed, reason } = RateLimiter.checkLimit(uid, modelId, 'free');
        
        if (!allowed) {
            yield { type: "text", content: `🚫 **Rate Limit Exceeded**\n\n${reason}\n\n*Please upgrade to a paid tier or wait for the cooldown.*` };
            return;
        }
    }
    // ---------------------------------
    
    yield* adapter.streamChat(messages, userId);
  }

  async generateTitle(modelId: string, messages: MessageNode[]): Promise<string> {
    // 1. Identify the Provider of the current model
    const currentModelDef = models.find(m => m.id === modelId);
    if (!currentModelDef) { 
        console.warn(`[Router] Cannot generate title: Unknown model ${modelId}`);
        return "New Chat";
    }

    // 2. Determine the Title Model for this Provider
    let titleModelId = 'gpt-4o-mini'; // Default Fallback
    let titleProviderId = 'openai';

    // Check Unified Registry First
    const providerDef = (aiProviders as Record<string, any>)[currentModelDef.provider];

    if (providerDef && providerDef.titleModelId) {
        titleModelId = providerDef.titleModelId;
        titleProviderId = currentModelDef.provider;
    }

    // 3. Ensure the Title Model is initialized
    let adapter = this.adapters.get(titleModelId);
    if (!adapter) {
        this.ensureModelAvailable(titleModelId, titleProviderId);
        adapter = this.adapters.get(titleModelId);
    }

    if (!adapter) {
        console.warn(`[Router] Title model '${titleModelId}' not available. Returning default.`);
        return "New Chat";
    }

    // 4. Generate
    try {
        const titlePrompt = `
Generate a concise, 3-5 word title for this conversation history. 
Do not wrap in quotes. Do not say "Title:". Just the title.
History:
${messages.slice(1).map(m => `${m.role}: ${m.content}`).join('\n').substring(0, 1000)}
`;
        const titleMessages: MessageNode[] = [
            { id: 'sys', role: 'system', content: 'You are a helpful assistant.', parentId: null, childrenIds: [], activeChildId: null, createdAt: 0 },
            { id: 'usr', role: 'user', content: titlePrompt, parentId: null, childrenIds: [], activeChildId: null, createdAt: 0 }
        ];

        let title = "";
        for await (const chunk of adapter.streamChat(titleMessages)) {
            if (chunk.type === 'text') {
                title += chunk.content;
            }
        }
        return title.trim() || "New Chat";
    } catch (e) {
        console.error("Title generation failed", e);
        return "New Chat";
    }
  }
}

export const modelRouter = new UnifiedRouter();
