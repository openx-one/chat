/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { saveImageGeneration } from "@/lib/supabase/db-server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// APIs from environment
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            prompt, 
            negativePrompt, 
            ratio, 
            quality, 
            style, 
            model, 
            mode, 
            sourceImage, 
            seed, 
            strength,
            guidance,
            steps 
        } = body;

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        let imageUrl = "";
        let revisedPrompt = "";

        // --- STABILITY AI (Ultra / SD3) ---
        if (model.startsWith("stability")) {
            if (!STABILITY_API_KEY) {
                throw new Error("Stability API Key is not configured");
            }

            const formData = new FormData();
            formData.append("prompt", `${prompt}${style && style !== 'none' ? `, style: ${style}` : ""}`);
            if (negativePrompt) formData.append("negative_prompt", negativePrompt);
            formData.append("output_format", "webp");
            
            // Mode Handling
            if (mode === 'i2i' && sourceImage) {
                // For I2I, we need to fetch the image and append it
                const imageRes = await fetch(sourceImage);
                const blob = await imageRes.blob();
                formData.append("image", blob);
                formData.append("strength", (strength || 0.7).toString());
                formData.append("mode", "image-to-image");
            } else {
                const aspectRatio = ratio === "16:9" ? "16:9" : ratio === "9:16" ? "9:16" : ratio === "4:3" ? "4:3" : ratio === "3:4" ? "3:4" : "1:1";
                formData.append("aspect_ratio", aspectRatio);
            }

            if (seed) formData.append("seed", seed.toString());
            if (guidance) formData.append("cfg_scale", guidance.toString());
            if (steps) formData.append("steps", steps.toString());

            console.log(`[ImageGen] Parameters:`, { ratio, quality, style, mode, seed, guidance, steps, strength });

            const response = await fetch(
                `https://api.stability.ai/v2beta/stable-image/generate/ultra`,
                {
                    method: "POST",
                    headers: { 
                        Authorization: `Bearer ${STABILITY_API_KEY}`, 
                        Accept: "image/*" 
                    },
                    body: formData,
                }
            );

            if (response.status === 200) {
                const buffer = await response.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');
                imageUrl = `data:image/webp;base64,${base64}`;
            } else {
                const error = await response.json();
                throw new Error(`Stability AI Error: ${JSON.stringify(error)}`);
            }
        } 
        
        // --- OPENAI (DALL-E 3) ---
        else if (model === "dall-e-3") {
            const size = ratio === "16:9" ? "1792x1024" : ratio === "9:16" ? "1024x1792" : "1024x1024";
            const modelQuality = quality === "hd" ? "hd" : "standard";

            const fullPrompt = `${prompt}${style && style !== 'none' ? `, style: ${style}` : ""}`;
            console.log(`[ImageGen] Generating with DALL-E 3: "${fullPrompt}"`);

            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: fullPrompt,
                n: 1,
                size: size as any,
                quality: modelQuality,
            });

            imageUrl = response.data?.[0]?.url || "";
            revisedPrompt = response.data?.[0]?.revised_prompt || "";
        }

        // --- FALLBACK / PLACEHOLDER (Flux etc via Mock or Fal.ai) ---
        else {
            // Mocking Flux for now as requested for "flexibility"
            imageUrl = "https://placehold.co/1024x1024/000000/FFFFFF/png?text=Flux+Placeholder";
        }

        // --- SAVE TO DB ---
        const savedGeneration = await saveImageGeneration({
            prompt,
            model,
            url: imageUrl,
            ratio,
            quality,
            style,
            revised_prompt: revisedPrompt
        });

        return NextResponse.json(savedGeneration);

    } catch (error: any) {
        console.error("[ImageGen Error]:", error);
        return NextResponse.json({ 
            error: error.message || "Failed to generate image" 
        }, { status: 500 });
    }
}
