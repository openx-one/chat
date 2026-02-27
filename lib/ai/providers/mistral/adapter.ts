/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModelConnection } from "../../types";

export class MistralAdapter implements ModelConnection {
    private apiKey: string;
    private baseURL = "https://api.mistral.ai/v1";

    constructor(
        public id: string,
        apiKey: string
    ) {
        this.apiKey = apiKey;
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
                     tool_calls: toolCallsMapped?.length ? toolCallsMapped : undefined
                 };
             }
             
             if (role === 'tool') {
                 return {
                     role: "tool",
                     content: content || "",
                     tool_call_id: m.tool_call_id || m.toolCallId
                 };
             }

             return m;
         });

         // Final filter to ensure no empty messages reach the SDK
         const validMessages = processedMessages.filter(m => {
             if (m.role === 'assistant') {
                 return (!!m.content && m.content.length > 0) || (!!m.tool_calls && m.tool_calls.length > 0);
             }
             if (m.role === 'tool') return !!m.content && !!m.tool_call_id;
             return !!m.content;
         });

         console.log(`[MistralAdapter:${this.id}] Payload for Mistral:`);
         validMessages.forEach((m, i) => {
            console.log(`  [${i}] role=${m.role} hasContent=${!!m.content} hasTC=${!!m.tool_calls?.length} TC_ID=${m.tool_call_id || ''}`);
         });

         const params: any = {
             model: this.id,
             messages: validMessages,
             stream: true, 
         };

         if (tools && tools.length > 0) {
             params.tools = tools;
             params.tool_choice = "auto"; 
         }

         try {
             const response = await fetch(`${this.baseURL}/chat/completions`, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${this.apiKey}`,
                     'Accept': 'text/event-stream'
                 },
                 body: JSON.stringify(params)
             });

             if (!response.ok) {
                 const err = await response.text();
                 throw new Error(`API Error ${response.status}: ${err}`);
             }

             return response.body;
         } catch (e: any) {
             console.error(`[MistralAdapter] Fetch Error!`, e);
             throw new Error(`Mistral API Error: ${e.message}`);
         }
    }

    async *processStream(stream: any): AsyncGenerator<any> {
        if (!stream) return;
        
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data.trim() === '[DONE]') continue;
                        
                        try {
                            const chunk = JSON.parse(data);
                            const choice = chunk.choices?.[0];
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

                            // Detect tool calls
                            const toolCalls = delta.tool_calls || delta.toolCalls;
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
                        } catch (e) {
                            // ignore unparseable chunks
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }
}
