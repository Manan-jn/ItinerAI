# Firestore Logging - Visual Architecture

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐              ┌──────────────────┐                │
│  │  Next.js Server  │              │  React Client    │                │
│  │   API Routes     │              │   Components     │                │
│  └────────┬─────────┘              └────────┬─────────┘                │
│           │                                   │                          │
│           │ Calls logging functions          │ ClientLogger             │
│           ▼                                   ▼                          │
│  ┌────────────────────────────────────────────────────────┐            │
│  │           LOGGING UTILITIES LAYER                       │            │
│  ├────────────────────────────────────────────────────────┤            │
│  │                                                          │            │
│  │  ┌──────────────┐    ┌──────────────┐   ┌────────────┐│            │
│  │  │  logger.ts   │    │clientLogger  │   │apiLogger   ││            │
│  │  │              │    │     .ts      │   │    .ts     ││            │
│  │  └──────┬───────┘    └──────┬───────┘   └─────┬──────┘│            │
│  │         │                    │                  │       │            │
│  │         └────────────────────┼──────────────────┘       │            │
│  │                              │                          │            │
│  │                              ▼                          │            │
│  │                  ┌──────────────────────┐              │            │
│  │                  │  firestoreLogger.ts  │              │            │
│  │                  │  - Batching Logic    │              │            │
│  │                  │  - 50 logs or 5s     │              │            │
│  │                  └──────────┬───────────┘              │            │
│  └─────────────────────────────┼──────────────────────────┘            │
│                                 │                                       │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  File System  │      │    Firestore     │      │   API Endpoint  │
│               │      │    Database      │      │  /api/logs/     │
│ logs/         │      │                  │      │    client       │
│  {userId}/    │      │ logs/            │      │                 │
│   {sessionId}/│      │  {userId}/       │      └─────────────────┘
│    *.log      │      │   sessions/      │              │
│               │      │    {sessionId}   │              │
└───────────────┘      └──────────────────┘              │
                                │                         │
                                └─────────────────────────┘
```

## 🔄 Data Flow Diagrams

### Server-Side Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. API REQUEST                                                   │
│    POST /api/session/create                                      │
│    { user_id: "abc123", session_id: "xyz789", ... }            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. HANDLER                                                       │
│    const logger = getLogger(user_id, session_id)                │
│    logAPIRequest(logger, endpoint, method, params)              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. LOGGING LAYER                                                 │
│    ┌──────────────────┐           ┌──────────────────┐         │
│    │ Winston Logger   │           │ Firestore Logger │         │
│    │ (File System)    │           │ (Cloud Database) │         │
│    └────────┬─────────┘           └────────┬─────────┘         │
└─────────────┼──────────────────────────────┼───────────────────┘
              │                              │
              ▼                              ▼
   ┌──────────────────┐          ┌──────────────────────┐
   │ IMMEDIATE WRITE  │          │   BATCHED WRITE      │
   │                  │          │                      │
   │ logs/abc123/     │          │ In-Memory Queue      │
   │  xyz789/         │          │ ┌──────────────────┐ │
   │   application-   │          │ │ Log 1            │ │
   │   2024-11-24.log │          │ │ Log 2            │ │
   │                  │          │ │ ...              │ │
   │ {                │          │ │ Log 50 (or 5s)   │ │
   │   "level": "info"│          │ └──────────────────┘ │
   │   "message": ... │          │         │            │
   │ }                │          │         ▼            │
   └──────────────────┘          │ ┌──────────────────┐ │
                                 │ │ BATCH FLUSH      │ │
                                 │ └──────────────────┘ │
                                 │         │            │
                                 └─────────┼────────────┘
                                           ▼
                            ┌──────────────────────────────┐
                            │ Firestore Document           │
                            │ logs/abc123/sessions/xyz789  │
                            │                              │
                            │ applicationLogs: [           │
                            │   { level: "info", ... },    │
                            │   { level: "info", ... }     │
                            │ ]                            │
                            │ applicationCount: 50         │
                            └──────────────────────────────┘
```

