"use client";

import { motion } from "framer-motion";
import * as React from "react";

/**
 * A clean recreation of the Framer "Loading" component using pure framer-motion.
 * This avoids external library dependencies and is fully compatible with Turbopack.
 */
export default function Loading() {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <motion.div
                initial={{ scale: 1, opacity: 1 }}
                animate={{ 
                    scale: 0.7,
                    opacity: 1
                }}
                transition={{
                    duration: 0.6,
                    ease: [0.44, 0, 0.56, 1],
                    repeat: Infinity,
                    repeatType: "mirror"
                }}
                style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: "white",
                    borderRadius: "50%",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.4)"
                }}
            />
        </div>
    );
}

Loading.displayName = "Loading";
