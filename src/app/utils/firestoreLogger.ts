/**
 * Firestore Logging Utility
 *
 * This utility provides real-time log dumping to Firestore.
 * It maintains the same folder structure as the file-based logging:
 * logs/{userId}/{sessionId}/{logType}
 *
 * Features:
 * - Real-time log streaming to Firestore
 * - Session-based document organization
 * - Batched writes for performance
 * - Automatic log type categorization (info, error, debug, etc.)
 */

import { db } from '../../../firebase';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    arrayUnion,
    serverTimestamp,
    getDoc,
    Timestamp
} from 'firebase/firestore';

// Types for log entries
export interface LogEntry {
    level: string;
    message: string;
    metadata?: any;
    timestamp: string;
    type?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    duration?: string;
}

export interface LogDocument {
    userId: string;
    sessionId: string;
    logs: LogEntry[];
    createdAt: Timestamp | string;
    lastUpdatedAt: Timestamp | string;
    logType: 'application' | 'error' | 'exception' | 'rejection' | 'client';
    environment: string;
}

// Configuration
const MAX_LOGS_PER_BATCH = 50; // Maximum logs to accumulate before forcing a write
const BATCH_TIMEOUT_MS = 5000; // Maximum time to wait before forcing a write (5 seconds)

// In-memory batch accumulator for performance
interface LogBatch {
    logs: LogEntry[];
    timer: NodeJS.Timeout | null;
}

const logBatches = new Map<string, LogBatch>();

/**
 * Get Firestore document path for a specific log type
 * Structure: logs/{userId}/sessions/{sessionId}
 */
function getLogDocumentPath(userId: string, sessionId: string): string {
    return `logs/${userId}/sessions/${sessionId}`;
}

/**
 * Get or create a batch for this user-session combo
 */
function getBatch(userId: string, sessionId: string, logType: string): LogBatch {
    const key = `${userId}_${sessionId}_${logType}`;

    if (!logBatches.has(key)) {
        logBatches.set(key, {
            logs: [],
            timer: null
        });
    }

    return logBatches.get(key)!;
}

/**
 * Flush a batch of logs to Firestore
 */
async function flushBatch(
    userId: string,
    sessionId: string,
    logType: 'application' | 'error' | 'exception' | 'rejection' | 'client',
    batch: LogBatch
): Promise<void> {
    if (batch.logs.length === 0) return;

    const logsToAdd = [...batch.logs];
    batch.logs = []; // Clear the batch

    if (batch.timer) {
        clearTimeout(batch.timer);
        batch.timer = null;
    }

    try {
        const logDocPath = getLogDocumentPath(userId, sessionId);
        const logDocRef = doc(db, logDocPath);

        // Check if document exists
        const docSnap = await getDoc(logDocRef);

        if (docSnap.exists()) {
            // Update existing document with new logs
            const existingData = docSnap.data();
            const logTypeKey = `${logType}Logs`;

            await updateDoc(logDocRef, {
                [logTypeKey]: arrayUnion(...logsToAdd),
                lastUpdatedAt: serverTimestamp(),
                [`${logType}Count`]: (existingData[`${logType}Count`] || 0) + logsToAdd.length
            });
        } else {
            // Create new document
            const newDoc: any = {
                userId,
                sessionId,
                createdAt: serverTimestamp(),
                lastUpdatedAt: serverTimestamp(),
                environment: process.env.NODE_ENV || 'development',
                applicationLogs: logType === 'application' ? logsToAdd : [],
                errorLogs: logType === 'error' ? logsToAdd : [],
                exceptionLogs: logType === 'exception' ? logsToAdd : [],
                rejectionLogs: logType === 'rejection' ? logsToAdd : [],
                clientLogs: logType === 'client' ? logsToAdd : [],
                applicationCount: logType === 'application' ? logsToAdd.length : 0,
                errorCount: logType === 'error' ? logsToAdd.length : 0,
                exceptionCount: logType === 'exception' ? logsToAdd.length : 0,
                rejectionCount: logType === 'rejection' ? logsToAdd.length : 0,
                clientCount: logType === 'client' ? logsToAdd.length : 0,
            };

            await setDoc(logDocRef, newDoc);
        }

        // Also maintain a collection-based structure for easier querying
        // This creates: logs/{userId}/sessions/{sessionId}/entries/{logType}_{timestamp}
        const entriesCollectionRef = collection(db, `${logDocPath}/entries`);

        // Create a single document for this batch with timestamp
        const batchDocId = `${logType}_${Date.now()}`;
        const batchDocRef = doc(entriesCollectionRef, batchDocId);

        await setDoc(batchDocRef, {
            logType,
            logs: logsToAdd,
            count: logsToAdd.length,
            timestamp: serverTimestamp()
        });

    } catch (error) {
        console.error('Error flushing logs to Firestore:', error);
        // Re-add logs to batch if write failed
        batch.logs.unshift(...logsToAdd);
    }
}

/**
 * Schedule a batch flush
 */
function scheduleBatchFlush(
    userId: string,
    sessionId: string,
    logType: 'application' | 'error' | 'exception' | 'rejection' | 'client'
): void {
    const batch = getBatch(userId, sessionId, logType);

    if (batch.timer) {
        return; // Timer already scheduled
    }

    batch.timer = setTimeout(() => {
        flushBatch(userId, sessionId, logType, batch);
    }, BATCH_TIMEOUT_MS);
}

