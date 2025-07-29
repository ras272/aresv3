'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Card } from './card';
import { Button } from './button';
import { ThemeToggle } from './theme-toggle';

interface PerformanceMetrics {
  themeChangeTime: number;
  renderTime: number;
  transitionTime: number;
  memoryUsage?: number;
}

export function ThemePerformanceTest() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [metrics, setMetrics] = React.useState<PerformanceMetrics[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [testResults, setTestResults] = React.useState<{
    averageThemeChange: number;
    averageRender: number;
    averageTransition: number;
    totalTests: number;
  } | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Performance monitoring for theme changes
  const measureThemeChange = React.useCallback(async (newTheme: string) => {
    const startTime = performance.now();
    
    // Measure theme change
    setTheme(newTheme);
    
    // Wait for next frame to measure render time
    await new Promise(resolve => requestAnimationFrame(resolve));
    const renderTime = performance.now();
    
    // Wait for transitions to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    const endTime = performance.now();
    
    const themeChangeTime = renderTime - startTime;
    const totalTime = endTime - startTime;
    const transitionTime = totalTime - themeChangeTime;
    
    // Get memory usage if available
    const memoryUsage = (performance as any).memory?.usedJSHeapSize;
    
    const metric: PerformanceMetrics = {
      themeChangeTime,
      renderTime: themeChangeTime,
      transitionTime,
      memoryUsage
    };
    
    setMetrics(prev => [...prev, metric]);
    return metric;
  }, [setTheme]);

  // Run automated performance test
  const runPerformanceTest = async () => {
    setIsRunning(true);
    setMetrics([]);
    
    const themes = ['light', 'dark', 'system'];
    const iterations = 10;
    
    try {
      for (let i = 0; i < iterations; i++) {
        for (const testTheme of themes) {
          await measureThemeChange(testTheme);
          // Small delay between tests
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Calculate averages
      const totalTests = metrics.length;
      const averageThemeChange = metrics.reduce((sum, m) => sum + m.themeChangeTime, 0) / totalTests;
      const averageRender = metrics.reduce((sum, m) => sum + m.renderTime, 0) / totalTests;
      const averageTransition = metrics.reduce((sum, m) => sum + m.transitionTime, 0) / totalTests;
      
      setTestResults({
        averageThemeChange,
        averageRender,
        averageTransition,
        totalTests
      });
      
    } catch (error) {
      console.error('Performance test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Test theme flash prevention
  const testFlashPrevention = () => {
    // Rapidly switch themes to test for flash
    const themes = ['light', 'dark', 'system'];
    let index = 0;
    
    const rapidSwitch = () => {
      setTheme(themes[index % themes.length]);
      index++;
      
      if (index < 20) {
        requestAnimationFrame(rapidSwitch);
      }
    };
    
    rapidSwitch();
  };

  // Clear test results
  const clearResults = () => {
    setMetrics([]);
    setTestResults(null);
  };

  if (!mounted) {
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-bold">Theme Performance Testing</h2>
        <Card className="p-4">
          <p>Loading performance testing tools...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Theme Performance & Flash Prevention</h2>
        <ThemeToggle variant="switch" showLabel={false} />
      </div>
      
      <div className="grid gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Performance Optimization Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-green-600">Hydration Optimization ✅</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• requestAnimationFrame for smooth hydration</li>
                <li>• Skeleton loading states prevent layout shift</li>
                <li>• Optimized mounting process</li>
                <li>• No flash of incorrect theme</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-green-600">CSS Transitions ✅</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Hardware-accelerated transforms</li>
                <li>• Optimized duration (300ms)</li>
                <li>• ease-in-out timing function</li>
                <li>• GPU-friendly properties</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Performance Testing</h3>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={runPerformanceTest} 
                disabled={isRunning}
                className="min-w-32"
              >
                {isRunning ? 'Running...' : 'Run Performance Test'}
              </Button>
              <Button onClick={testFlashPrevention} variant="outline">
                Test Flash Prevention
              </Button>
              <Button onClick={clearResults} variant="outline">
                Clear Results
              </Button>
            </div>
            
            {isRunning && (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Running automated performance test... This will cycle through themes multiple times.
                </p>
              </div>
            )}
          </div>
        </Card>

        {testResults && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Performance Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.averageThemeChange.toFixed(2)}ms
                </div>
                <div className="text-sm text-muted-foreground">Avg Theme Change</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {testResults.averageRender.toFixed(2)}ms
                </div>
                <div className="text-sm text-muted-foreground">Avg Render Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {testResults.averageTransition.toFixed(2)}ms
                </div>
                <div className="text-sm text-muted-foreground">Avg Transition</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {testResults.totalTests}
                </div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">Performance Analysis</h4>
              <div className="text-sm text-green-600 dark:text-green-400 space-y-1">
                <p>
                  <strong>Theme Change Speed:</strong> {testResults.averageThemeChange < 16 ? '✅ Excellent' : testResults.averageThemeChange < 32 ? '✅ Good' : '⚠️ Needs optimization'} 
                  ({testResults.averageThemeChange < 16 ? 'Under 1 frame' : 'Multiple frames'})
                </p>
                <p>
                  <strong>Transition Smoothness:</strong> {testResults.averageTransition < 350 ? '✅ Smooth' : '⚠️ May feel sluggish'} 
                  (Target: ~300ms)
                </p>
                <p>
                  <strong>Overall Performance:</strong> {testResults.averageThemeChange + testResults.averageTransition < 350 ? '✅ Optimized' : '⚠️ Could be improved'}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Flash Prevention Demo</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">Optimized Loading</h4>
                <div className="p-3 border rounded-md bg-muted/30">
                  <ThemeToggle variant="switch" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  No flash, smooth skeleton → content transition
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Smooth Transitions</h4>
                <div className="p-3 border rounded-md bg-muted/30">
                  <ThemeToggle variant="cycle" showLabel />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hardware-accelerated animations
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Performance Metrics</h4>
                <div className="p-3 border rounded-md bg-muted/30 text-center">
                  <div className="text-lg font-mono">
                    {testResults ? `${(testResults.averageThemeChange + testResults.averageTransition).toFixed(1)}ms` : '~300ms'}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Change Time</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">Device Testing Recommendations</h4>
              <div className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                <p>• <strong>Desktop:</strong> Test on different browsers (Chrome, Firefox, Safari, Edge)</p>
                <p>• <strong>Mobile:</strong> Test on iOS Safari and Android Chrome for touch interactions</p>
                <p>• <strong>Low-end devices:</strong> Verify performance on older/slower devices</p>
                <p>• <strong>High refresh rate:</strong> Test on 120Hz+ displays for smooth animations</p>
              </div>
            </div>
          </div>
        </Card>

        {metrics.length > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Recent Performance Metrics</h3>
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Test #</th>
                    <th className="text-left p-1">Theme Change</th>
                    <th className="text-left p-1">Render</th>
                    <th className="text-left p-1">Transition</th>
                    {metrics[0]?.memoryUsage && <th className="text-left p-1">Memory</th>}
                  </tr>
                </thead>
                <tbody>
                  {metrics.slice(-10).map((metric, index) => (
                    <tr key={index} className="border-b text-muted-foreground">
                      <td className="p-1">{metrics.length - 10 + index + 1}</td>
                      <td className="p-1">{metric.themeChangeTime.toFixed(2)}ms</td>
                      <td className="p-1">{metric.renderTime.toFixed(2)}ms</td>
                      <td className="p-1">{metric.transitionTime.toFixed(2)}ms</td>
                      {metric.memoryUsage && (
                        <td className="p-1">{(metric.memoryUsage / 1024 / 1024).toFixed(1)}MB</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}