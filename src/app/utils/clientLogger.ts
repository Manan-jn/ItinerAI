/**
 * Client-Side Logging Utility
 *
 * This is a browser-safe logging utility that doesn't depend on Node.js modules.
 * Logs are stored in memory and can be sent to the server for persistence.
 * Now includes direct Firestore integration for real-time logging.
 */

import { db } from '../../../firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

/**
 * Client-side logging helper (stores logs to send to server or Firestore)
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

  /**
   * Send logs to server via API route (legacy method)
   */
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

  /**
   * Send logs directly to Firestore (new method)
   * This provides real-time log dumping from the client
   */
  static async sendLogsToFirestore(userId: string, sessionId: string) {
    if (this.logs.length === 0 || !userId || !sessionId) return;

    try {
      const logDocPath = `logs/${userId}/sessions/${sessionId}`;
      const logDocRef = doc(db, logDocPath);

      // Check if document exists
      const docSnap = await getDoc(logDocRef);

      const logsToSend = [...this.logs];

      if (docSnap.exists()) {
        // Update existing document with new client logs
        await updateDoc(logDocRef, {
          clientLogs: arrayUnion(...logsToSend),
          lastUpdatedAt: serverTimestamp(),
          clientCount: (docSnap.data().clientCount || 0) + logsToSend.length
        });
      } else {
        // Create new document
        await setDoc(logDocRef, {
          userId,
          sessionId,
          createdAt: serverTimestamp(),
          lastUpdatedAt: serverTimestamp(),
          environment: process.env.NODE_ENV || 'production',
          clientLogs: logsToSend,
          applicationLogs: [],
          errorLogs: [],
          exceptionLogs: [],
          rejectionLogs: [],
          clientCount: logsToSend.length,
          applicationCount: 0,
          errorCount: 0,
          exceptionCount: 0,
          rejectionCount: 0
        });
      }

      // Also create an entry in the entries subcollection
      const entriesCollectionRef = collection(db, `${logDocPath}/entries`);
      const batchDocId = `client_${Date.now()}`;
      const batchDocRef = doc(entriesCollectionRef, batchDocId);

      await setDoc(batchDocRef, {
        logType: 'client',
        logs: logsToSend,
        count: logsToSend.length,
        timestamp: serverTimestamp()
      });

      this.clearLogs();
      console.log(`✅ Sent ${logsToSend.length} client logs to Firestore`);
    } catch (error) {
      console.error('Failed to send logs to Firestore:', error);
    }
  }

  /**
   * Auto-flush logs to Firestore at regular intervals
   * Call this once when the app initializes
   */
  static startAutoFlush(userId: string, sessionId: string, intervalMs: number = 30000) {
    if (typeof window === 'undefined') return; // Only in browser

    const flushInterval = setInterval(() => {
      this.sendLogsToFirestore(userId, sessionId).catch(err => {
        console.error('Auto-flush failed:', err);
      });
    }, intervalMs);

    // Clean up on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        clearInterval(flushInterval);
        // Try to flush remaining logs (best effort)
        this.sendLogsToFirestore(userId, sessionId).catch(() => { });
      });
    }

    return flushInterval;
  }

  /**
   * Log an API call from the client
   */
  static logAPICall(
    endpoint: string,
    method: string,
    params: any,
    userId?: string,
    sessionId?: string
  ) {
    this.log('info', `API Call: ${method} ${endpoint}`, {
      endpoint,
      method,
      params,
      type: 'client_api_call'
    });

    // If userId and sessionId are provided, immediately send to Firestore
    if (userId && sessionId) {
      this.sendLogsToFirestore(userId, sessionId).catch(() => { });
    }
  }

  /**
   * Log a user interaction
   */
  static logUserInteraction(
    action: string,
    component: string,
    metadata?: any,
    userId?: string,
    sessionId?: string
  ) {
    this.log('info', `User Interaction: ${action}`, {
      action,
      component,
      metadata,
      type: 'user_interaction'
    });

    // If userId and sessionId are provided, immediately send to Firestore
    if (userId && sessionId) {
      this.sendLogsToFirestore(userId, sessionId).catch(() => { });
    }
  }

  /**
   * Log a client-side error
   */
  static logError(
    error: Error | string,
    context?: any,
    userId?: string,
    sessionId?: string
  ) {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: error };

    this.log('error', 'Client Error', {
      error: errorData,
      context,
      type: 'client_error'
    });

    // If userId and sessionId are provided, immediately send to Firestore
    if (userId && sessionId) {
      this.sendLogsToFirestore(userId, sessionId).catch(() => { });
    }
  }
}

export default ClientLogger;
