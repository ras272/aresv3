'use client';

import * as React from 'react';
import { ThemeToggle } from './theme-toggle';
import { Card } from './card';

export function ThemeToggleDemo() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Theme Toggle Component Demo</h2>
      
      <div className="grid gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Switch Toggle (Default)</h3>
          <ThemeToggle />
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Switch Without Label</h3>
          <ThemeToggle showLabel={false} />
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Switch with System Option</h3>
          <ThemeToggle showSystemOption />
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Cycle Button (3 States)</h3>
          <ThemeToggle variant="cycle" />
          <p className="text-xs text-muted-foreground mt-2">
            Cycles through: Light → Dark → System
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Button Variant</h3>
          <ThemeToggle variant="button" />
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Compact Button</h3>
          <ThemeToggle variant="compact" />
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Custom Styling</h3>
          <ThemeToggle 
            className="border-primary" 
            showLabel 
          />
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Animation Showcase</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <ThemeToggle variant="cycle" showLabel />
              <span className="text-xs text-muted-foreground">Hover for shimmer effect</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle variant="switch" showLabel={false} />
              <span className="text-xs text-muted-foreground">Watch icon rotations</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8 space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Visual Design & Animation Features</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Enhanced Animations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Smooth 300ms transitions with ease-in-out timing</li>
                <li>• Icon rotations: Sun (0°→90°), Moon (0°→-90°) with scale effects</li>
                <li>• Shimmer gradient effect on hover for premium feel</li>
                <li>• Drop shadows and scale animations for depth</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Interactive States</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Hover: 5% scale increase + elevated shadows</li>
                <li>• Active: 5% scale decrease for press feedback</li>
                <li>• Focus: Accessibility rings with theme-aware colors</li>
                <li>• Color-coded icons: Yellow (light), Blue (dark), Gray (system)</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Keyboard Navigation</h3>
          <p className="text-sm text-muted-foreground mb-3">
            All theme toggles support keyboard navigation:
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Tab</kbd>
              <span>Focus the toggle</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
              <span>Activate theme change</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd>
              <span>Activate theme change</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Theme State Verification</h3>
          <p className="text-sm text-muted-foreground">
            Use the toggle switches above to test theme switching. 
            The theme should persist across page reloads and respect system preferences.
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-background border rounded"></div>
              <span className="text-sm">Background color</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-foreground rounded"></div>
              <span className="text-sm">Foreground color</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <span className="text-sm">Primary color</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}