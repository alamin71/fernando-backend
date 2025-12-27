# 📺 Complete Stream Platform - Full Documentation

**Last Updated:** December 28, 2025  
**Version:** 1.0.0

> What changed: Added ingest-config endpoint, liked streams endpoint, chat endpoints, VOD watch route, and clarified auth scopes to match current router.

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication](#authentication)
4. [Complete API Reference](#complete-api-reference)
5. [Frontend Integration Guide](#frontend-integration-guide)
6. [Step-by-Step Workflows](#step-by-step-workflows)
7. [Error Handling](#error-handling)
8. [Testing Guide](#testing-guide)
9. [Deployment Checklist](#deployment-checklist)

---

## Overview

### What is This?

A complete live streaming platform where:

- **Creators** can broadcast live streams
- **Viewers** can watch, like, and interact
- **Recordings** are automatically saved to AWS S3
- **Analytics** track stream performance

### Tech Stack

- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB
- **Authentication:** JWT
- **File Storage:** AWS S3
- **Validation:** Zod

### Key Features

✅ Go Live with settings (title, description, privacy, thumbnail)  
✅ Real-time viewer count tracking  
✅ Like/Unlike streams  
✅ Automatic recording to S3  
✅ Analytics dashboard  
✅ Discover live & recorded streams

---

## Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Web/Mobile)                   │
└────┬──────────────────────────────────────────────────────┬─┘
     │                                                        │
     │ 1. Go Live (POST /go-live)                           │
     ↓                                                        │
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (API Server)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Route Handler                                        │  │
│  │ ├─ validate input (Zod)                            │  │
│  │ ├─ check auth                                       │  │
│  │ ├─ call service layer                              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Service Layer                                        │  │
│  │ ├─ create stream document                           │  │
│  │ ├─ generate stream key                              │  │
│  │ ├─ create analytics doc                             │  │
│  │ ├─ update creator stats                             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ MongoDB                                              │  │
│  │ ├─ Stream (LIVE status)                             │  │
│  │ ├─ StreamAnalytics (empty initial)                  │  │
│  │ └─ User (stats updated)                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
     │                                                        │
     │ 2. Start WebRTC broadcast with streamKey             │
     ↓                                                        │
┌─────────────────────────────────────────────────────────────┐
│  STREAMING SERVER (MediaSoup/LiveKit/AWS IVS)              │
│  ├─ Receive broadcast from creator                        │
│  ├─ Auto-record to S3                                     │
│  └─ Distribute to viewers                                 │
└────┬──────────────────────────────────────────────────────┬─┘
     │                                                        │
     │ 3. Viewers join (POST /join)                        │
     ↓                                                        │
┌─────────────────────────────────────────────────────────────┐
│  VIEWER EXPERIENCE                                         │
│  ├─ Browse live streams (/currently-live)               │
│  ├─ Join stream (/join)                                 │
│  ├─ Like stream (/like)                                 │
│  ├─ Watch recording (/watch)                            │
│  └─ Leave stream (/leave)                               │
└─────────────────────────────────────────────────────────────┘
     │
     │ 4. Creator ends stream (PATCH /stop-live)
     ↓
┌─────────────────────────────────────────────────────────────┐
│  RECORDING SAVED                                           │
│  ├─ Streaming server uploads to S3                        │
│  ├─ Recording URL saved in database                       │
│  └─ Available on /recordings endpoint                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication

### JWT Token

**Obtaining a Token:**

```bash
POST /api/v1/auth/login
{
  "email": "creator@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "65abc123...",
      "email": "creator@example.com",
      "role": "creator"
    }
  }
}
```

### Using Token in Requests

```javascript
// Add to Authorization header
headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Or in Postman
Postman → Authorization → Type: Bearer Token
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Roles

- **creator** - Can go live, upload recordings, view analytics
- **admin** - Full access to platform management

---

## Complete API Reference

### Base URL

```
http://localhost:5000/api/v1/streams
```

### 1️⃣ START LIVE STREAM (Go Live)

**Endpoint:**

```
POST /go-live
```

**Purpose:** Creator শুরু করে live streaming

**Authentication:** ✅ Required (Creator)

**Content-Type:** `multipart/form-data`

**Request Body:**

```json
{
  "title": "My First Live Stream",                    // Required (3-100 chars)
  "description": "Welcome to my channel!",             // Optional (max 500 chars)
  "categoryId": "65abc123...",                        // Optional
  "thumbnail": <file>,                                // Optional (image file)
  "isPublic": true,                                   // Optional (default: true)
  "whoCanMessage": "everyone",                        // Optional: "everyone" | "followers"
  "isMature": false                                   // Optional (default: false)
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Stream started successfully",
  "data": {
    "streamId": "65d5f8c9e1a2b3c4d5e6f7g8",
    "streamKey": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "title": "My First Live Stream",
    "description": "Welcome to my channel!",
    "categoryId": "65abc123...",
    "thumbnail": "https://your-bucket.s3.amazonaws.com/stream-thumbnails/...",
    "status": "LIVE",
    "isPublic": true,
    "whoCanMessage": "everyone",
    "isMature": false,
    "startedAt": "2025-12-16T10:30:00.000Z"
  }
}
```

**What Happens Inside:**

```
1. ✅ Validate input with Zod
2. ✅ Check if creator is active
3. ✅ Check if creator already has active stream
4. ✅ Upload thumbnail to S3 (if provided)
5. ✅ Create Stream document with status="LIVE"
6. ✅ Generate unique streamKey for broadcasting
7. ✅ Create StreamAnalytics document
8. ✅ Increment creator's totalStreams stat
9. ✅ Return streamId & streamKey to frontend
```

**Frontend Implementation:**

```javascript
// 1. Collect form data
const formData = new FormData();
formData.append("title", "My Gaming Stream");
formData.append("description", "Valorant gameplay");
formData.append("isPublic", "true");
formData.append("whoCanMessage", "everyone");
formData.append("isMature", "false");
formData.append("categoryId", "65abc123...");

// 2. Add thumbnail if user selected one
if (thumbnailFile) {
  formData.append("thumbnail", thumbnailFile);
}

// 3. Send to backend
const response = await fetch("http://localhost:5000/api/v1/streams/go-live", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();

if (result.success) {
  // 4. Use streamKey to initialize broadcasting
  const { streamId, streamKey } = result.data;

  // 5. Start WebRTC broadcast (using MediaSoup/LiveKit)
  startBroadcast(streamKey);

  // 6. Navigate to live page
  window.location.href = `/streaming/${streamId}`;
}
```

**Error Responses:**

```json
// 400 - Validation Error
{
  "success": false,
  "statusCode": 400,
  "message": "Title must be at least 3 characters"
}

// 409 - Already Streaming
{
  "success": false,
  "statusCode": 409,
  "message": "You already have an active live stream"
}
```

---

### 2️⃣ STOP LIVE STREAM

**Endpoint:**

```
PATCH /:id/stop-live
```

**Purpose:** Creator stream বন্ধ করা

**Authentication:** ✅ Required (Creator)

**URL Params:**

- `id` - Stream ID (from go-live response)

**Request Body (Optional):**

```json
{
  "recordingUrl": "https://your-bucket.s3.amazonaws.com/stream-recordings/...",
  "playbackUrl": "https://cdn.example.com/playback.m3u8",
  "durationSeconds": 3600
}
```

_Note: If durationSeconds not provided, calculated from start/end time_

**Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stream ended successfully",
  "data": {
    "streamId": "65d5f8c9e1a2b3c4d5e6f7g8",
    "status": "OFFLINE",
    "endedAt": "2025-12-16T11:30:00.000Z"
  }
}
```

**What Happens Inside:**

```
1. ✅ Find stream by ID
2. ✅ Verify creator owns this stream
3. ✅ Check stream is currently LIVE
4. ✅ Update status to OFFLINE
5. ✅ Set endedAt timestamp
6. ✅ Save recording URLs (if provided)
7. ✅ Calculate duration if not provided
8. ✅ Update StreamAnalytics with final data
```

**Frontend Implementation:**

```javascript
const stopStream = async (streamId) => {
  // 1. Stop WebRTC broadcast
  stopBroadcast();

  // 2. Wait for recording to finish uploading
  const recordingUrl = await waitForRecordingUpload();

  // 3. Send stop request
  const response = await fetch(
    `http://localhost:5000/api/v1/streams/${streamId}/stop-live`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recordingUrl: recordingUrl,
        durationSeconds: calculateDuration(),
      }),
    }
  );

  const result = await response.json();

  if (result.success) {
    // 4. Show confirmation
    alert("Stream ended successfully!");

    // 5. Navigate to channel page
    window.location.href = "/channel";
  }
};
```

---

### 3️⃣ UPDATE STREAM SETTINGS

**Endpoint:**

```
PATCH /:id/settings
```

**Purpose:** Live stream চলাকালীন settings update করা

**Authentication:** ✅ Required (Creator)

**Content-Type:** `multipart/form-data` or `application/json`

**Request Body (All Optional):**

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "thumbnail": <file>,
  "isPublic": false,
  "whoCanMessage": "followers",
  "isMature": true
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stream updated successfully",
  "data": {
    "_id": "65d5f8c9e1a2b3c4d5e6f7g8",
    "title": "Updated Title",
    "description": "Updated description",
    "isPublic": false,
    "whoCanMessage": "followers",
    "isMature": true,
    "creatorId": {
      "username": "john_doe",
      "channelName": "John's Channel"
    }
  }
}
```

---

### 4️⃣ GET LIVE STREAMS (Discover)

**Endpoint:**

```
GET /currently-live
```

**Purpose:** এখন লাইভ যেসব streams আছে তার list

**Authentication:** ❌ Not Required

**Query Parameters:**

```
?page=1
&limit=10
&categoryId=65abc123...        (optional)
&search=gaming                  (optional - title/description)
```

**Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Live streams retrieved successfully",
  "data": [
    {
      "_id": "65d5f8c9e1a2b3c4d5e6f7g8",
      "title": "Epic Gaming Session",
      "description": "Playing Valorant",
      "thumbnail": "https://...",
      "status": "LIVE",
      "isPublic": true,
      "currentViewers": 150,
      "peakViewers": 200,
      "totalViews": 1500,
      "totalLikes": 89,
      "startedAt": "2025-12-16T10:00:00.000Z",
      "creatorId": {
        "_id": "65abc123...",
        "username": "john_doe",
        "channelName": "John's Channel",
        "image": "https://...",
        "creatorStats": {
          "totalFollowers": 1500,
          "totalStreams": 25
        }
      },
      "categoryId": {
        "_id": "65cat123...",
        "name": "Gaming"
      }
    }
    // ... more streams
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPage": 5
  }
}
```

**Frontend Implementation:**

```javascript
// Fetch live streams
const fetchLiveStreams = async (page = 1) => {
  const response = await fetch(
    `http://localhost:5000/api/v1/streams/currently-live?page=${page}&limit=12&search=${searchTerm}`,
    {
      method: "GET",
    }
  );

  const result = await response.json();

  if (result.success) {
    // Display streams in grid
    displayStreams(result.data);

    // Update pagination
    updatePagination(result.meta);
  }
};

// Display stream card
const displayStreamCard = (stream) => {
  return `
    <div class="stream-card" onclick="openStream('${stream._id}')">
      <img src="${stream.thumbnail}" alt="${stream.title}">
      <div class="stream-badge">LIVE</div>
      <div class="stream-viewers">${stream.currentViewers} watching</div>
      <h3>${stream.title}</h3>
      <p>${stream.creatorId.channelName}</p>
    </div>
  `;
};
```

---

### 5️⃣ GET STREAM DETAILS

**Endpoint:**

```
GET /:id
```

**Purpose:** একটা specific stream এর সম্পূর্ণ information

**Authentication:** ❌ Not Required

**URL Params:**

- `id` - Stream ID

**Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stream retrieved successfully",
  "data": {
    "stream": {
      "_id": "65d5f8c9e1a2b3c4d5e6f7g8",
      "title": "My Live Stream",
      "description": "Stream description",
      "thumbnail": "https://...",
      "status": "LIVE",
      "isPublic": true,
      "whoCanMessage": "everyone",
      "isMature": false,
      "currentViewers": 150,
      "peakViewers": 200,
      "totalViews": 1500,
      "totalLikes": 89,
      "totalComments": 45,
      "startedAt": "2025-12-16T10:00:00.000Z",
      "creatorId": {
        "_id": "65abc123...",
        "username": "john_doe",
        "channelName": "John's Channel",
        "image": "https://...",
        "creatorStats": {
          "totalFollowers": 1500,
          "totalStreams": 25
        }
      }
    },
    "analytics": {
      "_id": "65ana123...",
      "streamId": "65d5f8c9e1a2b3c4d5e6f7g8",
      "viewCount": 1500,
      "uniqueViewers": 800,
      "peakConcurrentViewers": 200,
      "watchDuration": 45000,
      "likes": 89,
      "comments": 45,
      "shares": 12
    }
  }
}
```

---

### 6️⃣ GET MY STREAMS (Creator's Dashboard)

**Endpoint:**

```
GET /my-streams
```

**Purpose:** Creator তার সব streams দেখা

**Authentication:** ✅ Required (Creator)

**Query Parameters:**

```
?page=1
&limit=10
&status=LIVE              (optional: LIVE | OFFLINE | SCHEDULED)
```

**Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Creator streams retrieved successfully",
  "data": [
    {
      "_id": "65d5f8c9e1a2b3c4d5e6f7g8",
      "title": "My Gaming Stream",
      "status": "LIVE",
      "currentViewers": 150,
      "totalViews": 1500,
      "totalLikes": 89,
      "durationSeconds": 3600,
      "startedAt": "2025-12-16T10:00:00.000Z",
      "recordingUrl": "https://...",
      "thumbnail": "https://..."
    },
    {
      "_id": "65d5f8c9e1a2b3c4d5e6f7g8",
      "title": "Past Stream",
      "status": "OFFLINE",
      "totalViews": 1500,
      "totalLikes": 89,
      "durationSeconds": 3600,
      "startedAt": "2025-12-15T10:00:00.000Z",
      "endedAt": "2025-12-15T11:00:00.000Z",
      "recordingUrl": "https://..."
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPage": 3
  }
}
```

**Frontend Implementation:**

```javascript
// Creator dashboard - show my streams
const loadMyStreams = async () => {
  const response = await fetch(
    "http://localhost:5000/api/v1/streams/my-streams?status=OFFLINE",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();

  if (result.success) {
    // Display in dashboard
    result.data.forEach((stream) => {
      if (stream.status === "LIVE") {
        // Show "End Stream" button
      } else {
        // Show "View Recording" button
        // Show analytics button
      }
    });
  }
};
```

---

### 7️⃣ JOIN STREAM (Increment Viewers)

**Endpoint:**

```
POST /:id/join
```

**Purpose:** Viewer stream এ join করছে

**Authentication:** ❌ Not Required (optional for tracking)

**Request Body:** Empty

**Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "View count updated",
  "data": {
    "currentViewers": 151,
    "totalViews": 1501
  }
}
```

**Frontend Implementation:**

```javascript
// When user opens stream viewer
const openStreamViewer = async (streamId) => {
  // 1. Load stream details
  const streamResponse = await fetch(
    `http://localhost:5000/api/v1/streams/${streamId}`
  );
  const streamData = await streamResponse.json();

  // 2. Join stream (increment viewers)
  const joinResponse = await fetch(
    `http://localhost:5000/api/v1/streams/${streamId}/join`,
    { method: "POST" }
  );
  const joinData = await joinResponse.json();

  // 3. Show viewer count
  updateViewerCount(joinData.data.currentViewers);

  // 4. Initialize video player
  initializePlayer(streamData.data.stream);

  // 5. When user closes/navigates away
  window.addEventListener("beforeunload", () => {
    leaveStream(streamId);
  });
};
```

---

### 8️⃣ LEAVE STREAM (Decrement Viewers)

**Endpoint:**

```
DELETE /:id/leave
```

**Purpose:** Viewer stream ছেড়ে যাচ্ছে

**Authentication:** ❌ Not Required

**Request Body:** Empty

**Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Viewer count updated",
  "data": {
    "success": true
  }
}
```

**Frontend Implementation:**

```javascript
const leaveStream = async (streamId) => {
  await fetch(`http://localhost:5000/api/v1/streams/${streamId}/leave`, {
    method: "DELETE",
  });

  // Cleanup
  closeVideoPlayer();
};
```

---

### 9️⃣ LIKE/UNLIKE STREAM

**Endpoint:**

```
POST /:id/like
```

**Purpose:** Stream like/unlike করা (toggle)

**Authentication:** ✅ Required (Creator)

**Request Body:** Empty

**Response (200 OK):**

```json
// First click (Like)
{
  "success": true,
  "statusCode": 200,
  "message": "Stream liked",
  "data": {
    "liked": true,
    "totalLikes": 90
  }
}

