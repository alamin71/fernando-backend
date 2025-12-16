# Stream API Documentation - Postman Collection

**Version:** 1.0.0 | **Last Updated:** December 16, 2025 | **Status:** ✅ Production Ready

---

## Quick Links

- [Base URL & Authentication](#base-url)
- [Stream Lifecycle APIs](#-stream-apis)
- [Discover & Viewer APIs](#-discover--viewer-apis)
- [Analytics & Recording APIs](#-analytics--recording-apis)
- [Postman Setup](#-postman-setup)
- [Environment Variables](#-postman-environment-variables)
- [Collection Import Instructions](#-import-postman-collection)

---

## Base URL

```
http://localhost:5000/api/v1/streams
```

## Authentication

Most endpoints require Bearer token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 📡 Stream APIs

### 1. Start Live Stream (Go Live)

**POST** `/go-live`

**Auth Required:** Yes (Creator)

**Content-Type:** `multipart/form-data`

**Form Data:**

```
title: "My First Live Stream"
description: "Welcome to my channel!"
categoryId: "65abc123..." (optional)
thumbnail: <file upload> (optional)
isPublic: true
whoCanMessage: "everyone" (or "followers")
isMature: false
```

**Response:**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Stream started successfully",
  "data": {
    "streamId": "65abc123...",
    "streamKey": "a1b2c3d4e5f6...",
    "title": "My First Live Stream",
    "description": "Welcome to my channel!",
    "categoryId": "65abc123...",
    "thumbnail": "https://s3.amazonaws.com/...",
    "status": "LIVE",
    "isPublic": true,
    "whoCanMessage": "everyone",
    "isMature": false,
    "startedAt": "2025-12-16T10:30:00.000Z"
  }
}
```

**Postman Setup:**

1. Method: POST
2. URL: `{{BASE_URL}}/streams/go-live`
3. Headers:
   - `Authorization: Bearer {{token}}`
4. Body → form-data:
   - `title` (text): "My Live Stream"
   - `description` (text): "Stream description"
   - `isPublic` (text): "true"
   - `whoCanMessage` (text): "everyone"
   - `isMature` (text): "false"
   - `thumbnail` (file): Select image file

---

### 2. End Live Stream

**PATCH** `/:id/stop-live`

**Auth Required:** Yes (Creator - must own the stream)

**Body:**

```json
{
  "recordingUrl": "https://s3.amazonaws.com/recordings/...",
  "playbackUrl": "https://cdn.example.com/playback/...",
  "durationSeconds": 3600
}
```

_All fields optional - if durationSeconds not provided, calculated from start/end time_

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stream ended successfully",
  "data": {
    "streamId": "65abc123...",
    "status": "OFFLINE",
    "endedAt": "2025-12-16T11:30:00.000Z"
  }
}
```

**Postman Setup:**

1. Method: PATCH
2. URL: `{{BASE_URL}}/streams/{{streamId}}/stop-live`
3. Headers: `Authorization: Bearer {{token}}`
4. Body → raw (JSON)

---

### 3. Update Stream Settings

**PATCH** `/:id/settings`

**Auth Required:** Yes (Creator - must own the stream)

**Content-Type:** `multipart/form-data` or `application/json`

**Body (can update any combination):**

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "categoryId": "65xyz789...",
  "thumbnail": "https://...",
  "isPublic": false,
  "whoCanMessage": "followers",
  "isMature": true
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stream updated successfully",
  "data": {
    "_id": "65abc123...",
    "title": "Updated Title",
    "description": "Updated description",
    "categoryId": { "_id": "65xyz789...", "name": "Gaming" },
    "isPublic": false,
    "whoCanMessage": "followers",
    "isMature": true,
    "creatorId": {
      "username": "john_doe",
      "channelName": "John's Channel",
      "image": "https://..."
    }
  }
}
```

**Postman Setup:**

1. Method: PATCH
2. URL: `{{BASE_URL}}/streams/{{streamId}}/settings`
3. Headers: `Authorization: Bearer {{token}}`
4. Body → raw (JSON) or form-data (if uploading new thumbnail)

---

### 4. Get All Live Streams (Currently Live)

**GET** `/currently-live`

**Auth Required:** No

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 20)
- `categoryId` (string, optional)
- `search` (string, optional - searches in title/description)

**Example:**

```
GET /currently-live?page=1&limit=10&categoryId=65abc123&search=gaming
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Live streams retrieved successfully",
  "data": [
    {
      "_id": "65abc123...",
      "title": "Live Gaming Session",
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
        "username": "john_doe",
        "channelName": "John's Channel",
        "image": "https://...",
        "creatorStats": {
          "totalFollowers": 1500
        }
      },
      "categoryId": {
        "name": "Gaming"
      }
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPage": 5
  }
}
```

**Postman Setup:**

1. Method: GET
2. URL: `{{BASE_URL}}/streams/currently-live`
3. Params: page=1, limit=10, search=gaming

---

### 5. Get Single Stream Details

**GET** `/:id`

**Auth Required:** No

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stream retrieved successfully",
  "data": {
    "stream": {
      "_id": "65abc123...",
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
      "_id": "65xyz789...",
      "streamId": "65abc123...",
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

**Postman Setup:**

1. Method: GET
2. URL: `{{BASE_URL}}/streams/{{streamId}}`

---

### 6. Get My Streams (Creator)

**GET** `/my-streams`

**Auth Required:** Yes (Creator)

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string, optional: "LIVE" | "OFFLINE" | "SCHEDULED")

**Example:**

```
GET /my-streams?page=1&limit=10&status=LIVE
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Creator streams retrieved successfully",
  "data": [
    {
      "_id": "65abc123...",
      "title": "My Past Stream",
      "status": "OFFLINE",
      "totalViews": 1500,
      "totalLikes": 89,
      "durationSeconds": 3600,
      "startedAt": "2025-12-15T10:00:00.000Z",
      "endedAt": "2025-12-15T11:00:00.000Z"
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

**Postman Setup:**

1. Method: GET
2. URL: `{{BASE_URL}}/streams/my-streams`
3. Headers: `Authorization: Bearer {{token}}`
4. Params: page=1, limit=10, status=LIVE

---

### 7. Increment View Count (Join Stream)

**POST** `/:id/join`

**Auth Required:** No (but userId tracked if authenticated)

**Body:** Empty

**Response:**

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

**Postman Setup:**

1. Method: POST
2. URL: `{{BASE_URL}}/streams/{{streamId}}/join`
3. Headers (optional): `Authorization: Bearer {{token}}`

---

### 8. Decrement Viewer Count (Leave Stream)

**DELETE** `/:id/leave`

**Auth Required:** No

**Body:** Empty

**Response:**

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

**Postman Setup:**

1. Method: DELETE
2. URL: `{{BASE_URL}}/streams/{{streamId}}/leave`

---

### 9. Toggle Like on Stream

**POST** `/:id/like`

**Auth Required:** Yes (Creator)

**Body:** Empty

**Response (Liked):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stream liked",
  "data": {
    "liked": true,
    "totalLikes": 90
  }
}
```

**Response (Unliked):**

```json
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

**Postman Setup:**

1. Method: POST
2. URL: `{{BASE_URL}}/streams/{{streamId}}/like`
3. Headers: `Authorization: Bearer {{token}}`

---

### 10. Get Stream Analytics (Creator Only)

**GET** `/:id/analytics`

**Auth Required:** Yes (Creator - must own the stream)

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stream analytics retrieved successfully",
  "data": {
    "streamId": "65abc123...",
    "title": "My Live Stream",
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
      "_id": "65xyz789...",
      "streamId": "65abc123...",
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

**Postman Setup:**

1. Method: GET
2. URL: `{{BASE_URL}}/streams/{{streamId}}/analytics`
3. Headers: `Authorization: Bearer {{token}}`

---

## 🔐 Environment Variables for Postman

Create these variables in Postman Environment:

```
BASE_URL = http://localhost:5000/api/v1
token = <your_jwt_token_here>
streamId = <test_stream_id>
```

---

## 📝 Complete Workflow Example

### Scenario: Creator Goes Live and Viewer Watches

1. **Creator Login** → Get token
2. **Start Stream** → POST `/go-live` → Get `streamId` & `streamKey`
3. **Frontend:** Use `streamKey` to initialize WebRTC broadcast
4. **Viewer:** GET `/currently-live` → See live streams
5. **Viewer:** GET `/:id` → Get stream details
6. **Viewer:** POST `/:id/join` → Join stream (increment viewers)
7. **Viewer:** POST `/:id/like` → Like the stream
8. **Viewer:** DELETE `/:id/leave` → Leave stream (decrement viewers)
9. **Creator:** GET `/:id/analytics` → Check stream performance
10. **Creator:** PATCH `/:id/stop-live` → End stream

---

## 🎯 Testing Flow in Postman

### Collection Structure:

```
Stream APIs/
├── 01 - Start Live Stream (go-live)
├── 02 - Get All Live Streams (currently-live)
├── 03 - Get Single Stream (:id)
├── 04 - Join Stream (join)
├── 05 - Like Stream (like)
├── 06 - Get My Streams (my-streams)
├── 07 - Update Stream Settings (settings)
├── 08 - Get Stream Analytics (analytics)
├── 09 - Leave Stream (leave)
└── 10 - Stop Live Stream (stop-live)
```

### Pre-request Script (Collection Level):

```javascript
// Auto-set streamId from response
pm.environment.set(
  "streamId",
  pm.response.json()?.data?.streamId || pm.environment.get("streamId")
);
```

### Tests Script (Collection Level):

```javascript
pm.test("Status code is successful", function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

pm.test("Response has success field", function () {
  pm.expect(pm.response.json()).to.have.property("success", true);
});
```

---

## ⚠️ Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "statusCode": 401,
  "message": "You are not authorized"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Stream not found"
}
```

### 409 Conflict

```json
{
  "success": false,
  "statusCode": 409,
  "message": "You already have an active live stream"
}
```

### 400 Bad Request

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Stream is not live"
}
```

---

## 📊 Sample Postman Collection JSON

Save this as `Stream_APIs.postman_collection.json`:

```json
{
  "info": {
    "name": "Stream APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "BASE_URL",
      "value": "http://localhost:5000/api/v1"
    }
  ],
  "item": [
    {
      "name": "Start Live Stream",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            { "key": "title", "value": "My First Stream", "type": "text" },
            { "key": "description", "value": "Welcome!", "type": "text" },
            { "key": "isPublic", "value": "true", "type": "text" },
            { "key": "whoCanMessage", "value": "everyone", "type": "text" },
            { "key": "isMature", "value": "false", "type": "text" },
            { "key": "thumbnail", "type": "file", "src": "" }
          ]
        },
        "url": "{{BASE_URL}}/streams/go-live"
      }
    },
    {
      "name": "Get Live Streams",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{BASE_URL}}/streams/currently-live?page=1&limit=10",
          "query": [
            { "key": "page", "value": "1" },
            { "key": "limit", "value": "10" }
          ]
        }
      }
    },
    {
      "name": "Toggle Like Stream",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": "{{BASE_URL}}/streams/{{streamId}}/like"
      }
    },
    {
      "name": "End Stream",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"durationSeconds\": 3600\n}"
        },
        "url": "{{BASE_URL}}/streams/{{streamId}}/stop-live"
      }
    }
  ]
}
```

---

## 🚀 Quick Start Commands

### Import to Postman:

1. Open Postman
2. Click "Import"
3. Paste collection JSON
4. Set environment variables (BASE_URL, token)
5. Start testing!

### Get Auth Token:

```
POST /api/v1/auth/login
Body: { "email": "creator@example.com", "password": "password123" }
Copy token from response → Set as {{token}} in Postman environment
```

---

## 📱 Frontend Integration Notes

### Stream Flow:

1. Call `/start` → Get `streamKey`
2. Initialize WebRTC/RTMP with `streamKey`
3. Start broadcasting
4. Display stream with player
5. Handle viewer interactions (likes, comments)
6. Call `/end` when done

### Real-time Updates:

- Use Socket.IO for real-time viewer count
- Poll `/:id` endpoint every 10s for stats
- WebSockets for chat messages

---

**Ready to test! 🎉**

All APIs are now implemented and documented. Use this guide with Postman to test the complete streaming platform.

---

## 📚 Related Documentation

- **[COMPLETE_STREAM_GUIDE.md](COMPLETE_STREAM_GUIDE.md)** - Full streaming platform documentation with all 13 endpoints and React components
- **[API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md)** - Quick lookup for all stream endpoints, query parameters, and status codes
- **[RECORDING_GUIDE.md](RECORDING_GUIDE.md)** - AWS S3 integration, recording flows, and code examples for streaming servers
