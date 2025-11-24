/**
 * Centralized Logging Utility
 *
 * Features:
 * - Session and User-based file separation
 * - Structured logging for API requests and responses
 * - Daily log rotation
 * - Formatted JSON output for better readability
 * - Automatic log directory creation
 * - Real-time Firestore logging integration
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import {
  addLogToFirestore,
  logAPIRequestToFirestore,
  logAPIResponseToFirestore,
  logErrorToFirestore,
  flushSessionBatches
} from './firestoreLogger';

// Log directory configuration
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Custom format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json({
    space: 2 // Pretty print JSON with 2-space indentation
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0 && meta.metadata) {
      metaStr = '\n' + JSON.stringify(meta.metadata, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Cache for loggers per session/user
const loggerCache = new Map<string, winston.Logger>();

/**
 * Create or retrieve a logger for a specific user and session
 *
 * @param userId - User identifier
 * @param sessionId - Session identifier
 * @returns Winston logger instance
 */
export function getLogger(userId: string, sessionId: string): winston.Logger {
  const loggerKey = `${userId}_${sessionId}`;

  // Return cached logger if exists
  if (loggerCache.has(loggerKey)) {
    return loggerCache.get(loggerKey)!;
  }

  // Create user-session specific directory
  const userSessionDir = path.join(LOG_DIR, sanitizeFileName(userId), sanitizeFileName(sessionId));
  if (!fs.existsSync(userSessionDir)) {
    fs.mkdirSync(userSessionDir, { recursive: true });
  }

  // Create new logger with session-specific file
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: {
      userId,
      sessionId,
      environment: process.env.NODE_ENV || 'development'
    },
    transports: [
      // Rotating file transport for all logs
      new DailyRotateFile({
        dirname: userSessionDir,
        filename: 'application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: customFormat
      }),

      // Separate file for errors
      new DailyRotateFile({
        dirname: userSessionDir,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '30d',
        format: customFormat
      }),

      // Console output for development
      ...(process.env.NODE_ENV === 'development' ? [
        new winston.transports.Console({
          format: consoleFormat
        })
      ] : [])
    ],
    // Handle uncaught exceptions and rejections
    exceptionHandlers: [
      new DailyRotateFile({
        dirname: userSessionDir,
        filename: 'exceptions-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d'
      })
    ],
    rejectionHandlers: [
      new DailyRotateFile({
        dirname: userSessionDir,
        filename: 'rejections-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d'
      })
    ]
  });

  // Cache the logger
  loggerCache.set(loggerKey, logger);

  return logger;
}

/**
 * Get a general application logger (for cases without session/user context)
 */
export function getAppLogger(): winston.Logger {
  const loggerKey = 'app_general';

  if (loggerCache.has(loggerKey)) {
    return loggerCache.get(loggerKey)!;
  }

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: {
      context: 'application',
      environment: process.env.NODE_ENV || 'development'
    },
    transports: [
      new DailyRotateFile({
        dirname: LOG_DIR,
        filename: 'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d'
      }),
      new DailyRotateFile({
        dirname: LOG_DIR,
        filename: 'app-error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '30d'
      }),
      ...(process.env.NODE_ENV === 'development' ? [
        new winston.transports.Console({
          format: consoleFormat
        })
      ] : [])
    ]
  });

  loggerCache.set(loggerKey, logger);
  return logger;
}

/**
 * Sanitize filename to remove invalid characters
 */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Log API request details
 */
export function logAPIRequest(
  logger: winston.Logger,
  endpoint: string,
  method: string,
  params: any
) {
  const logData = {
    type: 'api_request',
    endpoint,
    method,
    params: sanitizeLogData(params),
    timestamp: new Date().toISOString()
  };

  logger.info('API Request', logData);

  // Also log to Firestore if we have user and session context
  const meta = logger.defaultMeta as any;
  if (meta && meta.userId && meta.sessionId && meta.userId !== 'anonymous') {
    logAPIRequestToFirestore(
      meta.userId,
      meta.sessionId,
      endpoint,
      method,
      sanitizeLogData(params)
    ).catch(err => {
      console.error('Failed to log API request to Firestore:', err);
    });
  }
}

/**
 * Log API response details
 */
export function logAPIResponse(
  logger: winston.Logger,
  endpoint: string,
  method: string,
  statusCode: number,
  response: any,
  duration?: number
) {
  const logLevel = statusCode >= 400 ? 'error' : 'info';
  const logData = {
    type: 'api_response',
    endpoint,
    method,
    statusCode,
    response: sanitizeLogData(response),
    duration: duration ? `${duration}ms` : undefined,
    timestamp: new Date().toISOString()
  };

  logger.log(logLevel, 'API Response', logData);

  // Also log to Firestore if we have user and session context
  const meta = logger.defaultMeta as any;
  if (meta && meta.userId && meta.sessionId && meta.userId !== 'anonymous') {
    logAPIResponseToFirestore(
      meta.userId,
      meta.sessionId,
      endpoint,
      method,
      statusCode,
      sanitizeLogData(response),
      duration
    ).catch(err => {
      console.error('Failed to log API response to Firestore:', err);
    });
  }
}