// Second click (Unlike)
{
  "success": true,
  "statusCode": 200,
  "message": "Stream unliked",
  "data": {
    "liked": false,
    "totalLikes": 89
  }
}
```

**Frontend Implementation:**

```javascript
const toggleLike = async (streamId) => {
  const response = await fetch(
    `http://localhost:5000/api/v1/streams/${streamId}/like`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();

  if (result.success) {
    const { liked, totalLikes } = result.data;

    // Update UI
    const likeBtn = document.getElementById("like-btn");
    if (liked) {
      likeBtn.classList.add("active"); // Red heart
    } else {
      likeBtn.classList.remove("active"); // Gray heart
    }

    // Update count
    document.getElementById("like-count").textContent = totalLikes;
  }
};
```

---

### 🔟 GET STREAM ANALYTICS

**Endpoint:**

```
GET /:id/analytics
```

**Purpose:** Creator তার stream এর detailed stats দেখা

**Authentication:** ✅ Required (Creator - must own)

**Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stream analytics retrieved successfully",
  "data": {
    "streamId": "65d5f8c9e1a2b3c4d5e6f7g8",
    "title": "My Gaming Stream",
    "status": "OFFLINE",
    "startedAt": "2025-12-16T10:00:00.000Z",
    "endedAt": "2025-12-16T11:00:00.000Z",
    "durationSeconds": 3600,
    "currentViewers": 0,
    "peakViewers": 200,
    "totalViews": 1500,
    "totalLikes": 89,
    "totalComments": 45,
    "analytics": {
      "_id": "65ana123...",
      "viewCount": 1500,
      "uniqueViewers": 800,
      "peakConcurrentViewers": 200,
      "watchDuration": 45000,
      "likes": 89,
      "comments": 45,
      "shares": 12,
      "avgWatchTime": 56.25
    }
  }
}
```

**Frontend Implementation:**

```javascript
const loadAnalytics = async (streamId) => {
  const response = await fetch(
    `http://localhost:5000/api/v1/streams/${streamId}/analytics`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();

  if (result.success) {
    const analytics = result.data;

    // Display charts
    displayViewersChart(analytics);
    displayEngagementMetrics(analytics);
  }
};