### Client-Side Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. BROWSER EVENT                                                 │
│    User clicks button / Page loads / API call                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. CLIENT LOGGER                                                 │
│    ClientLogger.logUserInteraction('click', 'Button', ...)      │
│    ClientLogger.logAPICall('/api/chat', 'POST', ...)            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. IN-MEMORY QUEUE                                               │
│    ┌────────────────────────────────────────────────┐           │
│    │ Log Queue (Max 100)                            │           │
│    │ ┌────────────────────────────────────────────┐ │           │
│    │ │ { level: "info", message: "...", ... }    │ │           │
│    │ │ { level: "info", message: "...", ... }    │ │           │
│    │ │ { level: "warn", message: "...", ... }    │ │           │
│    │ └────────────────────────────────────────────┘ │           │
│    └────────────────┬───────────────────────────────┘           │
└─────────────────────┼───────────────────────────────────────────┘
                      │
         ┌────────────┴───────────┐
         │                        │
         ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│ AUTO-FLUSH       │    │ MANUAL TRIGGER   │
│ (Every 30s)      │    │ (On action)      │
└────────┬─────────┘    └────────┬─────────┘
         │                        │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  TWO PATHS AVAILABLE   │
         └────────┬───────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌──────────────┐    ┌──────────────────┐
│ Direct Write │    │ Via API Route    │
│              │    │                  │
│ Firestore    │    │ POST /api/logs/  │
│ SDK in       │    │      client      │
│ Browser      │    │        │         │
└──────┬───────┘    └────────┬─────────┘
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ Firestore Document                  │
│ logs/{userId}/sessions/{sessionId}  │
│                                     │
│ clientLogs: [                       │
│   { level: "info", ... }            │
│ ]                                   │
│ clientCount: 10                     │
└─────────────────────────────────────┘
```

## 📂 Storage Structure Comparison

### File System Structure

```
logs/
├── app-2025-11-24.log                    (General logs, no user context)
├── app-error-2025-11-24.log              (General errors)
│
└── 060bb937-ae98-4e44-bb08-38f08768fcaf/     ← User ID
    ├── 7007956437322170368/                   ← Session ID
    │   ├── application-2025-11-24.log        (Application logs)
    │   ├── error-2025-11-24.log              (Error logs)
    │   ├── exceptions-2025-11-24.log         (Exceptions)
    │   └── rejections-2025-11-24.log         (Promise rejections)
    │
    ├── 1339050406369558528/                   ← Another Session
    │   ├── application-2025-11-24.log
    │   └── ...
    │
    └── 5259715356972285952/                   ← Another Session
        └── ...
```

### Firestore Database Structure

```
Firestore Database
│
└── logs (Collection)
    │
    └── 060bb937-ae98-4e44-bb08-38f08768fcaf (Document - User ID)
        │
        └── sessions (Subcollection)
            │
            ├── 7007956437322170368 (Document - Session ID) ◄── sessionId as doc ID
            │   │
            │   ├── Fields:
            │   │   ├── userId: "060bb937-ae98-4e44-bb08-38f08768fcaf"
            │   │   ├── sessionId: "7007956437322170368"
            │   │   ├── createdAt: Timestamp
            │   │   ├── lastUpdatedAt: Timestamp
            │   │   ├── environment: "development"
            │   │   ├── applicationLogs: Array[50]
            │   │   ├── errorLogs: Array[2]
            │   │   ├── clientLogs: Array[10]
            │   │   ├── applicationCount: 50
            │   │   ├── errorCount: 2
            │   │   └── clientCount: 10
            │   │
            │   └── entries (Subcollection - Detailed batches)
            │       ├── application_1732467441935 (Document)
            │       │   ├── logType: "application"
            │       │   ├── count: 50
            │       │   ├── timestamp: Timestamp
            │       │   └── logs: Array[50]
            │       │
            │       ├── error_1732467550123 (Document)
            │       │   └── ...
            │       │
            │       └── client_1732467680456 (Document)
            │           └── ...
            │
            ├── 1339050406369558528 (Document - Another Session)
            │   └── ...
            │
            └── 5259715356972285952 (Document - Another Session)
                └── ...
