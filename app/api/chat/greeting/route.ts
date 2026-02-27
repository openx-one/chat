import { NextResponse } from "next/server";
import { modelRouter } from "@/lib/ai/router";
import { MessageNode } from "@/lib/store/chat-store";

// 1. DATA LAYERS
const SALUTATIONS = ["Hey", "Welcome back", "Look who's here", "Ah, it's you", "Back again?", "Good to see you", "The legend returns", "Welcome to the lab"];
const HOOKS = ["builder", "MT5 strategist", "late-night thinker", "code wizard", "infrastructure expert", "innovator"];
const OBSERVATIONS = {
    morning: ["Fresh start?", "Early bird shift."],
    afternoon: ["Mid-day momentum.", "Pushing through?"],
    evening: ["Winding down?", "Evening grind."],
    night: ["Still building?", "Sleep is optional?", "Late-night pass?"],
    generic: ["Ready to ship?", "Another idea brewing?", "Back to breaking architectures?"]
};
const TRIGGERS = ["Let's push the limits.", "What are we inventing today?", "Let's build something dangerous.", "Ready to optimize?", "The lab is open."];

function getRandom(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export async function GET() {
    try {
        const now = new Date();
        const hour = now.getHours();
        
        // A. CONTEXT EXTRACTION
        let timeKey: keyof typeof OBSERVATIONS = "morning";
        if (hour >= 12 && hour < 17) timeKey = "afternoon";
        else if (hour >= 17 && hour < 21) timeKey = "evening";
        else if (hour >= 21 || hour < 5) timeKey = "night";

        const isLateNight = hour >= 23 || hour < 4;
        
        // B. STRUCTURED COMPOSITION
        const salutation = getRandom(SALUTATIONS);
        const hook = getRandom(HOOKS);
        const observation = getRandom(isLateNight ? OBSERVATIONS.night : OBSERVATIONS[timeKey]);
        const trigger = getRandom(TRIGGERS);

        // Weighted Mix (Variation)
        const coin = Math.random();
        let roughGreeting = "";
        
        if (coin < 0.3) roughGreeting = `${salutation}. ${observation}`;
        else if (coin < 0.6) roughGreeting = `${hook}. ${trigger}`;
        else if (coin < 0.9) roughGreeting = `${salutation}, ${hook}. ${observation}`;
        else roughGreeting = `${observation} ${trigger}`;

        // C. THE POLISH PASS (LLM)
        // We prioritize Mistral-Small as it's free/cheap and handles short rewrites well.
        const modelId = "mistral-small-latest";
        
        const polishPrompt = `
Act as a professional creative writer. 
Rewrite this rough greeting into a premium, natural, and "alive" chat welcome.
Rough Greeting: "${roughGreeting}"
Requirements:
- Length: 3-5 words maximum.
- Format: Plain text only, no quotes, no extra symbols.
- Final output only.
`;

        const messages: MessageNode[] = [
            { id: 'sys', role: 'system', content: 'You are a professional writer.', parentId: null, childrenIds: [], activeChildId: null, createdAt: Date.now() },
            { id: 'usr', role: 'user', content: polishPrompt, parentId: null, childrenIds: [], activeChildId: null, createdAt: Date.now() }
        ];

        let finalGreeting = "";
        try {
            const stream = modelRouter.streamChat(modelId, messages);
            for await (const chunk of stream) {
                if (chunk.type === "text") finalGreeting += chunk.content;
            }
            finalGreeting = finalGreeting.trim().replace(/^["']|["']$/g, '');
        } catch (llmError) {
            console.error("[GreetingAPI] LLM Pass Failed, using rough composition:", llmError);
            finalGreeting = roughGreeting; // Self-healing fallback
        }

        // Final sanity check - always use roughGreeting as the "smart" fallback
        if (!finalGreeting || finalGreeting.length < 3) finalGreeting = roughGreeting;

        return NextResponse.json({ greeting: finalGreeting || "Ready to ship?" });
    } catch (e: unknown) {
        console.error("[GreetingAPI] Critical Error:", e);
        // Even in a critical error, we try to return something a bit more active
        return NextResponse.json({ greeting: "Ready to ship?" }); 
    }
}