const displayEngagementMetrics = (analytics) => {
  return `
    <div class="analytics-dashboard">
      <div class="metric">
        <span class="label">Total Views</span>
        <span class="value">${analytics.totalViews}</span>
      </div>
      <div class="metric">
        <span class="label">Peak Viewers</span>
        <span class="value">${analytics.peakViewers}</span>
      </div>
      <div class="metric">
        <span class="label">Likes</span>
        <span class="value">${analytics.totalLikes}</span>
      </div>
      <div class="metric">
        <span class="label">Avg Watch Time</span>
        <span class="value">${analytics.analytics.avgWatchTime}m</span>
      </div>
    </div>
  `;
};
```

---

### 1️⃣1️⃣ GET RECORDED STREAMS

**Endpoint:**

```
GET /recordings
```

**Purpose:** যেসব stream শেষ হয়েছে এবং recording আছে

**Authentication:** ❌ Not Required

**Query Parameters:**

```
?page=1
&limit=10
&creatorId=65abc123...      (optional)
&categoryId=65cat123...      (optional)
&search=gaming              (optional)
```

**Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Recorded streams retrieved successfully",
  "data": [
    {
      "_id": "65d5f8c9e1a2b3c4d5e6f7g8",
      "title": "My Gaming Stream",
      "description": "Valorant gameplay",
      "thumbnail": "https://...",
      "status": "OFFLINE",
      "recordingUrl": "https://your-bucket.s3.amazonaws.com/stream-recordings/.../recording.mp4",
      "playbackUrl": "https://cdn.example.com/playback.m3u8",
      "durationSeconds": 3600,
      "totalViews": 1500,
      "totalLikes": 89,
      "startedAt": "2025-12-16T10:00:00.000Z",
      "endedAt": "2025-12-16T11:00:00.000Z",
      "creatorId": {
        "username": "john_doe",
        "channelName": "John's Channel"
      }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPage": 5
  }
}
```

