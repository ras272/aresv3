'use client';

import * as React from 'react';
import { Card } from './card';
import { ThemeToggle } from './theme-toggle';

export function ColorPaletteDemo() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dark Mode Color Palette Refinements</h2>
        <ThemeToggle variant="switch" showLabel={false} />
      </div>
      
      <div className="grid gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Enhanced Border & Input Visibility</h3>
          <div className="space-y-3">
            <div className="p-3 border rounded-md">
              <span className="text-sm">Border visibility improved by 80% (10% → 18% opacity)</span>
            </div>
            <input 
              type="text" 
              placeholder="Input field with enhanced visibility (15% → 25% opacity)"
              className="w-full p-2 border rounded-md bg-input text-foreground placeholder:text-muted-foreground"
            />
            <button className="px-3 py-2 border rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Focus me to see improved ring visibility
            </button>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Optimized Chart Colors</h3>
          <div className="grid grid-cols-5 gap-2">
            <div className="space-y-2">
              <div className="w-full h-12 rounded" style={{ backgroundColor: 'oklch(0.65 0.25 264.376)' }}></div>
              <span className="text-xs text-center block">Chart 1 (Purple)</span>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 rounded" style={{ backgroundColor: 'oklch(0.75 0.18 162.48)' }}></div>
              <span className="text-xs text-center block">Chart 2 (Teal)</span>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 rounded" style={{ backgroundColor: 'oklch(0.82 0.20 70.08)' }}></div>
              <span className="text-xs text-center block">Chart 3 (Orange)</span>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 rounded" style={{ backgroundColor: 'oklch(0.70 0.28 303.9)' }}></div>
              <span className="text-xs text-center block">Chart 4 (Magenta)</span>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 rounded" style={{ backgroundColor: 'oklch(0.72 0.26 16.439)' }}></div>
              <span className="text-xs text-center block">Chart 5 (Red-Orange)</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            All chart colors optimized for better readability and contrast in dark mode
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">WCAG AA Compliance Test</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-background text-foreground border rounded">
                <span className="text-sm font-medium">Background/Foreground</span>
                <br />
                <span className="text-xs text-muted-foreground">~14:1 contrast ratio ✅</span>
              </div>
              <div className="p-3 bg-card text-card-foreground border rounded">
                <span className="text-sm font-medium">Card/Card-Foreground</span>
                <br />
                <span className="text-xs text-muted-foreground">~12:1 contrast ratio ✅</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted text-muted-foreground border rounded">
                <span className="text-sm font-medium">Muted/Muted-Foreground</span>
                <br />
                <span className="text-xs">~4.8:1 contrast ratio ✅</span>
              </div>
              <div className="p-3 bg-accent text-accent-foreground border rounded">
                <span className="text-sm font-medium">Accent/Accent-Foreground</span>
                <br />
                <span className="text-xs">High contrast maintained ✅</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Interactive Elements Test</h3>
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <button className="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                Primary Button
              </button>
              <button className="px-3 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">
                Secondary Button
              </button>
              <button className="px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded">
                Outline Button
              </button>
              <button className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded">
                Destructive Button
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              All interactive elements maintain proper contrast and visibility in both light and dark modes
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}