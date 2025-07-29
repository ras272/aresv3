'use client';

import React, { useState, createContext, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './button';

// Context for dialog state
const DialogContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogHeaderProps {
  children: React.ReactNode;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ children, open: controlledOpen, onOpenChange }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  
  // Determine if we're in controlled or uncontrolled mode
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  
  // Create a setOpen function that respects the controlled/uncontrolled mode
  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      // In controlled mode, call the onOpenChange callback
      onOpenChange?.(newOpen);
    } else {
      // In uncontrolled mode, update our internal state
      setUncontrolledOpen(newOpen);
    }
  };

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ asChild, children }: DialogTriggerProps) {
  const context = useContext(DialogContext);
  if (!context) throw new Error('DialogTrigger must be used within Dialog');

  const { setOpen } = context;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...children.props,
      onClick: (e: React.MouseEvent) => {
        children.props.onClick?.(e);
        setOpen(true);
      }
    });
  }

  return (
    <button onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

export function DialogContent({ className = '', children }: DialogContentProps) {
  const context = useContext(DialogContext);
  if (!context) throw new Error('DialogContent must be used within Dialog');

  const { open, setOpen } = context;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`bg-white rounded-lg shadow-xl w-full ${className.includes('max-w-') ? '' : 'max-w-md'} max-h-[90vh] overflow-y-auto relative ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute right-4 top-4 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-gray-200">
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return (
    <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  );
}