---

### 1️⃣2️⃣ GET STREAM RECORDING (Watch Video)

**Endpoint:**

```
GET /:id/watch
```

**Purpose:** Recorded stream এর video URL পাওয়া

**Authentication:** ❌ Not Required

**Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stream recording retrieved successfully",
  "data": {
    "streamId": "65d5f8c9e1a2b3c4d5e6f7g8",
    "title": "My Gaming Stream",
    "description": "Valorant gameplay",
    "thumbnail": "https://...",
    "recordingUrl": "https://your-bucket.s3.amazonaws.com/stream-recordings/.../recording.mp4",
    "playbackUrl": "https://cdn.example.com/playback.m3u8",
    "durationSeconds": 3600,
    "totalViews": 1500,
    "totalLikes": 89,
    "startedAt": "2025-12-16T10:00:00.000Z",
    "endedAt": "2025-12-16T11:00:00.000Z",
    "creatorId": {
      "username": "john_doe",
      "channelName": "John's Channel"
    }
  }
}
```

**Frontend Implementation:**

```javascript
const loadRecording = async (streamId) => {
  const response = await fetch(
    `http://localhost:5000/api/v1/streams/${streamId}/watch`
  );

  const result = await response.json();

  if (result.success) {
    const { recordingUrl, title, durationSeconds } = result.data;

    // Initialize video player
    const video = document.getElementById("video-player");
    video.src = recordingUrl;
    video.load();

    // Show title
    document.getElementById("stream-title").textContent = title;
  }
};
```

---

### 1️⃣3️⃣ UPLOAD STREAM RECORDING

**Endpoint:**

```
POST /:id/upload-recording
```

**Purpose:** Recording file S3 এ upload করা

**Authentication:** ✅ Required (Creator)

**Content-Type:** `multipart/form-data`

**Request Body:**

```
recording: <video file> (mp4, webm, mov)
```

**Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Recording uploaded successfully",
  "data": {
    "streamId": "65d5f8c9e1a2b3c4d5e6f7g8",
    "status": "OFFLINE",
    "recordingUrl": "https://your-bucket.s3.amazonaws.com/stream-recordings/65d5f8c9e1a2b3c4d5e6f7g8/1734350400000-recording.mp4",
    "recordingId": "stream-recordings/65d5f8c9e1a2b3c4d5e6f7g8/1734350400000-recording.mp4",
    "endedAt": "2025-12-16T11:30:00.000Z"
  }
}
```

