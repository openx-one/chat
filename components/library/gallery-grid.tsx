"use client";

import * as React from "react";
import { MediaTile } from "./media-tile";
import { Loader2, ImageIcon } from "lucide-react";
import { imageStore } from "@/lib/store/image-store";
import { observer } from "mobx-react-lite";

export const GalleryGrid = observer(() => {
  const { history, isLoadingHistory, viewMode } = imageStore;

  React.useEffect(() => {   
      if (viewMode === 'gallery') {
          imageStore.loadHistory();
      }
  }, [viewMode]);

  if (isLoadingHistory && history.length === 0) {
      return (
          <div className="flex h-64 items-center justify-center text-white/50">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      );
  }

  if (history.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-96 text-neutral-500 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <ImageIcon className="h-12 w-12 mb-4 opacity-10" />
              <p className="text-lg font-medium">No masterpieces yet</p>
              <p className="text-sm opacity-60">Your generated images will appear here</p>
          </div>
      );
  }

  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
        {history.map((item) => (
            <MediaTile 
                key={item.id}
                src={item.url}
                alt={item.prompt}
                timestamp={new Date(item.created_at).getTime()}
            />
        ))}
    </div>
  );
});
