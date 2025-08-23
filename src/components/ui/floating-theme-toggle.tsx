'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Palette, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingThemeToggleProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  expandable?: boolean;
}

export function FloatingThemeToggle({ 
  className, 
  position = 'bottom-right',
  expandable = true
}: FloatingThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const isDarkMode = theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark');
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };
  
  const handleToggle = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (expandable) {
      setIsExpanded(false);
    }
  };
  
  if (!mounted) {
    return null;
  }
  
  const mainButtonVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0
    },
    hover: { 
      scale: 1.1
    },
    tap: { scale: 0.95 }
  };
  
  const expandedVariants = {
    initial: { opacity: 0, scale: 0, y: 20 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0
    },
    exit: { 
      opacity: 0, 
      scale: 0, 
      y: 20
    }
  };
  
  return (
    <div className={cn(
      'fixed z-50 flex flex-col-reverse items-center gap-3',
      positionClasses[position],
      className
    )}>
      {/* Opciones expandidas */}
      {expandable && (
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              className="flex flex-col gap-2"
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Modo Claro */}
              <motion.button
                variants={expandedVariants}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
                onClick={() => handleToggle('light')}
                className={cn(
                  'flex items-center justify-center size-12 rounded-full shadow-lg',
                  'bg-background border border-border backdrop-blur-sm',
                  'hover:scale-110 hover:shadow-xl active:scale-95',
                  'transition-all duration-300 ease-out',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  theme === 'light' && 'ring-2 ring-primary'
                )}
                aria-label="Modo claro"
              >
                <Sun className="size-5 text-yellow-500" />
              </motion.button>
              
              {/* Modo Oscuro */}
              <motion.button
                variants={expandedVariants}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
                onClick={() => handleToggle('dark')}
                className={cn(
                  'flex items-center justify-center size-12 rounded-full shadow-lg',
                  'bg-background border border-border backdrop-blur-sm',
                  'hover:scale-110 hover:shadow-xl active:scale-95',
                  'transition-all duration-300 ease-out',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  theme === 'dark' && 'ring-2 ring-primary'
                )}
                aria-label="Modo oscuro"
              >
                <Moon className="size-5 text-blue-400" />
              </motion.button>
              
              {/* Modo Sistema */}
              <motion.button
                variants={expandedVariants}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
                onClick={() => handleToggle('system')}
                className={cn(
                  'flex items-center justify-center size-12 rounded-full shadow-lg',
                  'bg-background border border-border backdrop-blur-sm',
                  'hover:scale-110 hover:shadow-xl active:scale-95',
                  'transition-all duration-300 ease-out',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  theme === 'system' && 'ring-2 ring-primary'
                )}
                aria-label="Modo sistema"
              >
                <Settings className="size-5 text-muted-foreground" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      
      {/* Botón principal */}
      <motion.button
        variants={mainButtonVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        onClick={() => {
          if (expandable) {
            setIsExpanded(!isExpanded);
          } else {
            handleToggle(isDarkMode ? 'light' : 'dark');
          }
        }}
        className={cn(
          'relative flex items-center justify-center size-14 rounded-full shadow-xl',
          'bg-primary text-primary-foreground backdrop-blur-sm',
          'border-2 border-primary/20',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'overflow-hidden'
        )}
        aria-label={expandable ? 'Abrir opciones de tema' : `Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
      >
        {/* Fondo animado */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/60"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Icono */}
        <div className="relative z-10">
          {expandable ? (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <Palette className="size-6" />
            </motion.div>
          ) : (
            <div className="relative">
              <motion.div
                animate={{ 
                  opacity: isDarkMode ? 0 : 1,
                  rotate: isDarkMode ? 180 : 0,
                  scale: isDarkMode ? 0 : 1
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Sun className="size-6" />
              </motion.div>
              <motion.div
                animate={{ 
                  opacity: isDarkMode ? 1 : 0,
                  rotate: isDarkMode ? 0 : -180,
                  scale: isDarkMode ? 1 : 0
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Moon className="size-6" />
              </motion.div>
            </div>
          )}
        </div>
        
        {/* Efecto de pulso para tema activo */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary-foreground/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.button>
      
      {/* Indicador del tema actual */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-16 left-1/2 transform -translate-x-1/2"
          >
            <div className="bg-popover border rounded-lg px-3 py-1 text-xs font-medium shadow-lg">
              Tema: {theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Oscuro' : 'Claro'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}