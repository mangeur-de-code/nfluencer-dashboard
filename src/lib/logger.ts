/**
 * Structured logging utility for client-side observability
 * Sends logs to Cloudflare Analytics Engine via edge workers
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'api' | 'performance' | 'error' | 'event' | 'auth';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

class Logger {
  private sessionId: string;
  private batchQueue: LogEntry[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_INTERVAL = 5000; // 5 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandler();
    this.setupPerformanceObserver();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      sessionId: this.sessionId,
      url: window.location.pathname,
      userAgent: navigator.userAgent.substring(0, 200), // Limit length
    };

    // Always log to console in development
    const logMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[logMethod](`[${category.toUpperCase()}] ${message}`, data || '');

    // Queue for batch sending to Cloudflare
    this.batchQueue.push(entry);

    // Send immediately if batch is full, otherwise batch with debounce
    if (this.batchQueue.length >= this.BATCH_SIZE) {
      this.flush();
    } else {
      this.scheduleBatchSend();
    }
  }

  private scheduleBatchSend(): void {
    if (this.batchTimeout) clearTimeout(this.batchTimeout);
    this.batchTimeout = setTimeout(() => this.flush(), this.BATCH_INTERVAL);
  }

  private async flush(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const logsToSend = [...this.batchQueue];
    this.batchQueue = [];

    try {
      // Send to Cloudflare Analytics Engine via worker
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToSend }),
      });
    } catch (err) {
      // Silently fail - don't create infinite error loops
      console.debug('Failed to send logs to Cloudflare', err);
    }
  }

  // Public API
  debug(category: LogCategory, message: string, data?: Record<string, any>): void {
    this.log('debug', category, message, data);
  }

  info(category: LogCategory, message: string, data?: Record<string, any>): void {
    this.log('info', category, message, data);
  }

  warn(category: LogCategory, message: string, data?: Record<string, any>): void {
    this.log('warn', category, message, data);
  }

  error(category: LogCategory, message: string, data?: Record<string, any>): void {
    this.log('error', category, message, data);
  }

  // Convenience methods for common scenarios
  apiRequest(
    method: string,
    url: string,
    params?: Record<string, any>
  ): void {
    this.debug('api', `${method} ${url}`, { params });
  }

  apiResponse(
    method: string,
    url: string,
    status: number,
    duration: number
  ): void {
    this.info('api', `${method} ${url} -> ${status}`, { status, durationMs: duration });
  }

  apiError(
    method: string,
    url: string,
    status: number,
    error: string,
    duration: number
  ): void {
    this.error('api', `${method} ${url} failed with ${status}`, {
      status,
      error,
      durationMs: duration,
    });
  }

  trackEvent(eventName: string, data?: Record<string, any>): void {
    this.info('event', eventName, data);
  }

  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.info('performance', metric, { value, unit });
  }

  // Setup global error handler
  private setupGlobalErrorHandler(): void {
    window.addEventListener('error', (event) => {
      this.error('error', 'Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error('error', 'Unhandled promise rejection', {
        reason: String(event.reason),
      });
    });
  }

  // Setup performance observer for Web Vitals
  private setupPerformanceObserver(): void {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.trackPerformance('LCP', lastEntry.renderTime || lastEntry.loadTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID) - via PerformanceEventTiming
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.processingDuration) {
              this.trackPerformance('FID', entry.processingDuration);
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.trackPerformance('CLS', clsValue);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (err) {
        console.debug('Performance observer setup failed', err);
      }
    }

    // Monitor page load time
    window.addEventListener('load', () => {
      const perfData = performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      this.trackPerformance('Page Load', pageLoadTime);
    });
  }

  // Ensure logs are flushed on page unload
  async ensureFlushed(): Promise<void> {
    if (this.batchTimeout) clearTimeout(this.batchTimeout);
    await this.flush();
  }
}

export const logger = new Logger();

// Ensure logs are sent before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    logger.ensureFlushed();
  });
}
