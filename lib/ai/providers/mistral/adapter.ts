/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mistral } from '@mistralai/mistralai';
import { ModelConnection } from "../../types";

export class MistralAdapter implements ModelConnection {
    private client: Mistral;

    constructor(
        public id: string,
        apiKey: string
    ) {
        this.client = new Mistral({ apiKey: apiKey });
    }

    async createStream(messages: any[], tools?: any[]): Promise<any> {
         // Mistral SDK v1 uses camelCase for toolCalls but snake_case for the API.
         // Most importantly, assistant messages MUST have toolCalls if the following message is a tool result.
         const processedMessages = messages.map(m => {
             const role = m.role;
             const content = m.content;
             
             // Map tool_calls to toolCalls for SDK compatibility
             const toolCalls = m.toolCalls || m.tool_calls;
             
             if (role === 'assistant') {
                 const finalContent = typeof content === 'string' ? content : "";
                 const toolCallsMapped = toolCalls?.map((tc: any) => ({
                    id: tc.id,
                    type: tc.type || "function",
                    function: {
                        name: tc.function?.name,
                        arguments: tc.function?.arguments
                    }
                 }));

                 return {
                     role: "assistant",
                     content: finalContent,
                     toolCalls: toolCallsMapped?.length ? toolCallsMapped : undefined
                 };
             }
             
             if (role === 'tool') {
                 return {
                     role: "tool",
                     content: content || "",
                     toolCallId: m.toolCallId || m.tool_call_id
                 };
             }

             return m;
         });

         // Final filter to ensure no empty messages reach the SDK
         const validMessages = processedMessages.filter(m => {
             if (m.role === 'assistant') {
                 return (!!m.content && m.content.length > 0) || (!!m.toolCalls && m.toolCalls.length > 0);
             }
             if (m.role === 'tool') return !!m.content && !!m.toolCallId;
             return !!m.content;
         });

         console.log(`[MistralAdapter:${this.id}] Payload for Mistral:`);
         validMessages.forEach((m, i) => {
            console.log(`  [${i}] role=${m.role} hasContent=${!!m.content} hasTC=${!!m.toolCalls?.length} TC_ID=${m.toolCallId || ''}`);
         });

         const params: any = {
             model: this.id,
             messages: validMessages,
             stream: true, 
         };

         if (tools && tools.length > 0) {
             params.tools = tools;
             params.toolChoice = "auto"; 
         }

         try {
             return await this.client.chat.stream(params);
         } catch (e: any) {
             console.error(`[MistralAdapter] SDK Error!`, e);
             if (e.body) console.error(`[MistralAdapter] Error Body:`, e.body);
             throw new Error(`Mistral SDK Error: ${e.message}`);
         }
    }

    async *processStream(stream: any): AsyncGenerator<any> {
        for await (const chunk of stream) {
            // console.log(`[MistralAdapter] Raw Chunk:`, JSON.stringify(chunk));
            
            const choice = chunk.data?.choices?.[0];
            if (!choice) continue;
            
            const delta = choice.delta;
            if (!delta) continue;

            if (delta.content !== undefined && delta.content !== null) {
                if (typeof delta.content === 'string') {
                    yield { type: "text", content: delta.content };
                } else if (Array.isArray(delta.content)) {
                     const text = delta.content.map((c: any) => c.type === 'text' ? c.text : '').join('');
                     if (text) yield { type: "text", content: text };
                }
            }

            // Detect tool calls (handle both camelCase and snake_case just in case)
            const toolCalls = delta.toolCalls || delta.tool_calls;
            if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
                const tc = toolCalls[0];
                yield {
                    type: "tool_call_chunk",
                    tool_call: {
                        id: tc.id,
                        index: tc.index,
                        type: tc.type || "function",
                        function: {
                            name: tc.function?.name,
                            arguments: tc.function?.arguments
                        }
                    }
                };
            }
        }
    }
}