```

## 🔀 Log Entry Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOG ENTRY LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────┘

1. Creation
   ───────────────────────────────────────────────────
   Event occurs (API call, error, user action)
   │
   └─> Log entry created:
       {
         level: "info",
         message: "API Request",
         timestamp: "2025-11-24T00:17:21.935Z",
         metadata: { ... }
       }

2. Server-Side Processing
   ───────────────────────────────────────────────────
   ┌─> File Write (Immediate)
   │   └─> Winston → logs/{userId}/{sessionId}/application-{DATE}.log
   │
   └─> Firestore Write (Batched)
       └─> firestoreLogger.addLogToFirestore()
           │
           ├─> Add to in-memory batch
           │   Batch[userId_sessionId_application].push(log)
           │
           ├─> Check batch size
           │   if (batch.length >= 50) → FLUSH NOW
           │   else → Schedule timer (5s)
           │
           └─> Flush batch
               ├─> Main document: logs/{userId}/sessions/{sessionId}
               │   └─> arrayUnion to applicationLogs[]
               │       Update applicationCount
               │
               └─> Entry document: logs/{userId}/sessions/{sessionId}/entries/{type}_{timestamp}
                   └─> Store complete batch

3. Client-Side Processing
   ───────────────────────────────────────────────────
   ClientLogger.log()
   │
   ├─> Add to in-memory queue (max 100)
   │
   ├─> Auto-flush timer (30s)
   │   └─> sendLogsToFirestore()
   │       │
   │       ├─> Direct: Firestore SDK in browser
   │       │   └─> logs/{userId}/sessions/{sessionId}
   │       │
   │       └─> Fallback: POST /api/logs/client
   │           └─> Server → Firestore
   │
   └─> Manual triggers
       ├─> Immediate events (errors)
       └─> Page unload

4. Storage & Retrieval
   ───────────────────────────────────────────────────
   Stored in:
   ├─> Files (permanent, dated)
   │   └─> Access: File system, log aggregators
   │
   └─> Firestore (real-time, queryable)
       └─> Access: 
           ├─> Direct Firestore queries
           ├─> GET /api/logs/client?userId=...&sessionId=...
           └─> Test utilities: testFirestoreLogs.*

5. Analysis & Monitoring
   ───────────────────────────────────────────────────
   Files:
   ├─> tail -f logs/{userId}/{sessionId}/application-*.log
   └─> grep "error" logs/{userId}/{sessionId}/*.log
   
   Firestore:
   ├─> Query by date, type, user
   ├─> Aggregate counts
   ├─> Real-time dashboards
   └─> Error rate alerts
```

## 🎯 Batching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     BATCHING MECHANISM                           │
└─────────────────────────────────────────────────────────────────┘

In-Memory Batch Queue
┌───────────────────────────────────────────────────────────────┐
│ Key: userId_sessionId_logType                                  │
│                                                                 │
│ Batch Object:                                                   │
│ {                                                               │
│   logs: [],            ← Array of log entries                  │
│   timer: null          ← Timeout handle                        │
│ }                                                               │
└───────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Trigger 1:       │ │ Trigger 2:       │ │ Trigger 3:       │
│ SIZE LIMIT       │ │ TIME LIMIT       │ │ MANUAL FLUSH     │
│                  │ │                  │ │                  │
│ if (logs.length  │ │ setTimeout(() => │ │ On session end   │
│    >= 50)        │ │   flushBatch(),  │ │ On app shutdown  │
│   flushBatch()   │ │   5000)          │ │ User logout      │
└──────────────────┘ └──────────────────┘ └──────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │   FLUSH BATCH    │
                   └────────┬─────────┘
                            │
                            ▼
         ┌──────────────────────────────────────┐
         │ 1. Copy logs from batch              │
         │ 2. Clear batch                       │
         │ 3. Cancel timer                      │
         │ 4. Write to Firestore                │
         │    ├─> Main document (arrayUnion)    │
         │    └─> Entry document (full batch)   │
         │ 5. Handle errors (re-add to batch)   │
         └──────────────────────────────────────┘
```

---

**Visual Guide Version:** 1.0.0  
**Created:** November 24, 2025  
**Last Updated:** November 24, 2025

