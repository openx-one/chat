import { NextResponse } from "next/server";
import { modelRouter } from "@/lib/ai/router";
import { MessageNode } from "@/lib/store/chat-store";

export async function GET() {
    try {
        const now = new Date();
        const hour = now.getHours();
        
        let timeContext = "morning";
        if (hour >= 12 && hour < 17) timeContext = "afternoon";
        else if (hour >= 17 && hour < 21) timeContext = "evening";
        else if (hour >= 21 || hour < 5) timeContext = "night";

        const prompt = `
Generate a very short, premium, and welcoming greeting for a chat AI.
Context: It is currently ${timeContext}.
Requirements:
- Length: 3-5 words maximum.
- Tone: Professional, helpful, yet warm.
- Format: Plain text only, no quotes, no extra symbols.
- Example: "Good morning. How can I help?" or "Ready for your next project?"
`;

        const messages: MessageNode[] = [
            { id: 'sys', role: 'system', content: 'You are a helpful assistant.', parentId: null, childrenIds: [], activeChildId: null, createdAt: Date.now() },
            { id: 'usr', role: 'user', content: prompt, parentId: null, childrenIds: [], activeChildId: null, createdAt: Date.now() }
        ];

        // Use a fast model for greetings
        const modelId = "gpt-4o-mini";
        
        let greeting = "";
        const stream = modelRouter.streamChat(modelId, messages);
        
        for await (const chunk of stream) {
            if (chunk.type === "text") {
                greeting += chunk.content;
            }
        }

        return NextResponse.json({ 
            greeting: greeting.trim().replace(/^["']|["']$/g, '') || "Ready when you are." 
        });
    } catch (e: unknown) {
        console.error("[GreetingAPI] Error:", e);
        return NextResponse.json({ greeting: "Ready when you are." }); // Fallback
    }
}
