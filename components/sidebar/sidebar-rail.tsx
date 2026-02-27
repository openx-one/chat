import * as React from "react";
import { 
    Settings, 
    Sparkles, 
    MessageSquare, 
    LayoutGrid, 
    Box, 
    BrainCog, 
    Images, 
    Cable, 
    MessageCircle,
    LogOut,
    LifeBuoy,
    Zap,
    ScrollText,
    ShieldCheck,
    Bug,
    Keyboard,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface SidebarRailProps {
  onToggle: () => void;
  onOpenSettings: () => void;
}

export function SidebarRail({ onToggle, onOpenSettings }: SidebarRailProps) {
  const router = useRouter(); 
  const pathname = usePathname();
  const { user: currentUser } = useAuth();
  const supabase = createClient();
  
  const railItems = [
      { 
          icon: MessageCircle, 
          label: "Chats", 
          active: pathname === '/' || (pathname?.startsWith('/c/') && !pathname?.startsWith('/library') && !pathname?.startsWith('/models')),
          onClick: onToggle 
      },
      { 
          icon: Images, 
          label: "Library", 
          active: pathname === '/library',
          onClick: () => router.push('/library')
      },
      {
          icon: Cable, 
          label: "Connectors",
          active: false,
          onClick: () => {
             import("@/lib/store/chat-store").then(({ chatStore }) => {
                 chatStore.setIsActiveIntegrationOpen(true);
             });
          }
      }
  ];

  const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/login');
  };

  return (
      <div className="w-[60px] flex flex-col items-center py-4 gap-4 border-r border-white/5 bg-[#0e0e0e]">
         {/* Logo */}
         <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-900/20 mb-2">
             <Sparkles className="text-white h-4 w-4" />
         </div>

         {/* Rail Items */}
         <div className="flex flex-col gap-3 w-full px-2">
             {railItems.map((item) => (
                 <TooltipProvider key={item.label}>
                 <Tooltip>
                     <TooltipTrigger asChild>
                         <button 
                             onClick={() => {
                                 if (item.label === "Chats" && !pathname.startsWith('/c/') && pathname !== '/') {
                                     router.push('/');
                                 } else {
                                     item.onClick();
                                 }
                             }}
                             className={cn(
                             "h-10 w-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-300 group relative mx-auto",
                             item.active 
                                ? "bg-white/10 text-white shadow-inner" 
                                : "text-neutral-500 hover:text-white hover:bg-white/5"
                         )}>
                             <item.icon className={cn("h-4 w-4", item.label === "Models" && "text-purple-400")} />
                             {item.active && <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-500 rounded-r-full" />}
                         </button>
                     </TooltipTrigger>
                     <TooltipContent side="right">{item.label}</TooltipContent>
                 </Tooltip>
                 </TooltipProvider>
             ))}
         </div>

         <div className="flex-1" />

         {/* Bottom Actions */}
         <div className="flex flex-col gap-3 pb-4">
             <button onClick={onOpenSettings} className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors mx-auto">
                 <Settings className="h-4 w-4" />
             </button>
             
             {/* Profile Avatar Dropdown */}
             <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                    <button 
                        type="button" 
                        className="h-9 w-9 rounded-full flex items-center justify-center cursor-pointer mx-auto shadow-lg hover:ring-2 hover:ring-white/20 transition-all outline-none overflow-hidden"
                    >
                        {currentUser ? (
                            <div className="h-full w-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                                {currentUser.email?.charAt(0).toUpperCase()}
                            </div>
                        ) : (
                            <div className="h-full w-full bg-neutral-800 flex items-center justify-center text-neutral-500 text-xs">?</div>
                        )}
                    </button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent 
                    side="top" 
                    align="start" 
                    sideOffset={9}
                    className="w-56 bg-[#161616] border-white/5 text-neutral-200 z-[101] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-1.5"
                 >
                     <DropdownMenuLabel className="font-normal">
                         <div className="flex flex-col space-y-1">
                             <p className="text-sm font-medium leading-none text-white">{currentUser?.email?.split('@')[0]}</p>
                             <p className="text-xs leading-none text-neutral-500">{currentUser?.email}</p>
                         </div>
                     </DropdownMenuLabel>
                     
                     <DropdownMenuSeparator className="bg-white/5" />
                     
                     {/* Usage Limit Display */}
                     <div className="px-2 py-2 mb-1">
                         <div className="flex items-center justify-between text-[11px] mb-1.5 px-0.5">
                             <span className="text-neutral-400">Usage limit</span>
                             <span className="text-indigo-400 font-medium">45%</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[45%]" />
                         </div>
                     </div>

                     <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer group">
                         <Zap className="mr-2 h-4 w-4 text-amber-400" />
                         <span>Upgrade Plan</span>
                     </DropdownMenuItem>
                     
                     <DropdownMenuSeparator className="bg-white/5" />
                     
                     {/* Help Sub-menu */}
                     <DropdownMenuSub>
                         <DropdownMenuSubTrigger className="focus:bg-white/5 focus:text-white cursor-pointer">
                             <LifeBuoy className="mr-2 h-4 w-4" />
                             <span>Help</span>
                         </DropdownMenuSubTrigger>
                         <DropdownMenuPortal>
                             <DropdownMenuSubContent 
                                 className="bg-[#161616] border-white/5 text-neutral-200 min-w-[190px] z-[101] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-1.5"
                                 sideOffset={8}
                                 alignOffset={-144}
                             >
                                 <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                                     <ExternalLink className="mr-2 h-4 w-4 text-neutral-400" />
                                     <span>Help Center</span>
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                                     <ScrollText className="mr-2 h-4 w-4 text-neutral-400" />
                                     <span>Release Notes</span>
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                                     <ShieldCheck className="mr-2 h-4 w-4 text-neutral-400" />
                                     <span>Terms & Policies</span>
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator className="bg-white/5" />
                                 <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer text-red-400 focus:text-red-300">
                                     <Bug className="mr-2 h-4 w-4" />
                                     <span>Report Bugs</span>
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                                     <Keyboard className="mr-2 h-4 w-4 text-neutral-400" />
                                     <div className="flex items-center justify-between w-full">
                                         <span>Shortcuts</span>
                                         <span className="text-[10px] bg-white/10 px-1 rounded ml-2">?</span>
                                     </div>
                                 </DropdownMenuItem>
                             </DropdownMenuSubContent>
                         </DropdownMenuPortal>
                     </DropdownMenuSub>

                     <DropdownMenuSeparator className="bg-white/5" />
                     
                     <DropdownMenuItem 
                        onClick={handleLogout}
                        className="focus:bg-red-500/10 focus:text-red-400 text-red-400 cursor-pointer"
                     >
                         <LogOut className="mr-2 h-4 w-4" />
                         <span>Log out</span>
                     </DropdownMenuItem>
                 </DropdownMenuContent>
             </DropdownMenu>
         </div>
      </div>
  );
}
