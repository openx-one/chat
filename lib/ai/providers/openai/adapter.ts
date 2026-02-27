/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModelConnection } from "../../types";

export class OpenAIAdapter implements ModelConnection {
    private baseURL: string;
    private apiKey: string;

    constructor(
        public id: string,
        config: { baseURL?: string; apiKey: string }
    ) {
        this.baseURL = config.baseURL || "https://api.openai.com/v1";
        this.apiKey = config.apiKey;
    }

    async createStream(messages: any[], tools?: any[]): Promise<any> {
        const params: any = {
            model: this.id,
            messages: messages,
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
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`API Error ${response.status}: ${err}`);
            }

            return response.body; // Web stream
        } catch (error: any) {
            console.error(`[OpenAIAdapter:${this.id}] API Error:`, error);
            throw new Error(`Connection failed: ${error.message || 'Unknown network error'}`);
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
                            const delta = chunk.choices?.[0]?.delta;
                            if (!delta) continue;

                            if (delta.content) {
                                if (typeof delta.content === 'string') {
                                    yield { type: "text", content: delta.content };
                                } else if (Array.isArray(delta.content)) {
                                    for (const block of delta.content) {
                                        if (block.type === 'text' && block.text) {
                                            yield { type: "text", content: block.text };
                                        }
                                    }
                                }
                            }
                            
                            if (delta.tool_calls) {
                                const tc = delta.tool_calls[0];
                                yield { 
                                    type: "tool_call_chunk", 
                                    tool_call: {
                                        id: tc.id,
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
