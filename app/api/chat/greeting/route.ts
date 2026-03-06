import { NextResponse } from "next/server";

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

        return NextResponse.json({ greeting: roughGreeting || "Ready to ship?" });
    } catch (e: unknown) {
        console.error("[GreetingAPI] Critical Error:", e);
        // Even in a critical error, we try to return something a bit more active
        return NextResponse.json({ greeting: "Ready to ship?" }); 
    }
}
