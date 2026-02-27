import * as React from "react";
import { ChatInput } from "@/components/chat/input/chat-input";

interface ChatWelcomeProps {
    onSend: (content: string, attachments: import("@/lib/store/chat-store").Attachment[]) => void;
}

export function ChatWelcome({ onSend }: ChatWelcomeProps) {
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto px-4 pt-20 md:justify-center">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-semibold mb-8 text-neutral-900 dark:text-neutral-100">
                Ready when you are.
            </h1>
        </div>

        {/* Centered Chat Input (Bottom on mobile) */}
        <div className="w-full max-w-[48rem] mb-4">
            <ChatInput 
                onSend={onSend} 
                className="p-0 bg-transparent" 
                showFooterDisclaimer={true} 
            />
        </div>
    </div>
  );
}