/**
 * Add a log entry to Firestore (batched for performance)
 * 
 * @param userId - User identifier
 * @param sessionId - Session identifier (used as document ID)
 * @param logEntry - Log entry to store
 * @param logType - Type of log (application, error, exception, rejection, client)
 */
export async function addLogToFirestore(
    userId: string,
    sessionId: string,
    logEntry: LogEntry,
    logType: 'application' | 'error' | 'exception' | 'rejection' | 'client' = 'application'
): Promise<void> {
    // Skip if we're in test environment or missing required data
    if (process.env.NODE_ENV === 'test' || !userId || !sessionId) {
        return;
    }

    try {
        const batch = getBatch(userId, sessionId, logType);

        // Add log to batch
        batch.logs.push({
            ...logEntry,
            timestamp: logEntry.timestamp || new Date().toISOString()
        });

        // Flush immediately if batch is full
        if (batch.logs.length >= MAX_LOGS_PER_BATCH) {
            await flushBatch(userId, sessionId, logType, batch);
        } else {
            // Schedule a flush
            scheduleBatchFlush(userId, sessionId, logType);
        }
    } catch (error) {
        console.error('Error adding log to Firestore:', error);
    }
}

/**
 * Force flush all pending batches to Firestore
 * Useful when application is shutting down or session ends
 */
export async function flushAllBatches(): Promise<void> {
    const flushPromises: Promise<void>[] = [];

    for (const [key, batch] of logBatches.entries()) {
        const [userId, sessionId, logType] = key.split('_');
        flushPromises.push(
            flushBatch(
                userId,
                sessionId,
                logType as 'application' | 'error' | 'exception' | 'rejection' | 'client',
                batch
            )
        );
    }

    await Promise.all(flushPromises);
    logBatches.clear();
}

/**
 * Flush batches for a specific session
 */
export async function flushSessionBatches(userId: string, sessionId: string): Promise<void> {
    const flushPromises: Promise<void>[] = [];
    const keysToFlush: string[] = [];

    for (const [key, batch] of logBatches.entries()) {
        if (key.startsWith(`${userId}_${sessionId}_`)) {
            const [, , logType] = key.split('_');
            flushPromises.push(
                flushBatch(
                    userId,
                    sessionId,
                    logType as 'application' | 'error' | 'exception' | 'rejection' | 'client',
                    batch
                )
            );
            keysToFlush.push(key);
        }
    }

    await Promise.all(flushPromises);

    // Clean up flushed batches
    keysToFlush.forEach(key => logBatches.delete(key));
}

/**
 * Create a log summary document for quick access
 * This is useful for dashboards and monitoring
 */
export async function createLogSummary(
    userId: string,
    sessionId: string,
    summary: {
        totalLogs: number;
        errorCount: number;
        warningCount: number;
        infoCount: number;
        sessionStartTime: string;
        sessionEndTime?: string;
        apiCallsCount?: number;
        backendRequestsCount?: number;
    }
): Promise<void> {
    try {
        const summaryDocRef = doc(db, `logs/${userId}/summaries/${sessionId}`);

        await setDoc(summaryDocRef, {
            ...summary,
            userId,
            sessionId,
            createdAt: serverTimestamp(),
            lastUpdatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Error creating log summary:', error);
    }
}

/**
 * Log API request to Firestore
 */
export async function logAPIRequestToFirestore(
    userId: string,
    sessionId: string,
    endpoint: string,
    method: string,
    params: any
): Promise<void> {
    const logEntry: LogEntry = {
        level: 'info',
        message: `${endpoint} API Request`,
        type: 'api_request',
        endpoint,
        method,
        metadata: {
            params,
            timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
    };

    await addLogToFirestore(userId, sessionId, logEntry, 'application');
}

/**
 * Log API response to Firestore
 */
export async function logAPIResponseToFirestore(
    userId: string,
    sessionId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    response: any,
    duration?: number
): Promise<void> {
    const logEntry: LogEntry = {
        level: statusCode >= 400 ? 'error' : 'info',
        message: `${endpoint} API Response`,
        type: 'api_response',
        endpoint,
        method,
        statusCode,
        metadata: {
            response,
            duration: duration ? `${duration}ms` : undefined,
            timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        duration: duration ? `${duration}ms` : undefined
    };

    const logType = statusCode >= 400 ? 'error' : 'application';
    await addLogToFirestore(userId, sessionId, logEntry, logType);
}

/**
 * Log error to Firestore
 */
export async function logErrorToFirestore(
    userId: string,
    sessionId: string,
    message: string,
    error: any,
    context?: any
): Promise<void> {
    const logEntry: LogEntry = {
        level: 'error',
        message,
        type: 'error',
        metadata: {
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : error,
            context,
            timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
    };

    await addLogToFirestore(userId, sessionId, logEntry, 'error');
}

export default {
    addLogToFirestore,
    flushAllBatches,
    flushSessionBatches,
    createLogSummary,
    logAPIRequestToFirestore,
    logAPIResponseToFirestore,
    logErrorToFirestore
};

