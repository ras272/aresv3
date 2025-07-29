"use client";

import React from "react";
import { AresLoader } from "./ares-loader";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ 
  message = "Cargando...", 
  className,
  fullScreen = false 
}: LoadingScreenProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
    : "w-full h-full";

  return (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-4",
      containerClasses,
      className
    )}>
      <AresLoader size="lg" />
      <div className="text-center">
        <p className="text-lg font-medium text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground mt-1">ARES Paraguay</p>
      </div>
    </div>
  );
}