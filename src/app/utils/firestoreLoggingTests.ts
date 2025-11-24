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
    console.log('🧪 Testing: Session logs exist in Firestore');
    console.log(`   User ID: ${userId}`);
    console.log(`   Session ID: ${sessionId}`);
    
    const logDocPath = `logs/${userId}/sessions/${sessionId}`;
    const logDocRef = doc(db, logDocPath);
    const docSnap = await getDoc(logDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Session document exists!');
      console.log('   Log counts:');
      console.log(`   - Application: ${data.applicationCount || 0}`);
      console.log(`   - Errors: ${data.errorCount || 0}`);
      console.log(`   - Client: ${data.clientCount || 0}`);
      console.log(`   - Exceptions: ${data.exceptionCount || 0}`);
      console.log(`   - Rejections: ${data.rejectionCount || 0}`);
      console.log(`   Total logs: ${(data.applicationCount || 0) + (data.errorCount || 0) + (data.clientCount || 0)}`);
      return true;
    } else {
      console.log('❌ Session document does not exist');
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
    console.log(`🧪 Testing: Display recent ${logType} logs`);
    
    const logDocPath = `logs/${userId}/sessions/${sessionId}`;
    const logDocRef = doc(db, logDocPath);
    const docSnap = await getDoc(logDocRef);
    
    if (!docSnap.exists()) {
      console.log('❌ No logs found');
      return;
    }
    
    const data = docSnap.data();
    const logs = data[`${logType}Logs`] || [];
    
    console.log(`✅ Found ${logs.length} ${logType} logs`);
    console.log('\n📄 Recent logs:');
    
    // Display last 5 logs
    const recentLogs = logs.slice(-5);
    recentLogs.forEach((log: any, index: number) => {
      console.log(`\n[${index + 1}]`);
      console.log(`   Level: ${log.level}`);
      console.log(`   Message: ${log.message}`);
      console.log(`   Time: ${log.timestamp}`);
      if (log.endpoint) console.log(`   Endpoint: ${log.endpoint}`);
      if (log.method) console.log(`   Method: ${log.method}`);
      if (log.statusCode) console.log(`   Status: ${log.statusCode}`);
      if (log.duration) console.log(`   Duration: ${log.duration}`);
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
    console.log('🧪 Testing: Log entries subcollection');
    
    const entriesPath = `logs/${userId}/sessions/${sessionId}/entries`;
    const entriesRef = collection(db, entriesPath);
    const q = query(entriesRef, orderBy('timestamp', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    console.log(`✅ Found ${querySnapshot.size} entry batches`);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\n📦 Batch: ${doc.id}`);
      console.log(`   Type: ${data.logType}`);
      console.log(`   Count: ${data.count}`);
      console.log(`   Timestamp: ${data.timestamp?.toDate().toISOString()}`);
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
    console.log('🧪 Testing: Compare file logs vs Firestore logs');
    
    // Get Firestore counts
    const logDocPath = `logs/${userId}/sessions/${sessionId}`;
    const logDocRef = doc(db, logDocPath);
    const docSnap = await getDoc(logDocRef);
    
    if (!docSnap.exists()) {
      console.log('❌ No Firestore logs found');
      return;
    }
    
    const data = docSnap.data();
    const firestoreTotalLogs = 
      (data.applicationCount || 0) + 
      (data.errorCount || 0) + 
      (data.clientCount || 0);
    
    console.log('\n📊 Log Counts Comparison:');
    console.log(`   Firestore Application Logs: ${data.applicationCount || 0}`);
    console.log(`   Firestore Error Logs: ${data.errorCount || 0}`);
    console.log(`   Firestore Client Logs: ${data.clientCount || 0}`);
    console.log(`   Firestore Total: ${firestoreTotalLogs}`);
    
    console.log('\n💡 Note: File-based logs should have similar counts');
    console.log(`   Check: logs/${userId}/${sessionId}/application-{DATE}.log`);
    
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
    console.log('🧪 Testing: Log data structure and integrity');
    
    const logDocPath = `logs/${userId}/sessions/${sessionId}`;
    const logDocRef = doc(db, logDocPath);
    const docSnap = await getDoc(logDocRef);
    
    if (!docSnap.exists()) {
      console.log('❌ No logs found');
      return false;
    }
    
    const data = docSnap.data();
    
    // Check required fields
    const requiredFields = ['userId', 'sessionId', 'createdAt', 'lastUpdatedAt', 'environment'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    console.log('✅ All required fields present');
    
    // Check log arrays
    const logTypes = ['applicationLogs', 'errorLogs', 'clientLogs', 'exceptionLogs', 'rejectionLogs'];
    const logArraysValid = logTypes.every(type => {
      const isArray = Array.isArray(data[type]);
      if (!isArray) {
        console.log(`❌ ${type} is not an array`);
      }
      return isArray;
    });
    
    if (logArraysValid) {
      console.log('✅ All log arrays are valid');
    }
    
    // Check timestamps
    if (data.createdAt && data.lastUpdatedAt) {
      console.log('✅ Timestamps are present');
      console.log(`   Created: ${data.createdAt.toDate().toISOString()}`);
      console.log(`   Last Updated: ${data.lastUpdatedAt.toDate().toISOString()}`);
    }
    
    // Verify sessionId matches
    if (data.sessionId === sessionId) {
      console.log('✅ Session ID matches');
    } else {
      console.log(`❌ Session ID mismatch: ${data.sessionId} !== ${sessionId}`);
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
  console.log('\n🚀 Starting Firestore Logging Tests\n');
  console.log('=' .repeat(60));
  
  const results = {
    sessionExists: false,
    entriesExist: false,
    structureValid: false
  };
  
  // Test 1: Session exists
  results.sessionExists = await testSessionLogsExist(userId, sessionId);
  console.log('\n' + '=' .repeat(60));
  
  if (!results.sessionExists) {
    console.log('\n⚠️  Session does not exist. Other tests will be skipped.');
    return results;
  }
  
  // Test 2: Display logs
  await displayRecentLogs(userId, sessionId, 'application');
  console.log('\n' + '=' .repeat(60));
  
  // Test 3: Entries collection
  results.entriesExist = await testLogEntriesCollection(userId, sessionId);
  console.log('\n' + '=' .repeat(60));
  
  // Test 4: Compare counts
  await compareLogCounts(userId, sessionId);
  console.log('\n' + '=' .repeat(60));
  
  // Test 5: Verify structure
  results.structureValid = await verifyLogStructure(userId, sessionId);
  console.log('\n' + '=' .repeat(60));
  
  // Summary
  console.log('\n📋 Test Summary:');
  console.log(`   Session Exists: ${results.sessionExists ? '✅' : '❌'}`);
  console.log(`   Entries Exist: ${results.entriesExist ? '✅' : '❌'}`);
  console.log(`   Structure Valid: ${results.structureValid ? '✅' : '❌'}`);
  
  const allPassed = results.sessionExists && results.entriesExist && results.structureValid;
  console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}`);
  
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
  
  console.log('💡 Firestore logging tests loaded. Use:');
  console.log('   window.testFirestoreLogs.runAllTests(userId, sessionId)');
}

export default {
  testSessionLogsExist,
  displayRecentLogs,
  testLogEntriesCollection,
  compareLogCounts,
  verifyLogStructure,
  runAllTests
};

