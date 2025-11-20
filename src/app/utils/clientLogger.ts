/**
 * Client-Side Logging Utility
 *
 * This is a browser-safe logging utility that doesn't depend on Node.js modules.
 * Logs are stored in memory and can be sent to the server for persistence.
 */

/**
 * Client-side logging helper (stores logs to send to server)
 * Since winston doesn't work in browser, we use a simple queue
 */
export class ClientLogger {
  private static logs: any[] = [];
  private static maxLogs = 100;

  static log(level: string, message: string, metadata?: any) {
    const logEntry = {
      level,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    this.logs.push(logEntry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? console.error :
                           level === 'warn' ? console.warn :
                           console.log;
      consoleMethod(`[${level.toUpperCase()}]`, message, metadata || '');
    }
  }

  static getLogs() {
    return [...this.logs];
  }

  static clearLogs() {
    this.logs = [];
  }

  static async sendLogsToServer(userId: string, sessionId: string) {
    if (this.logs.length === 0) return;

    try {
      await fetch('/api/logs/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          logs: this.getLogs()
        })
      });
      this.clearLogs();
    } catch (error) {
      console.error('Failed to send logs to server:', error);
    }
  }
}

export default ClientLogger;
