/* eslint-disable @typescript-eslint/no-explicit-any */
import { HfInference } from "@huggingface/inference";
import { ModelConnection } from "../../types";

export class HuggingFaceAdapter implements ModelConnection {
    private client: HfInference;

    constructor(
        public id: string,
        config: { apiKey: string }
    ) {
        console.log(`[HuggingFaceAdapter] Initializing with Key: ${config.apiKey ? (config.apiKey.substring(0, 4) + '...') : 'MISSING'}`);
        this.client = new HfInference(config.apiKey);
    }

    async createStream(messages: any[], tools?: any[]): Promise<any> {
         const params: any = {
             model: this.id,
             messages: messages,
             max_tokens: 2048, 
             stream: true,
         };

         if (tools && tools.length > 0) {
             console.warn(`[HuggingFaceAdapter] Tools passed but HF implementation is basic. Model might not invoke them.`);
         }

         try {
             return this.client.chatCompletionStream(params);
         } catch (e: any) {
             console.error(`[HuggingFaceAdapter] SDK Error:`, e);
             throw new Error(`HF SDK Error: ${e.message}`);
         }
    }

    async *processStream(stream: any): AsyncGenerator<any> {
        for await (const chunk of stream) {
            if (chunk.choices && chunk.choices.length > 0 && chunk.choices[0]?.delta?.content) {
                 yield { type: "text", content: chunk.choices[0].delta.content };
            }
        }
    }
}
