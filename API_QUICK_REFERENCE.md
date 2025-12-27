# 🎯 Stream API Quick Reference

**Version:** 1.0.0 | **Last Updated:** December 28, 2025 | **Status:** ✅ Production Ready

## Base URL

```
http://localhost:5000/api/v1/streams
```

---

## 📋 All Endpoints at a Glance

### 🔴 STREAM LIFECYCLE (Go Live/Stop)

| Method | Endpoint         | Purpose         | Auth    |
| ------ | ---------------- | --------------- | ------- |
| POST   | `/go-live`       | Stream শুরু করা | Creator |
| PATCH  | `/:id/stop-live` | Stream বন্ধ করা | Creator |
| PATCH  | `/:id/settings`  | Settings update | Creator |
| GET    | `/ingest-config` | Ingest config   | Creator |

### 🔍 DISCOVER STREAMS (Browse/Search)

| Method | Endpoint          | Purpose           | Auth    |
| ------ | ----------------- | ----------------- | ------- |
| GET    | `/currently-live` | Live streams list | Public  |
| GET    | `/recordings`     | Recorded streams  | Public  |
| GET    | `/my-streams`     | My streams        | Creator |
| GET    | `/my-liked`       | Liked streams     | Auth    |

### 👤 VIEWER ACTIONS (Watch/Interact)

| Method | Endpoint               | Purpose      | Auth     |
| ------ | ---------------------- | ------------ | -------- |
| POST   | `/:id/join`            | Join stream  | Optional |
| DELETE | `/:id/leave`           | Leave stream | Public   |
| POST   | `/:id/like`            | Like/unlike  | Creator  |
| GET    | `/:id/watch`           | Watch VOD    | Public   |
| GET    | `/:id/chat`            | List chat    | Public   |
| POST   | `/:id/chat`            | Send chat    | Auth     |
| DELETE | `/:id/chat/:messageId` | Delete chat  | Creator  |

### 📊 ANALYTICS & DATA

| Method | Endpoint         | Purpose        | Auth    |
| ------ | ---------------- | -------------- | ------- |
| GET    | `/:id/analytics` | Stream stats   | Creator |
| GET    | `/:id`           | Stream details | Public  |

### 🎬 RECORDINGS (Upload/Watch)

| Method | Endpoint                | Purpose         | Auth    |
| ------ | ----------------------- | --------------- | ------- |
| GET    | `/:id/watch`            | Watch recording | Public  |
| POST   | `/:id/upload-recording` | Upload to S3    | Creator |

---

## 🎨 Endpoint Categories

### 1️⃣ CREATOR ACTIONS (Auth Required)

```
🔴 POST   /go-live                    - Start broadcasting
⚫ PATCH  /:id/stop-live              - Stop broadcasting
✏️ PATCH  /:id/settings               - Update stream settings (live)
📊 GET    /:id/analytics              - View performance stats
📤 POST   /:id/upload-recording       - Upload recording file to S3
📋 GET    /my-streams                 - View all my streams
❤️ POST   /:id/like                   - Like/unlike stream
```

### 2️⃣ VIEWER ACTIONS (Public/Optional Auth)

```
🔍 GET    /currently-live             - Browse active streams
📹 GET    /recordings                 - Browse past streams
👁️ POST   /:id/join                   - Start watching (viewer +1)
👋 DELETE /:id/leave                  - Stop watching (viewer -1)
🎬 GET    /:id/watch                  - Get recording URL
📺 GET    /:id                        - Get stream info
```

---

## 💡 Quick Usage Examples

### Creator Goes Live

```javascript
// 1. Create stream
POST /go-live
Body: FormData { title, description, thumbnail, settings }
Response: { streamId, streamKey }

// 2. Broadcast with streamKey
Use streamKey in WebRTC/RTMP server

// 3. End stream
PATCH /:id/stop-live
Response: { status: "OFFLINE" }
```

### Viewer Watches Stream

