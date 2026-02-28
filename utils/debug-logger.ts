/**
 * Centralized Debug Logging System
 * 
 * Features:
 * - Track function execution with timing
 * - Log API calls and responses
 * - Capture errors with stack traces
 * - Toggle debug mode without affecting performance
 * - Store logs in memory for session inspection
 * - Pluggable adapter architecture for future extensibility
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: Record<string, unknown>;
  duration?: number; // ms
  error?: Error;
  stackTrace?: string;
}

export interface DebugAdapter {
  name: string;
  log(entry: LogEntry): Promise<void> | void;
  flush?(): Promise<void> | void;
}

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  maxLogsInMemory: number;
  adapters: DebugAdapter[];
  captureGlobalErrors: boolean;
}

class DebugLogger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private startTimes: Map<string, number> = new Map();
  private isInitialized = false;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? process.env.NODE_ENV !== 'production',
      level: config.level ?? 'debug',
      maxLogsInMemory: config.maxLogsInMemory ?? 1000,
      adapters: config.adapters ?? [],
      captureGlobalErrors: config.captureGlobalErrors ?? true,
    };

    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;
    
    if (this.config.captureGlobalErrors && typeof window !== 'undefined') {
      this.setupGlobalErrorHandling();
    }

    this.isInitialized = true;
    this.info('system', 'Debug logger initialized', { config: this.config });
  }

  private setupGlobalErrorHandling() {
    // Capture uncaught errors
    window.addEventListener('error', (event) => {
      this.fatal('global', 'Uncaught error', { 
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }, event.error);
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.fatal('global', 'Unhandled promise rejection', { reason: event.reason }, error);
    });
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }

  private createEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: Record<string, unknown>,
    error?: Error,
    duration?: number
  ): LogEntry {
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      duration,
      error,
      stackTrace: error?.stack,
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);

    // Trim logs if exceeding max
    if (this.logs.length > this.config.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.config.maxLogsInMemory);
    }

    // Send to adapters
    this.config.adapters.forEach(adapter => {
      try {
        adapter.log(entry);
      } catch (err) {
        console.error(`Adapter ${adapter.name} failed:`, err);
      }
    });

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      this.logToConsole(entry);
    }
  }

  private logToConsole(entry: LogEntry) {
    const prefix = `[${entry.level.toUpperCase()}] [${entry.category}]`;
    const styles = {
      debug: 'color: #6b7280',
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444',
      fatal: 'color: #dc2626; font-weight: bold',
    };

    const style = styles[entry.level];
    const duration = entry.duration ? ` (${entry.duration}ms)` : '';

    if (entry.error) {
      console.groupCollapsed(`%c${prefix}${duration} ${entry.message}`, style);
      console.log('Data:', entry.data);
      console.error('Error:', entry.error);
      console.log('Stack:', entry.stackTrace);
      console.groupEnd();
    } else {
      console.log(`%c${prefix}${duration} ${entry.message}`, style, entry.data || '');
    }
  }

  // Public logging methods
  debug(category: string, message: string, data?: Record<string, unknown>) {
    if (!this.shouldLog('debug')) return;
    this.addLog(this.createEntry('debug', category, message, data));
  }

  info(category: string, message: string, data?: Record<string, unknown>) {
    if (!this.shouldLog('info')) return;
    this.addLog(this.createEntry('info', category, message, data));
  }

  warn(category: string, message: string, data?: Record<string, unknown>) {
    if (!this.shouldLog('warn')) return;
    this.addLog(this.createEntry('warn', category, message, data));
  }

  error(category: string, message: string, data?: Record<string, unknown>, error?: Error) {
    if (!this.shouldLog('error')) return;
    this.addLog(this.createEntry('error', category, message, data, error));
  }

  fatal(category: string, message: string, data?: Record<string, unknown>, error?: Error) {
    if (!this.shouldLog('fatal')) return;
    this.addLog(this.createEntry('fatal', category, message, data, error));
  }

  // Function tracing with timing
  startTimer(id: string) {
    this.startTimes.set(id, performance.now());
  }

  endTimer(category: string, id: string, message: string, data?: Record<string, unknown>) {
    const start = this.startTimes.get(id);
    if (!start) return;
    
    const duration = Math.round(performance.now() - start);
    this.startTimes.delete(id);
    
    if (!this.shouldLog('debug')) return;
    this.addLog(this.createEntry('debug', category, message, data, undefined, duration));
  }

  // Wrap async functions with logging
  async trace<T>(
    category: string,
    operation: string,
    fn: () => Promise<T>,
    data?: Record<string, unknown>
  ): Promise<T> {
    const id = `${category}-${operation}-${Date.now()}`;
    this.startTimer(id);
    this.debug(category, `${operation} started`, data);

    try {
      const result = await fn();
      this.endTimer(category, id, `${operation} succeeded`, { result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.endTimer(category, id, `${operation} failed`, { error: err.message });
      this.error(category, `${operation} failed`, { ...data, error: err.message }, err);
      throw error;
    }
  }

  // API call logging
  logApiCall(method: string, url: string, data?: Record<string, unknown>) {
    this.debug('api', `${method} ${url}`, data);
  }

  logApiResponse(method: string, url: string, status: number, duration: number, data?: Record<string, unknown>) {
    const level = status >= 400 ? 'error' : 'debug';
    if (!this.shouldLog(level)) return;
    
    const entry = this.createEntry(level, 'api', `${method} ${url} - ${status}`, {
      status,
      ...data,
    }, undefined, duration);
    
    this.addLog(entry);
  }

  // Getters
  getLogs(level?: LogLevel, category?: string, limit = 100): LogEntry[] {
    let filtered = this.logs;
    
    if (level) {
      filtered = filtered.filter(l => l.level === level);
    }
    
    if (category) {
      filtered = filtered.filter(l => l.category === category);
    }
    
    return filtered.slice(-limit);
  }

  getRecentErrors(limit = 10): LogEntry[] {
    return this.logs
      .filter(l => l.level === 'error' || l.level === 'fatal')
      .slice(-limit);
  }

  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<LogLevel, number>,
      byCategory: {} as Record<string, number>,
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    });

    return stats;
  }

  clear() {
    this.logs = [];
  }

  // Configuration
  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    this.info('system', `Debug logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  isEnabled() {
    return this.config.enabled;
  }

  addAdapter(adapter: DebugAdapter) {
    this.config.adapters.push(adapter);
  }

  flush() {
    this.config.adapters.forEach(adapter => {
      if (adapter.flush) {
        adapter.flush();
      }
    });
  }
}

// Create singleton instance
export const debugLogger = new DebugLogger();

// React hook for using the logger
export function useDebugLogger() {
  return {
    debug: debugLogger.debug.bind(debugLogger),
    info: debugLogger.info.bind(debugLogger),
    warn: debugLogger.warn.bind(debugLogger),
    error: debugLogger.error.bind(debugLogger),
    fatal: debugLogger.fatal.bind(debugLogger),
    trace: debugLogger.trace.bind(debugLogger),
    startTimer: debugLogger.startTimer.bind(debugLogger),
    endTimer: debugLogger.endTimer.bind(debugLogger),
    getLogs: debugLogger.getLogs.bind(debugLogger),
  };
}

// Helper for wrapping API calls
export async function logApiRequest<T>(
  method: string,
  url: string,
  requestFn: () => Promise<T>,
  requestData?: Record<string, unknown>
): Promise<T> {
  const startTime = performance.now();
  debugLogger.logApiCall(method, url, requestData);

  try {
    const result = await requestFn();
    const duration = Math.round(performance.now() - startTime);
    debugLogger.logApiResponse(method, url, 200, duration, { result });
    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    const status = (error as any)?.status || 500;
    debugLogger.logApiResponse(method, url, status, duration, { error: (error as Error).message });
    throw error;
  }
}

export default debugLogger;
