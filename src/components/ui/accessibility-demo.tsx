'use client';

import * as React from 'react';
import { Card } from './card';
import { ThemeToggle } from './theme-toggle';

export function AccessibilityDemo() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Theme Toggle Accessibility Features</h2>
      
      <div className="grid gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">ARIA Support & Screen Reader Compatibility</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Switch Variant with Full ARIA Support</h4>
              <ThemeToggle variant="switch" showLabel showSystemOption />
              <div className="mt-2 text-sm text-muted-foreground">
                <ul className="space-y-1">
                  <li>• <code>role="group"</code> groups related controls</li>
                  <li>• <code>aria-labelledby</code> provides group description</li>
                  <li>• <code>aria-describedby</code> links to usage instructions</li>
                  <li>• <code>aria-live="polite"</code> announces state changes</li>
                </ul>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Button Variants with Enhanced Labels</h4>
              <div className="flex gap-3 flex-wrap">
                <ThemeToggle variant="cycle" showLabel />
                <ThemeToggle variant="button" showLabel />
                <ThemeToggle variant="compact" showLabel />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <ul className="space-y-1">
                  <li>• Dynamic <code>aria-label</code> updates with current state</li>
                  <li>• <code>title</code> attributes provide hover tooltips</li>
                  <li>• Hidden instructions for keyboard usage</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Keyboard Navigation & Focus Management</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Enhanced Focus Indicators</h4>
              <div className="flex gap-3 flex-wrap">
                <ThemeToggle variant="switch" />
                <ThemeToggle variant="cycle" />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Try using <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd> to focus and <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> or <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> to activate</p>
              </div>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-md">
              <h4 className="font-medium mb-2">Keyboard Shortcuts</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <kbd className="px-2 py-1 bg-background border rounded">Tab</kbd>
                  <span className="ml-2">Navigate to toggle</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-background border rounded">Enter</kbd>
                  <span className="ml-2">Activate theme change</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-background border rounded">Space</kbd>
                  <span className="ml-2">Activate theme change</span>
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-background border rounded">Shift+Tab</kbd>
                  <span className="ml-2">Navigate backwards</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">WCAG 2.1 Compliance</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 text-green-600">Level A Compliance ✅</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Non-text content has alternatives</li>
                  <li>• Proper semantic structure</li>
                  <li>• Full keyboard accessibility</li>
                  <li>• No keyboard traps</li>
                  <li>• Accessible names and roles</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-green-600">Level AA Compliance ✅</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 4.5:1+ contrast ratios</li>
                  <li>• Enhanced focus indicators</li>
                  <li>• Predictable interactions</li>
                  <li>• Status message announcements</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-800">
              <h4 className="font-medium mb-2 text-green-700 dark:text-green-300">Accessibility Testing</h4>
              <p className="text-sm text-green-600 dark:text-green-400">
                All theme toggle variants have been tested with screen readers (NVDA, JAWS, VoiceOver) 
                and meet or exceed WCAG 2.1 AA accessibility standards.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Screen Reader Announcements</h3>
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium mb-2 text-blue-700 dark:text-blue-300">What Screen Readers Announce</h4>
              <div className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <p><strong>On Focus:</strong> "Switch to dark mode. Currently using Light theme. Toggle between light and dark appearance modes."</p>
                <p><strong>On Activation:</strong> "Dark Mode" (with aria-live announcement)</p>
                <p><strong>System Button:</strong> "Use system theme preference. Currently inactive. Automatically matches your device's setting."</p>
              </div>
            </div>
            
            <ThemeToggle variant="switch" showLabel showSystemOption />
            <p className="text-sm text-muted-foreground">
              Try using a screen reader to experience the full accessibility features
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}