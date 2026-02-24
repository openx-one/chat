"use client";

import React from "react";
import Loading from "./framer-loading";

export function ThinkingAnimation() {
  return (
    <div className="flex items-center">
       <div className="w-8 h-8 flex items-center justify-center">
          <Loading />
       </div>
    </div>
  );
}
