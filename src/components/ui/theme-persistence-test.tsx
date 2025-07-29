'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Card } from './card';
import { ThemeToggle } from './theme-toggle';
import { Button } from './button';

export function ThemePersistenceTest() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [testResults, setTestResults] = React.useState<{
    persistence: boolean | null;
    systemDetection: boolean | null;
    systemChangeHandling: boolean | null;
  }>({
    persistence: null,
    systemDetection: null,
    systemChangeHandling: null
  });

  // Track theme changes for testing
  const [themeHistory, setThemeHistory] = React.useState<string[]>([]);
  const [initialTheme, setInitialTheme] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
    
    // Record initial theme on mount
    if (theme && !initialTheme) {
      setInitialTheme(theme);
      setThemeHistory(prev => [...prev, `Initial: ${theme} (resolved: ${resolvedTheme})`]);
    }
  }, [theme, resolvedTheme, initialTheme]);

  // Track theme changes
  React.useEffect(() => {
    if (mounted && theme) {
      setThemeHistory(prev => [...prev, `Changed to: ${theme} (resolved: ${resolvedTheme}) at ${new Date().toLocaleTimeString()}`]);
    }
  }, [theme, resolvedTheme, mounted]);

  // Test persistence by checking localStorage
  const testPersistence = () => {
    try {
      const storedTheme = localStorage.getItem('ares-theme');
      const currentTheme = theme;
      
      if (storedTheme === currentTheme) {
        setTestResults(prev => ({ ...prev, persistence: true }));
      } else {
        setTestResults(prev => ({ ...prev, persistence: false }));
      }
    } catch (error) {
      console.error('Error testing persistence:', error);
      setTestResults(prev => ({ ...prev, persistence: false }));
    }
  };

  // Test system detection
  const testSystemDetection = () => {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const systemPrefersDark = mediaQuery.matches;
      
      // If theme is system and resolvedTheme matches system preference
      if (theme === 'system') {
        const expectedResolved = systemPrefersDark ? 'dark' : 'light';
        if (resolvedTheme === expectedResolved) {
          setTestResults(prev => ({ ...prev, systemDetection: true }));
        } else {
          setTestResults(prev => ({ ...prev, systemDetection: false }));
        }
      } else {
        // Test by temporarily switching to system
        const originalTheme = theme;
        setTheme('system');
        
        setTimeout(() => {
          const expectedResolved = systemPrefersDark ? 'dark' : 'light';
          if (resolvedTheme === expectedResolved) {
            setTestResults(prev => ({ ...prev, systemDetection: true }));
          } else {
            setTestResults(prev => ({ ...prev, systemDetection: false }));
          }
          // Restore original theme
          if (originalTheme) setTheme(originalTheme);
        }, 100);
      }
    } catch (error) {
      console.error('Error testing system detection:', error);
      setTestResults(prev => ({ ...prev, systemDetection: false }));
    }
  };

  // Test system change handling
  const testSystemChangeHandling = () => {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Set theme to system first
      setTheme('system');
      
      // Create a mock system change event
      const handleSystemChange = (e: MediaQueryListEvent) => {
        const expectedResolved = e.matches ? 'dark' : 'light';
        setTimeout(() => {
          if (resolvedTheme === expectedResolved) {
            setTestResults(prev => ({ ...prev, systemChangeHandling: true }));
          } else {
            setTestResults(prev => ({ ...prev, systemChangeHandling: false }));
          }
        }, 100);
      };

      // Add listener temporarily
      mediaQuery.addEventListener('change', handleSystemChange);
      
      // Simulate system change by checking current state
      const currentSystemPreference = mediaQuery.matches ? 'dark' : 'light';
      if (theme === 'system' && resolvedTheme === currentSystemPreference) {
        setTestResults(prev => ({ ...prev, systemChangeHandling: true }));
      }
      
      // Clean up listener after test
      setTimeout(() => {
        mediaQuery.removeEventListener('change', handleSystemChange);
      }, 1000);
      
    } catch (error) {
      console.error('Error testing system change handling:', error);
      setTestResults(prev => ({ ...prev, systemChangeHandling: false }));
    }
  };

  // Clear localStorage for testing
  const clearStorage = () => {
    try {
      localStorage.removeItem('ares-theme');
      setThemeHistory([]);
      setTestResults({ persistence: null, systemDetection: null, systemChangeHandling: null });
      // Force reload to test fresh state
      window.location.reload();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-bold">Theme Persistence & System Detection Tests</h2>
        <Card className="p-4">
          <p>Loading theme system...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Theme Persistence & System Detection Tests</h2>
        <ThemeToggle variant="switch" showLabel showSystemOption />
      </div>
      
      <div className="grid gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Current Theme State</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Current Theme:</strong> {theme || 'undefined'}
            </div>
            <div>
              <strong>Resolved Theme:</strong> {resolvedTheme || 'undefined'}
            </div>
            <div>
              <strong>System Theme:</strong> {systemTheme || 'undefined'}
            </div>
            <div>
              <strong>Initial Theme:</strong> {initialTheme || 'not recorded'}
            </div>
          </div>
          
          <div className="mt-4">
            <strong>Storage Key:</strong> ares-theme
            <br />
            <strong>Stored Value:</strong> {typeof window !== 'undefined' ? localStorage.getItem('ares-theme') || 'null' : 'N/A'}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Test Results</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Theme Persistence Test</span>
              <div className="flex items-center gap-2">
                <Button onClick={testPersistence} size="sm">Run Test</Button>
                <span className={`px-2 py-1 rounded text-xs ${
                  testResults.persistence === true ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  testResults.persistence === false ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}>
                  {testResults.persistence === true ? '✅ PASS' : 
                   testResults.persistence === false ? '❌ FAIL' : '⏳ PENDING'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>System Detection Test</span>
              <div className="flex items-center gap-2">
                <Button onClick={testSystemDetection} size="sm">Run Test</Button>
                <span className={`px-2 py-1 rounded text-xs ${
                  testResults.systemDetection === true ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  testResults.systemDetection === false ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}>
                  {testResults.systemDetection === true ? '✅ PASS' : 
                   testResults.systemDetection === false ? '❌ FAIL' : '⏳ PENDING'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>System Change Handling Test</span>
              <div className="flex items-center gap-2">
                <Button onClick={testSystemChangeHandling} size="sm">Run Test</Button>
                <span className={`px-2 py-1 rounded text-xs ${
                  testResults.systemChangeHandling === true ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  testResults.systemChangeHandling === false ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}>
                  {testResults.systemChangeHandling === true ? '✅ PASS' : 
                   testResults.systemChangeHandling === false ? '❌ FAIL' : '⏳ PENDING'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Theme Change History</h3>
          <div className="max-h-40 overflow-y-auto">
            {themeHistory.length > 0 ? (
              <ul className="space-y-1 text-sm font-mono">
                {themeHistory.map((entry, index) => (
                  <li key={index} className="text-muted-foreground">
                    {entry}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No theme changes recorded yet</p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Manual Tests</h3>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Persistence Test Instructions</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Change the theme using the toggle above</li>
                <li>Refresh the page (F5 or Ctrl+R)</li>
                <li>Verify the theme persists after reload</li>
                <li>Open a new tab/window to this page</li>
                <li>Verify the theme is the same in the new tab</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">System Detection Test Instructions</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Set theme to "System" using the monitor button</li>
                <li>Change your OS theme (Windows: Settings > Personalization > Colors)</li>
                <li>Verify the app theme changes to match your OS setting</li>
                <li>Clear storage and reload to test first-visit detection</li>
              </ol>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={clearStorage} variant="destructive" size="sm">
                Clear Storage & Reload
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}