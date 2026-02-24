/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import Image from "next/image";
import { Download, Maximize2 } from "lucide-react";
import { imageStore } from "@/lib/store/image-store";

interface MediaTileProps {
  src: string;
  alt: string;
  timestamp: number;
}

export function MediaTile({ src, alt, timestamp }: MediaTileProps) {
  
  const handleDownload = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
          const response = await fetch(src);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `zod-image-${timestamp}.png`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
      } catch (e) {
          console.error("Download failed", e);
          window.open(src, '_blank');
      }
  };

  return (
    <div 
        className="group relative break-inside-avoid mb-4 rounded-xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-white/20 transition-all cursor-pointer"
        onClick={() => imageStore.setLightboxImage(src)}
    >
        {/* Image */}
        <div className="aspect-auto w-full relative">
            <img 
                src={src} 
                alt={alt}
                loading="lazy"
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
            />
        </div>

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
            <div className="flex items-center gap-2 justify-end">
                 <button 
                    onClick={(e) => { e.stopPropagation(); imageStore.setLightboxImage(src); }}
                    className="h-8 w-8 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all"
                >
                    <Maximize2 className="h-4 w-4" />
                </button>
                <button 
                    onClick={handleDownload} 
                    className="h-8 w-8 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all"
                >
                     <Download className="h-4 w-4" />
                </button>
            </div>
        </div>
    </div>
  );
}
