import * as React from "react";
import { ImageGeneratorView } from "@/components/library/image-generator-view";

export default function LibraryPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 h-screen overflow-hidden bg-black">
      <ImageGeneratorView />
    </div>
  );
}
