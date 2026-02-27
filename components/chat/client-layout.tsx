"use client";

import * as React from "react";
import { Sidebar } from "@/components/sidebar/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import { observer } from "mobx-react-lite";
import { chatStore } from "@/lib/store/chat-store";

export const ClientChatLayout = observer(({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { user } = useAuth();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground relative">
      
      {/* Mobile Backdrop */}
      {user && chatStore.isMobileSidebarOpen && (
         <div 
             className="fixed inset-0 bg-black/60 z-[60] md:hidden backdrop-blur-sm"
             onClick={() => chatStore.setIsMobileSidebarOpen(false)}
         />
      )}

      {/* Sidebar Wrapper */}
      {user && (
        <div className={cn(
            "fixed inset-y-0 left-0 z-[70] transform transition-transform duration-300 md:relative md:translate-x-0 md:z-0 flex",
            chatStore.isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <Sidebar 
              isOpen={isSidebarOpen} 
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
            />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main className={cn(
            "flex-1 overflow-auto w-full mx-auto transition-all duration-300",
             "max-w-full" 
        )}>
          {children}
        </main>
      </div>
    </div>
  );
});
