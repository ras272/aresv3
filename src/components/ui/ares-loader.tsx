"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AresLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AresLoader({ className, size = "md" }: AresLoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <img 
        src="/isologo-ares.png" 
        alt="Cargando..." 
        className={cn(
          "animate-spin object-contain",
          sizeClasses[size]
        )}
        style={{
          animationDuration: "2s"
        }}
      />
    </div>
  );
}