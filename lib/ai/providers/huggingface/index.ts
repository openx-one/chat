import { AIProvider } from "../../types";
import { HuggingFaceAdapter } from "./adapter";
import { Model } from "@/lib/config/models";

export const huggingface: AIProvider = {
    id: "huggingface",
    name: "Hugging Face",
    logo: "/model-logo/huggingface.svg",
    config: {
        apiKeyEnv: "HUGGINGFACE_API_KEY"
    },
    createConnection: (modelId: string) => {
        return new HuggingFaceAdapter(modelId, { 
            apiKey: process.env.HUGGINGFACE_API_KEY || process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || "" 
        });
    },
    models: [] as Model[]
};
