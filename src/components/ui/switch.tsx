import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function Switch({ 
  checked, 
  onCheckedChange, 
  disabled = false, 
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}: SwitchProps) {
  return (
    <label className={cn(
      "relative inline-flex items-center cursor-pointer group",
      disabled && "cursor-not-allowed opacity-50",
      className
    )}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className="sr-only"
      />
      
      {/* Track del switch con animaciones mejoradas */}
      <div className={cn(
        "relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out",
        "focus-within:ring-4 focus-within:ring-opacity-20",
        "group-hover:shadow-lg transform group-active:scale-95",
        checked 
          ? "bg-gradient-to-r from-blue-500 to-blue-600 focus-within:ring-blue-400 shadow-blue-200 shadow-lg" 
          : "bg-gradient-to-r from-gray-200 to-gray-300 focus-within:ring-gray-400 shadow-gray-200 shadow-md",
        disabled && "group-hover:shadow-none group-active:scale-100"
      )}>
        
        {/* Efecto de brillo en el track */}
        <div className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-500",
          "bg-gradient-to-r from-transparent via-white/30 to-transparent",
          checked ? "opacity-20" : "opacity-0"
        )} />
        
        {/* Botón deslizante con animaciones mejoradas */}
        <div className={cn(
          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg",
          "transition-all duration-300 ease-in-out transform",
          "flex items-center justify-center",
          "group-hover:shadow-xl group-hover:scale-110",
          "group-active:scale-95",
          checked 
            ? "translate-x-5 rotate-180" 
            : "translate-x-0.5 rotate-0",
          disabled && "group-hover:shadow-lg group-hover:scale-100 group-active:scale-100"
        )}>
          
          {/* Indicador visual dentro del botón */}
          <div className={cn(
            "w-2 h-2 rounded-full transition-all duration-300 ease-in-out",
            checked 
              ? "bg-blue-500 shadow-sm scale-100" 
              : "bg-gray-400 scale-75"
          )} />
        </div>
        
        {/* Efecto de onda al hacer clic */}
        <div className={cn(
          "absolute inset-0 rounded-full transition-all duration-700 ease-out",
          "bg-current opacity-0 group-active:opacity-10 group-active:scale-150"
        )} />
      </div>
    </label>
  );
}