import * as React from "react";
import { ChatInput } from "@/components/chat/input/chat-input";
import { motion, AnimatePresence } from "framer-motion";

interface ChatWelcomeProps {
    onSend: (content: string, attachments: import("@/lib/store/chat-store").Attachment[]) => void;
}

export function ChatWelcome({ onSend }: ChatWelcomeProps) {
  const [greeting, setGreeting] = React.useState("Ready when you are.");

  React.useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const res = await fetch("/api/chat/greeting");
        if (res.ok) {
          const data = await res.json();
          setGreeting(data.greeting);
        }
      } catch (e) {
        console.error("Failed to fetch greeting", e);
      }
    };
    fetchGreeting();
  }, []);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto px-4 pt-20 md:justify-center">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
            <AnimatePresence mode="wait">
                <motion.h1 
                    key={greeting}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="text-4xl font-semibold mb-8 text-neutral-900 dark:text-neutral-100"
                >
                    {greeting}
                </motion.h1>
            </AnimatePresence>
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
