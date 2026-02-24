/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { fetchImageGenerationHistory } from "@/lib/supabase/db-server";

export async function GET() {
    try {
        const history = await fetchImageGenerationHistory();
        return NextResponse.json({ history });
    } catch (error: any) {
        console.error("[ImageHistory Error]:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