```javascript
// 1. Browse
GET /currently-live?page=1&limit=12

// 2. Open
GET /:id

// 3. Join
POST /:id/join

// 4. Like (optional)
POST /:id/like

// 5. Leave
DELETE /:id/leave
```

### View Past Recording

```javascript
// 1. Get URL
GET /:id/watch
Response: { recordingUrl }

// 2. Play
<video src={recordingUrl} controls />
```

---

## 🔐 Authentication

### Protected Endpoints (Creator)

```
Authorization: Bearer <jwt_token>
```

### Public Endpoints

```
No auth required (optional for tracking)
```

---

## 🎯 Common Query Parameters

| Parameter    | Used In                          | Example                |
| ------------ | -------------------------------- | ---------------------- |
| `page`       | List endpoints                   | `?page=1`              |
| `limit`      | List endpoints                   | `?limit=12`            |
| `search`     | `/currently-live`, `/recordings` | `?search=gaming`       |
| `categoryId` | `/currently-live`, `/recordings` | `?categoryId=65abc123` |
| `creatorId`  | `/recordings`                    | `?creatorId=65abc123`  |
| `status`     | `/my-streams`                    | `?status=LIVE`         |

### Combined Filters

```
GET /currently-live?page=1&limit=20&search=valorant&categoryId=65abc123
GET /my-streams?page=1&limit=10&status=OFFLINE
GET /recordings?page=1&limit=15&creatorId=65xyz789
```

---

## 🚀 Quick Start Commands

### Curl Examples

```bash
# Get live streams
curl "http://localhost:5000/api/v1/streams/currently-live"

# Go Live (with token)
curl -X POST "http://localhost:5000/api/v1/streams/go-live" \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=My Stream"

# Join stream
curl -X POST "http://localhost:5000/api/v1/streams/{streamId}/join"

# Stop stream
curl -X PATCH "http://localhost:5000/api/v1/streams/{streamId}/stop-live" \
  -H "Authorization: Bearer $TOKEN"
```

### Postman Setup

1. Create environment: `BASE_URL`, `token`, `streamId`
2. Test sequence:
   - POST `/go-live`
   - GET `/currently-live`
   - POST `/:id/join`
   - PATCH `/:id/stop-live`

---

## 📝 Response Format

### Success

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {
    /* result */
  },
  "meta": { "total": 100, "page": 1, "limit": 10, "totalPage": 10 }
}
```

### Error

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description"
}
```

---

## ✅ Status Codes

| Code | Meaning      | When               |
| ---- | ------------ | ------------------ |
| 200  | OK           | Successful request |
| 201  | Created      | Stream created     |
| 400  | Bad Request  | Validation error   |
| 401  | Unauthorized | Missing token      |
| 403  | Forbidden    | Not authorized     |
| 404  | Not Found    | Resource not found |
| 409  | Conflict     | Already streaming  |

---

## 🎯 Common Scenarios

### Creator's First Stream

```
1. POST /go-live → Get streamId, streamKey
2. Start broadcast
3. PATCH /:id/stop-live → End
4. GET /my-streams → View
5. GET /:id/analytics → Stats
```

### Viewer Discovery

```
1. GET /currently-live → Browse
2. POST /:id/join → Watch
3. POST /:id/like → Engage
4. DELETE /:id/leave → Exit
```

### Past Stream Review

```
1. GET /my-streams?status=OFFLINE → Find
2. GET /:id/watch → Get URL
3. GET /:id/analytics → Review stats
```

---

## 📚 Related Documentation

- **[COMPLETE_STREAM_GUIDE.md](COMPLETE_STREAM_GUIDE.md)** - Full documentation
- **[RECORDING_GUIDE.md](RECORDING_GUIDE.md)** - Recording & S3
- **[STREAM_API_POSTMAN.md](STREAM_API_POSTMAN.md)** - Postman examples

---

**Ready for Production! 🎉**
