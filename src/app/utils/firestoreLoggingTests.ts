/**
 * Firestore Logging Test Utilities
 * 
 * This file contains utilities to test and verify the Firestore logging implementation.
 * Run these tests to ensure logs are being correctly stored in Firestore.
 */

import { db } from '../firebase';
import { doc, getDoc, collection, query, getDocs, orderBy, limit } from 'firebase/firestore';

/**
 * Test 1: Verify session logs exist in Firestore
 */
export async function testSessionLogsExist(userId: string, sessionId: string): Promise<boolean> {
  try {
    
    const logDocPath = `logs/${userId}/sessions/${sessionId}`;
    const logDocRef = doc(db, logDocPath);
    const docSnap = await getDoc(logDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing session logs:', error);
    return false;
  }
}

/**
 * Test 2: Retrieve and display recent logs
 */
export async function displayRecentLogs(userId: string, sessionId: string, logType: 'application' | 'error' | 'client' = 'application') {
  try {
    
    const logDocPath = `logs/${userId}/sessions/${sessionId}`;
    const logDocRef = doc(db, logDocPath);
    const docSnap = await getDoc(logDocRef);
    
    if (!docSnap.exists()) {
      return;
    }
    
    const data = docSnap.data();
    const logs = data[`${logType}Logs`] || [];
    
    
    // Display last 5 logs
    const recentLogs = logs.slice(-5);
    recentLogs.forEach((log: any, index: number) => {
    });
  } catch (error) {
    console.error('❌ Error displaying logs:', error);
  }
}

/**
 * Test 3: Verify log entries subcollection
 */
export async function testLogEntriesCollection(userId: string, sessionId: string) {
  try {
    
    const entriesPath = `logs/${userId}/sessions/${sessionId}/entries`;
    const entriesRef = collection(db, entriesPath);
    const q = query(entriesRef, orderBy('timestamp', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
    });
    
    return querySnapshot.size > 0;
  } catch (error) {
    console.error('❌ Error testing entries collection:', error);
    return false;
  }
}

/**
 * Test 4: Compare file logs vs Firestore logs count
 */
export async function compareLogCounts(userId: string, sessionId: string) {
  try {
    
    // Get Firestore counts
    const logDocPath = `logs/${userId}/sessions/${sessionId}`;
    const logDocRef = doc(db, logDocPath);
    const docSnap = await getDoc(logDocRef);
    
    if (!docSnap.exists()) {
      return;
    }
    
    const data = docSnap.data();
    const firestoreTotalLogs = 
      (data.applicationCount || 0) + 
      (data.errorCount || 0) + 
      (data.clientCount || 0);
    
    
    
    return {
      firestore: {
        application: data.applicationCount || 0,
        error: data.errorCount || 0,
        client: data.clientCount || 0,
        total: firestoreTotalLogs
      }
    };
  } catch (error) {
    console.error('❌ Error comparing log counts:', error);
  }
}

/**
 * Test 5: Verify log structure and data integrity
 */
export async function verifyLogStructure(userId: string, sessionId: string) {
  try {
    
    const logDocPath = `logs/${userId}/sessions/${sessionId}`;
    const logDocRef = doc(db, logDocPath);
    const docSnap = await getDoc(logDocRef);
    
    if (!docSnap.exists()) {
      return false;
    }
    
    const data = docSnap.data();
    
    // Check required fields
    const requiredFields = ['userId', 'sessionId', 'createdAt', 'lastUpdatedAt', 'environment'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      return false;
    }
    
    
    // Check log arrays
    const logTypes = ['applicationLogs', 'errorLogs', 'clientLogs', 'exceptionLogs', 'rejectionLogs'];
    const logArraysValid = logTypes.every(type => {
      const isArray = Array.isArray(data[type]);
      if (!isArray) {
      }
      return isArray;
    });
    
    if (logArraysValid) {
    }
    
    // Check timestamps
    if (data.createdAt && data.lastUpdatedAt) {
    }
    
    // Verify sessionId matches
    if (data.sessionId === sessionId) {
    } else {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error verifying log structure:', error);
    return false;
  }
}

/**
 * Run all tests
 */
export async function runAllTests(userId: string, sessionId: string) {
  
  const results = {
    sessionExists: false,
    entriesExist: false,
    structureValid: false
  };
  
  // Test 1: Session exists
  results.sessionExists = await testSessionLogsExist(userId, sessionId);
  
  if (!results.sessionExists) {
    return results;
  }
  
  // Test 2: Display logs
  await displayRecentLogs(userId, sessionId, 'application');
  
  // Test 3: Entries collection
  results.entriesExist = await testLogEntriesCollection(userId, sessionId);
  
  // Test 4: Compare counts
  await compareLogCounts(userId, sessionId);
  
  // Test 5: Verify structure
  results.structureValid = await verifyLogStructure(userId, sessionId);
  
  // Summary
  
  const allPassed = results.sessionExists && results.entriesExist && results.structureValid;
  
  return results;
}

/**
 * Simple API to test from browser console
 */
if (typeof window !== 'undefined') {
  (window as any).testFirestoreLogs = {
    testSessionLogsExist,
    displayRecentLogs,
    testLogEntriesCollection,
    compareLogCounts,
    verifyLogStructure,
    runAllTests
  };
  
}

export default {
  testSessionLogsExist,
  displayRecentLogs,
  testLogEntriesCollection,
  compareLogCounts,
  verifyLogStructure,
  runAllTests
};