/**
 * Log API error
 */
export function logAPIError(
  logger: winston.Logger,
  endpoint: string,
  method: string,
  error: any,
  additionalContext?: any
) {
  const logData = {
    type: 'api_error',
    endpoint,
    method,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error,
    context: sanitizeLogData(additionalContext),
    timestamp: new Date().toISOString()
  };

  logger.error('API Error', logData);

  // Also log to Firestore if we have user and session context
  const meta = logger.defaultMeta as any;
  if (meta && meta.userId && meta.sessionId && meta.userId !== 'anonymous') {
    logErrorToFirestore(
      meta.userId,
      meta.sessionId,
      `API Error: ${endpoint} ${method}`,
      error,
      sanitizeLogData(additionalContext)
    ).catch(err => {
      console.error('Failed to log API error to Firestore:', err);
    });
  }
}

/**
 * Log backend proxy request
 */
export function logBackendRequest(
  logger: winston.Logger,
  backendEndpoint: string,
  requestBody: any
) {
  const logData = {
    type: 'backend_request',
    backendEndpoint,
    requestBody: sanitizeLogData(requestBody),
    timestamp: new Date().toISOString()
  };

  logger.info('Backend Request', logData);

  // Also log to Firestore if we have user and session context
  const meta = logger.defaultMeta as any;
  if (meta && meta.userId && meta.sessionId && meta.userId !== 'anonymous') {
    addLogToFirestore(
      meta.userId,
      meta.sessionId,
      {
        level: 'info',
        message: 'Backend Request',
        type: 'backend_request',
        endpoint: backendEndpoint,
        metadata: {
          backendEndpoint,
          requestBody: sanitizeLogData(requestBody),
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      },
      'application'
    ).catch(err => {
      console.error('Failed to log backend request to Firestore:', err);
    });
  }
}

/**
 * Log backend proxy response
 */
export function logBackendResponse(
  logger: winston.Logger,
  backendEndpoint: string,
  statusCode: number,
  response: any,
  duration?: number
) {
  const logLevel = statusCode >= 400 ? 'error' : 'info';
  const logData = {
    type: 'backend_response',
    backendEndpoint,
    statusCode,
    response: sanitizeLogData(response),
    duration: duration ? `${duration}ms` : undefined,
    timestamp: new Date().toISOString()
  };

  logger.log(logLevel, 'Backend Response', logData);

  // Also log to Firestore if we have user and session context
  const meta = logger.defaultMeta as any;
  if (meta && meta.userId && meta.sessionId && meta.userId !== 'anonymous') {
    addLogToFirestore(
      meta.userId,
      meta.sessionId,
      {
        level: logLevel,
        message: 'Backend Response',
        type: 'backend_response',
        endpoint: backendEndpoint,
        statusCode,
        metadata: {
          backendEndpoint,
          statusCode,
          response: sanitizeLogData(response),
          duration: duration ? `${duration}ms` : undefined,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        duration: duration ? `${duration}ms` : undefined
      },
      statusCode >= 400 ? 'error' : 'application'
    ).catch(err => {
      console.error('Failed to log backend response to Firestore:', err);
    });
  }
}

/**
 * Sanitize log data to prevent logging sensitive information
 */
function sanitizeLogData(data: any): any {
  if (!data) return data;

  // List of sensitive keys to redact
  const sensitiveKeys = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'auth',
    'creditCard',
    'credit_card',
    'ssn',
    'social_security'
  ];

  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeLogData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeLogData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Close all loggers (useful for cleanup)
 */
export async function closeAllLoggers(): Promise<void[]> {
  const closePromises = Array.from(loggerCache.values()).map(
    logger => new Promise<void>((resolve) => {
      logger.close();
      resolve();
    })
  );

  loggerCache.clear();

  // Also flush all Firestore batches
  const { flushAllBatches } = await import('./firestoreLogger');
  await flushAllBatches();

  return Promise.all(closePromises);
}

/**
 * Close logger for a specific session and flush its Firestore batches
 */
export async function closeSessionLogger(userId: string, sessionId: string): Promise<void> {
  const loggerKey = `${userId}_${sessionId}`;

  const logger = loggerCache.get(loggerKey);
  if (logger) {
    await new Promise<void>((resolve) => {
      logger.close();
      resolve();
    });
    loggerCache.delete(loggerKey);
  }

  // Flush Firestore batches for this session
  await flushSessionBatches(userId, sessionId);
}

export default {
  getLogger,
  getAppLogger,
  logAPIRequest,
  logAPIResponse,
  logAPIError,
  logBackendRequest,
  logBackendResponse,
  closeAllLoggers,
  closeSessionLogger
};