**Frontend Implementation:**

```javascript
const uploadRecording = async (streamId, videoFile) => {
  const formData = new FormData();
  formData.append("recording", videoFile);

  const response = await fetch(
    `http://localhost:5000/api/v1/streams/${streamId}/upload-recording`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const result = await response.json();

  if (result.success) {
    console.log("Recording uploaded:", result.data.recordingUrl);

    // Show success message
    alert("Recording uploaded successfully!");

    // Update stream details
    refreshStreamData(streamId);
  }
};
```

---

## Frontend Integration Guide

### Setup

#### 1. Install Required Libraries

```bash
npm install axios dotenv
```

#### 2. Create API Client

**api/client.ts:**

```typescript
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
```

#### 3. Create Stream API Service

**api/streamService.ts:**

```typescript
import client from "./client";

export const streamAPI = {
  // Go Live
  goLive: async (formData: FormData) => {
    return client.post("/streams/go-live", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Stop Stream
  stopStream: async (streamId: string, data?: any) => {
    return client.patch(`/streams/${streamId}/stop-live`, data);
  },

  // Get Live Streams
  getLiveStreams: async (page = 1, limit = 12, filters = {}) => {
    return client.get("/streams/currently-live", {
      params: { page, limit, ...filters },
    });
  },

  // Get Stream Details
  getStreamById: async (streamId: string) => {
    return client.get(`/streams/${streamId}`);
  },

  // Get My Streams
  getMyStreams: async (page = 1, limit = 10, status?: string) => {
    return client.get("/streams/my-streams", {
      params: { page, limit, ...(status && { status }) },
    });
  },

  // Join Stream
  joinStream: async (streamId: string) => {
    return client.post(`/streams/${streamId}/join`);
  },

  // Leave Stream
  leaveStream: async (streamId: string) => {
    return client.delete(`/streams/${streamId}/leave`);
  },

  // Like Stream
  likeStream: async (streamId: string) => {
    return client.post(`/streams/${streamId}/like`);
  },

  // Get Analytics
  getAnalytics: async (streamId: string) => {
    return client.get(`/streams/${streamId}/analytics`);
  },

  // Get Recordings
  getRecordings: async (page = 1, limit = 12, filters = {}) => {
    return client.get("/streams/recordings", {
      params: { page, limit, ...filters },
    });
  },

  // Get Recording
  getRecording: async (streamId: string) => {
    return client.get(`/streams/${streamId}/watch`);
  },

  // Upload Recording
  uploadRecording: async (streamId: string, file: File) => {
    const formData = new FormData();
    formData.append("recording", file);
    return client.post(`/streams/${streamId}/upload-recording`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
```

---

### Page Components

#### 1. Go Live Modal

**components/GoLiveModal.tsx:**

```typescript
import React, { useState } from "react";
import { streamAPI } from "../api/streamService";

export const GoLiveModal = ({ onSuccess }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    isPublic: true,
    whoCanMessage: "everyone",
    isMature: false,
    thumbnail: null,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("categoryId", form.categoryId);
      formData.append("isPublic", String(form.isPublic));
      formData.append("whoCanMessage", form.whoCanMessage);
      formData.append("isMature", String(form.isMature));

      if (form.thumbnail) {
        formData.append("thumbnail", form.thumbnail);
      }

      // Call API
      const response = await streamAPI.goLive(formData);

      if (response.data.success) {
        const { streamId, streamKey } = response.data.data;

        // Start broadcast with streamKey
        onSuccess({ streamId, streamKey });
      }
    } catch (error) {
      console.error("Go live error:", error);
      alert("Failed to go live");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="go-live-form">
      <input
        type="text"
        placeholder="Stream Title (required)"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
        minLength={3}
        maxLength={100}
      />

      <textarea
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        maxLength={500}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setForm({ ...form, thumbnail: e.target.files?.[0] })}
      />

      <label>
        <input
          type="checkbox"
          checked={form.isPublic}
          onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
        />
        Public Stream
      </label>

      <label>
        Who can message?
        <select
          value={form.whoCanMessage}
          onChange={(e) => setForm({ ...form, whoCanMessage: e.target.value })}
        >
          <option value="everyone">Everyone</option>
          <option value="followers">Followers Only</option>
        </select>
      </label>

      <label>
        <input
          type="checkbox"
          checked={form.isMature}
          onChange={(e) => setForm({ ...form, isMature: e.target.checked })}
        />
        Mature Content
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Going Live..." : "Go Live"}
      </button>
    </form>
  );
};
```

#### 2. Live Streams List

**pages/DiscoverPage.tsx:**

```typescript
import React, { useEffect, useState } from "react";
import { streamAPI } from "../api/streamService";

export const DiscoverPage = () => {
  const [streams, setStreams] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchStreams();
  }, [page, search]);

  const fetchStreams = async () => {
    try {
      const response = await streamAPI.getLiveStreams(page, 12, { search });

      if (response.data.success) {
        setStreams(response.data.data);
        setMeta(response.data.meta);
      }
    } catch (error) {
      console.error("Failed to fetch streams:", error);
    }
  };

  return (
    <div className="discover-page">
      <h1>Live Streams</h1>

      <input
        type="text"
        placeholder="Search streams..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      <div className="streams-grid">
        {streams.map((stream) => (
          <div
            key={stream._id}
            className="stream-card"
            onClick={() => (window.location.href = `/stream/${stream._id}`)}
          >
            <img src={stream.thumbnail} alt={stream.title} />
            <div className="live-badge">LIVE</div>
            <div className="viewers">{stream.currentViewers} watching</div>
            <h3>{stream.title}</h3>
            <p>{stream.creatorId.channelName}</p>
          </div>
        ))}
      </div>

      {meta && (
        <div className="pagination">
          {Array.from({ length: meta.totalPage }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={page === i + 1 ? "active" : ""}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### 3. Stream Viewer

**pages/StreamViewerPage.tsx:**

```typescript
import React, { useEffect, useState } from "react";
import { streamAPI } from "../api/streamService";

export const StreamViewerPage = ({ streamId }) => {
  const [stream, setStream] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Load stream
    loadStream();

    // Join stream
    joinStream();

    // Cleanup: leave on unmount
    return () => {
      leaveStream();
    };
  }, [streamId]);

  const loadStream = async () => {
    try {
      const response = await streamAPI.getStreamById(streamId);
      setStream(response.data.data.stream);
    } catch (error) {
      console.error("Failed to load stream:", error);
    }
  };

  const joinStream = async () => {
    try {
      await streamAPI.joinStream(streamId);
    } catch (error) {
      console.error("Failed to join stream:", error);
    }
  };

  const leaveStream = async () => {
    try {
      await streamAPI.leaveStream(streamId);
    } catch (error) {
      console.error("Failed to leave stream:", error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await streamAPI.likeStream(streamId);
      setIsLiked(response.data.data.liked);
    } catch (error) {
      console.error("Failed to like:", error);
    }
  };

  if (!stream) return <div>Loading...</div>;

  return (
    <div className="stream-viewer">
      <div className="video-container">
        <video id="video-player" controls autoPlay style={{ width: "100%" }} />
      </div>

      <div className="stream-info">
        <h1>{stream.title}</h1>
        <p>{stream.description}</p>

        <div className="stats">
          <span>👁️ {stream.currentViewers} watching</span>
          <span>❤️ {stream.totalLikes} likes</span>
        </div>

        <div className="creator">
          <img src={stream.creatorId.image} alt={stream.creatorId.username} />
          <div>
            <h3>{stream.creatorId.channelName}</h3>
            <p>{stream.creatorId.creatorStats.totalFollowers} followers</p>
          </div>
        </div>

        <button onClick={handleLike} className={isLiked ? "liked" : ""}>
          ❤️ {isLiked ? "Unlike" : "Like"}
        </button>
      </div>
    </div>
  );
};
```

#### 4. Creator Dashboard

**pages/CreatorDashboard.tsx:**

```typescript
import React, { useEffect, useState } from "react";
import { streamAPI } from "../api/streamService";

export const CreatorDashboard = () => {
  const [streams, setStreams] = useState([]);
  const [selectedStream, setSelectedStream] = useState(null);

  useEffect(() => {
    loadMyStreams();
  }, []);

  const loadMyStreams = async () => {
    try {
      const response = await streamAPI.getMyStreams();
      setStreams(response.data.data);
    } catch (error) {
      console.error("Failed to load streams:", error);
    }
  };

  const handleViewAnalytics = async (streamId) => {
    try {
      const response = await streamAPI.getAnalytics(streamId);
      setSelectedStream(response.data.data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  return (
    <div className="creator-dashboard">
      <h1>My Streams</h1>

      <div className="streams-list">
        {streams.map((stream) => (
          <div key={stream._id} className="stream-item">
            <img src={stream.thumbnail} alt={stream.title} />
            <div className="info">
              <h3>{stream.title}</h3>
              <p>{stream.status}</p>
              <p>Views: {stream.totalViews}</p>
            </div>
            <div className="actions">
              {stream.status === "LIVE" && <button>End Stream</button>}
              <button onClick={() => handleViewAnalytics(stream._id)}>
                Analytics
              </button>
              {stream.recordingUrl && (
                <button
                  onClick={() =>
                    (window.location.href = `/watch/${stream._id}`)
                  }
                >
                  Watch Recording
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedStream && (
        <div className="analytics-modal">
          <h2>{selectedStream.title} - Analytics</h2>
          <div className="metrics">
            <div className="metric">
              <span>Total Views</span>
              <span className="value">{selectedStream.totalViews}</span>
            </div>
            <div className="metric">
              <span>Peak Viewers</span>
              <span className="value">{selectedStream.peakViewers}</span>
            </div>
            <div className="metric">
              <span>Likes</span>
              <span className="value">{selectedStream.totalLikes}</span>
            </div>
            <div className="metric">
              <span>Duration</span>
              <span className="value">
                {Math.floor(selectedStream.durationSeconds / 60)}m
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Step-by-Step Workflows

### Workflow 1: Creator Goes Live

```
┌─ Creator Opens App
├─ Clicks "Go Live" Button
├─ Fills Form:
│  ├─ Title (required)
│  ├─ Description (optional)
│  ├─ Thumbnail (optional)
│  └─ Settings (privacy, maturity)
├─ Form Submitted → API: POST /go-live
├─ Backend Returns:
│  ├─ streamId
│  └─ streamKey
├─ Frontend:
│  ├─ Starts WebRTC broadcast with streamKey
│  ├─ Navigates to /streaming/{streamId}
│  └─ Shows "Stop Stream" button
├─ Stream is now LIVE
├─ Viewers can see in /currently-live
└─ Creator can End Stream → API: PATCH /stop-live
```

### Workflow 2: Viewer Watches Stream

```
┌─ Viewer Browses → GET /currently-live
├─ Sees list of LIVE streams
├─ Clicks on stream
├─ Opens → GET /:id (stream details)
├─ Calls → POST /:id/join (viewer count +1)
├─ Initializes video player
├─ Can Like → POST /:id/like
├─ Watches stream (viewer count -)
├─ Leaves stream → DELETE /:id/leave
└─ Session ends
```

### Workflow 3: Creator Views Past Stream Recording

```
┌─ Creator Goes to Dashboard
├─ Sees past streams in "My Streams"
├─ Clicks "View Recording"
├─ Opens recorded stream → GET /:id/watch
├─ Video URL returned from S3
├─ Video player loads and plays
└─ Can view analytics → GET /:id/analytics
```

---

## Error Handling

### Common Errors & Solutions

#### 401 Unauthorized

```json
{
  "success": false,
  "statusCode": 401,
  "message": "You are not authorized"
}
```

**Solution:** Check if token is in localStorage and valid

```javascript
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login";
}
```

#### 409 Conflict - Already Streaming

```json
{
  "success": false,
  "statusCode": 409,
  "message": "You already have an active live stream"
}
```

**Solution:** Creator must end current stream first

```javascript
try {
  await streamAPI.goLive(formData);
} catch (error) {
  if (error.response.status === 409) {
    alert("You already have an active stream. Please end it first.");
    // Redirect to current stream
  }
}
```

#### 400 Validation Error

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Title must be at least 3 characters"
}
```

**Solution:** Validate form before submitting

```javascript
const validateForm = (form) => {
  if (!form.title || form.title.length < 3) {
    return "Title must be at least 3 characters";
  }
  if (form.description && form.description.length > 500) {
    return "Description cannot exceed 500 characters";
  }
  return null;
};
```

#### 404 Not Found

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Stream not found"
}
```

**Solution:** Handle gracefully

```javascript
try {
  const response = await streamAPI.getStreamById(streamId);
} catch (error) {
  if (error.response.status === 404) {
    return <NotFoundPage />;
  }
}
```

---

## Testing Guide

### Postman Setup

#### 1. Create Environment

```
Variable: BASE_URL
Value: http://localhost:5000/api/v1

Variable: token
Value: <your_jwt_token>

Variable: streamId
Value: <test_stream_id>
```

#### 2. Test Sequence

**Request 1: Go Live**

```
POST {{BASE_URL}}/streams/go-live
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

Form Data:
- title: Test Stream
- description: Testing API
- isPublic: true

Response: Save streamId
```

**Request 2: Get Stream Details**

```
GET {{BASE_URL}}/streams/{{streamId}}
```

**Request 3: Get Live Streams**

```
GET {{BASE_URL}}/streams/currently-live?page=1&limit=10
```

**Request 4: Join Stream**

```
POST {{BASE_URL}}/streams/{{streamId}}/join
```

**Request 5: Like Stream**

```
POST {{BASE_URL}}/streams/{{streamId}}/like
Authorization: Bearer {{token}}
```

**Request 6: Stop Stream**

```
PATCH {{BASE_URL}}/streams/{{streamId}}/stop-live
Authorization: Bearer {{token}}
Content-Type: application/json

Body:
{
  "durationSeconds": 600
}
```

### Manual Testing Checklist

- [ ] Creator can go live with all required fields
- [ ] Thumbnail uploads correctly to S3
- [ ] streamKey is generated and returned
- [ ] Stream appears in /currently-live list
- [ ] Viewer can join stream (view count increases)
- [ ] Viewer can like/unlike stream
- [ ] Creator can update stream settings
- [ ] Creator can view analytics
- [ ] Creator can end stream
- [ ] Ended stream appears in /recordings
- [ ] Recording URL is valid and video plays
- [ ] Pagination works correctly
- [ ] Search filters work correctly
- [ ] Error messages display properly

---

## Deployment Checklist

### Before Production

- [ ] Environment variables configured (.env file)
- [ ] AWS S3 bucket created and configured
- [ ] Database connections tested
- [ ] JWT secret key set
- [ ] CORS enabled for frontend domain
- [ ] Rate limiting configured
- [ ] Error logging setup
- [ ] Database backups configured
- [ ] SSL/HTTPS enabled
- [ ] All endpoints tested in Postman
- [ ] Frontend fully integrated
- [ ] WebRTC/Streaming server setup
- [ ] Load testing completed

### Environment Variables

**.env**

```
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# JWT
JWT_SECRET=your_secret_key_here

# AWS S3
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your-bucket-name

# Server
PORT=5000
NODE_ENV=production

# Frontend
CORS_ORIGIN=https://yourdomain.com
```

### API Endpoints Summary

| Method | Endpoint                | Purpose          | Auth |
| ------ | ----------------------- | ---------------- | ---- |
| POST   | `/go-live`              | Start stream     | ✅   |
| PATCH  | `/:id/stop-live`        | End stream       | ✅   |
| PATCH  | `/:id/settings`         | Update settings  | ✅   |
| GET    | `/currently-live`       | Browse live      | ❌   |
| GET    | `/recordings`           | Browse recorded  | ❌   |
| GET    | `/my-streams`           | My streams       | ✅   |
| POST   | `/:id/join`             | Join stream      | ❌   |
| DELETE | `/:id/leave`            | Leave stream     | ❌   |
| POST   | `/:id/like`             | Like stream      | ✅   |
| GET    | `/:id/analytics`        | View analytics   | ✅   |
| GET    | `/:id`                  | Stream details   | ❌   |
| GET    | `/:id/watch`            | Watch recording  | ❌   |
| POST   | `/:id/upload-recording` | Upload recording | ✅   |

---

## Key Points to Remember

### ✅ Do's

- Always include `Authorization` header for protected endpoints
- Validate form data before sending
- Handle all error responses gracefully
- Show user-friendly error messages
- Use pagination for list endpoints
- Cache stream data when possible
- Clean up resources when leaving streams

### ❌ Don'ts

- Store tokens in localStorage insecurely
- Send sensitive data in query parameters
- Ignore error responses
- Load large files without chunking
- Keep streams open without cleanup
- Use hardcoded API URLs
- Skip validation on frontend

---

## Additional Resources

### Documentation Files

- [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md) - Quick endpoint guide
- [RECORDING_GUIDE.md](RECORDING_GUIDE.md) - Recording & S3 integration
- [STREAM_API_POSTMAN.md](STREAM_API_POSTMAN.md) - Postman examples

### External Libraries

- **WebRTC:** MediaSoup, LiveKit, Agora, AWS IVS
- **Video Player:** Video.js, HLS.js, DASHjs
- **State Management:** Redux, Zustand, Context API
- **Form Handling:** React Hook Form, Formik

---

**🎉 Complete Documentation Ready for Production!**

সব কিছু এখানে documented আছে। Frontend development শুরু করতে পারেন।
