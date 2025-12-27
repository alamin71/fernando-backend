# Fernando Backend - Database Architecture & Design

**Project Type:** YouTube-style Live Streaming Platform  
**Database:** MongoDB (Atlas)  
**Last Updated:** December 26, 2025

---

## 📊 Entity Relationship Diagram (ERD)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         LIVE STREAMING PLATFORM                          │
└──────────────────────────────────────────────────────────────────────────┘

                              ┌──────────┐
                              │  Admin   │
                              └──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
              ┌─────▼──────┐            ┌────────▼────────┐
              │    User    │◄──────────►│    StreamKey    │
              │            │ (1:1)      │   (Password)    │
              └─────┬──────┘            └─────────────────┘
                    │
        ┌───────────┼───────────┬──────────────┐
        │           │           │              │
        │      ┌────▼────┐ ┌───▼─────┐ ┌──────▼──────┐
        │      │ Followers└─┤ Following│ │ Social Accts │
        │      │  (Array)   │ (Array)  │ │ (Embedded)   │
        │      └────────────┴──────────┴ └──────────────┘
        │
    ┌───▼──────────────────────────────────────────────┐
    │                    Follow                        │
    │  (followerId, followingId) - Unique Index       │
    └────────────────────────────────────────────────┘
         │                              │
         │ Many                    Many │
    ┌────▼──────────┐           ┌──────▼──────┐
    │    Stream     │◄──────────┤StreamCategory│
    │               │ (1:Many)   │              │
    └────┬──────────┘           └──────────────┘
         │
    ┌────┴────────────────────────────┐
    │                                 │
┌───▼──────────┐  ┌──────────────┐  ┌─▼──────────────┐
│ StreamChat   │  │StreamAnalytics│  │  StreamLike    │
│ (msg + TTL)  │  │ (stats cache) │  │ (unique index) │
└──────────────┘  └───────────────┘  └────────────────┘
    │
    └──► Message Count: ~1000s per stream
         TTL: Optional (configurable days)

┌─────────────┐
│ResetToken   │◄──────────── User (password reset)
│ (expiring)  │
└─────────────┘

┌─────────────┐
│PageSettings │ (standalone - privacy/terms)
│ (singleton) │
└─────────────┘
```

---

## 📋 Collections Schema

### 1. **User** (Users)

**Purpose:** Creator accounts, viewer profiles, authentication

**Fields:**
| Field | Type | Indexed | Notes |
|-------|------|---------|-------|
| `_id` | ObjectId | ✓ (Primary) | Auto-generated |
| `role` | String | | CREATOR \| ADMIN \| VIEWER |
| `email` | String | ✓ (Unique) | Lowercase |
| `password` | String | (Hidden) | Hashed, min 6 chars, `select: false` |
| `username` | String | ✓ (Unique) | Sparse, trimmed |
| `channelName` | String | ✓ (Unique) | Sparse, trimmed |
| `image` | String | | Profile photo URL |
| `verified` | Boolean | ✓ | Email verified flag |
| `status` | String | | PENDING \| ACTIVE \| REJECTED |
| `isDeleted` | Boolean | ✓ | Soft delete |
| `isBlocked` | Boolean | ✓ | Admin block flag |

**Profile Data (Nested):**

```
profileData: {
  firstName: String,
  lastName: String,
  bio: String,
  phone: String,
  location: String
}
```

**Creator Stats (Cached, Nested):**

```
creatorStats: {
  totalFollowers: Number,
  totalStreams: Number,
  totalStreamViews: Number,
  totalLikes: Number
}
```

**Channel Customization:**
| Field | Type | Notes |
|-------|------|-------|
| `profilePhoto` | String | S3 URL |
| `coverPhoto` | String | S3 URL |
| `description` | String | Channel bio |
| `socialAccounts` | Array | Platform + URL array |

**Social Connections (Arrays):**

```
followers: [ObjectId]           // Users following this creator
following: [ObjectId]           // Creators this user follows
likedStreams: [ObjectId]        // Streams user has liked
```

**Stream Key (For Broadcasting):**
| Field | Type | Notes |
|-------|------|-------|
| `streamKey` | String | Sparse, `select: false` |
| `streamKeyUpdatedAt` | Date | Sparse, tracks last update |

**Authentication (Nested):**

```
authentication: {
  isResetPassword: Boolean,
  oneTimeCode: Number,
  expireAt: Date
}
```

**Indexes:**

```
- email (unique)
- username (unique, sparse)
- channelName (unique, sparse)
- verified (for filtering active users)
- isDeleted (for soft-delete queries)
- isBlocked (for admin filtering)
```

**Timestamps:** `createdAt`, `updatedAt`

---

### 2. **Stream** (Streams)

**Purpose:** Live streaming sessions, recordings, playback

**Fields:**
| Field | Type | Indexed | Notes |
|-------|------|---------|-------|
| `_id` | ObjectId | ✓ | Auto-generated |
| `creatorId` | ObjectId (User) | ✓ | Ref to creator |
| `title` | String | ✓ | Stream name |
| `description` | String | | Stream details |
| `categoryId` | ObjectId (StreamCategory) | ✓ | Ref to category |
| `thumbnail` | String | | S3 URL |
| `streamKey` | String | ✓ (Unique) | Unique per stream, `select: false` |
| `status` | String | ✓ | LIVE \| OFFLINE \| SCHEDULED |
| `isPublic` | Boolean | ✓ | Visibility flag |
| `recordingUrl` | String | | S3 HLS playlist URL |
| `playbackUrl` | String | | HTTPS playback URL |
| `durationSeconds` | Number | | Video length |
| `whoCanMessage` | String | | everyone \| followers |
| `isMature` | Boolean | | Content rating |
| `startedAt` | Date | ✓ | Stream start time |
| `endedAt` | Date | | Stream end time |
| `scheduledAt` | Date | | For scheduled streams |

**Performance Cache (Nested):**

```
currentViewers: Number,      // Real-time viewer count
peakViewers: Number,         // Max concurrent viewers
totalViews: Number,          // All-time view count (indexed)
totalLikes: Number,          // Aggregated likes
totalComments: Number        // Aggregated comments
```

**WebRTC/Streaming (Nested):**

```
rtcServerUrl: String,        // RTC endpoint
streamUrl: String            // RTMP ingest URL
```

**Report Tracking:**

```
isReported: Boolean (indexed)  // Content moderation flag
```

**Compound Indexes:**

```
- (creatorId, status)        // Find creator's live streams
- (status, startedAt DESC)   // Home feed: active streams
- (categoryId, status)       // Category filtering
- (createdAt DESC)           // Latest streams
- (totalViews DESC)          // Trending/popular
```

**TTL Index:**

```
- endedAt (90 days)          // Auto-delete old offline streams
```

**Timestamps:** `createdAt`, `updatedAt`

---

### 3. **StreamCategory** (Categories)

**Purpose:** Categorize streams (Games, Music, Creative, etc.)

**Fields:**
| Field | Type | Indexed | Notes |
|-------|------|---------|-------|
| `_id` | ObjectId | ✓ | Auto-generated |
| `name` | String | ✓ (Unique) | Category name |
| `image` | String | ✓ | Category icon URL (required) |
| `coverPhoto` | String | | Category banner URL |
| `isActive` | Boolean | ✓ | Display flag |

**Timestamps:** `createdAt`, `updatedAt`

---

### 4. **Follow** (Follows)

**Purpose:** Creator follow relationship tracking

**Fields:**
| Field | Type | Indexed | Constraint |
|-------|------|---------|-----------|
| `_id` | ObjectId | ✓ | Auto-generated |
| `followerId` | ObjectId (User) | ✓ | Who is following |
| `followingId` | ObjectId (User) | ✓ | Who is being followed |

**Indexes:**

```
- (followerId, followingId)  // Unique - prevent duplicates
- followerId                 // Get user's following list
- followingId                // Get user's followers list
```

**Timestamps:** `createdAt`, `updatedAt`

**Static Methods:**

```typescript
getFollowingStreams(userId, limit); // Get streams from creators user follows
```

---

### 5. **StreamChat** (StreamChats)

**Purpose:** Real-time messaging during streams

**Fields:**
| Field | Type | Indexed | Notes |
|-------|------|---------|-------|
| `_id` | ObjectId | ✓ | Auto-generated |
| `streamId` | ObjectId (Stream) | ✓ | Ref to stream |
| `userId` | ObjectId (User) | | Message author |
| `message` | String | | Max 500 chars |
| `messageType` | String | | TEXT \| SYSTEM |

**Indexes:**

```
- (streamId, createdAt DESC)  // Get recent chat
```

**TTL Index (Conditional):**

```
- createdAt (configurable)    // Auto-delete if CHAT_TTL_DAYS > 0
  Default: No TTL (keep forever)
  Config via env: CHAT_TTL_DAYS
```

**Timestamps:** `createdAt`, `updatedAt`

**Static Methods:**

```typescript
getRecentChat(streamId, limit); // Get last N messages
```

---

### 6. **StreamAnalytics** (StreamAnalytics)

**Purpose:** Performance metrics caching (1:1 with Stream)

**Fields:**
| Field | Type | Indexed | Notes |
|-------|------|---------|-------|
| `_id` | ObjectId | ✓ | Auto-generated |
| `streamId` | ObjectId (Stream) | ✓ (Unique) | 1:1 relationship |
| `userId` | ObjectId (User) | ✓ (Sparse) | Creator reference |
| `viewCount` | Number | | Total views |
| `watchDuration` | Number | | Total seconds watched |
| `uniqueViewers` | Number | | Unique viewer count |
| `peakConcurrentViewers` | Number | | Max concurrent |
| `likes` | Number | | Like count |
| `comments` | Number | | Comment count |
| `shares` | Number | | Share count |

**Indexes:**

```
- (userId, createdAt DESC)    // Creator's analytics history
```

**TTL Index:**

```
- createdAt (90 days)         // Auto-delete old analytics
```

**Timestamps:** `createdAt`, `updatedAt`

---

### 7. **StreamLike** (StreamLikes)

**Purpose:** Like tracking (prevent duplicates)

**Fields:**
| Field | Type | Indexed | Notes |
|-------|------|---------|-------|
| `_id` | ObjectId | ✓ | Auto-generated |
| `streamId` | ObjectId (Stream) | ✓ | Liked stream |
| `userId` | ObjectId (User) | | Who liked |

**Indexes:**

```
- (streamId, userId)          // Unique - prevent duplicate likes
```

**TTL Index:**

```
- createdAt (90 days)         // Auto-delete old likes
```

**Timestamps:** `createdAt`, `updatedAt`

**Static Methods:**

```typescript
getLikeCount(streamId); // Count likes
isLiked(streamId, userId); // Check if user liked
```

---

### 8. **Admin** (Admins)

**Purpose:** Admin/super-admin accounts

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `fullName` | String | Admin name |
| `email` | String | Unique, required |
| `password` | String | Hashed, `select: false` |
| `role` | String | admin \| super_admin |
| `image` | Object | { id, url } |
| `isActive` | Boolean | Activation flag |

**OTP Verification (Nested):**

```
verification: {
  otp: Number,
  expiresAt: Date,
  verified: Boolean
}
```

**Timestamps:** `createdAt`, `updatedAt`

---

### 9. **ResetToken** (Tokens)

**Purpose:** Password reset token management

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `user` | ObjectId (User) | Ref to user |
| `token` | String | Reset token |
| `expireAt` | Date | Token expiration |

**Timestamps:** `createdAt`, `updatedAt`

**Static Methods:**

```typescript
isExistToken(token); // Check if token exists
isExpireToken(token); // Check if valid (not expired)
```

---

### 10. **PageSettings** (PageSettings)

**Purpose:** Application-wide settings (privacy policy, terms)

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `privacyPolicy` | String | Privacy policy content |
| `termsAndConditions` | String | Terms and conditions |
| `lastUpdated` | Date | Last update timestamp |

**Timestamps:** `createdAt`, `updatedAt`

---

## 🔗 Relationship Summary

| From                | To                    | Type       | Cardinality | Notes                    |
| ------------------- | --------------------- | ---------- | ----------- | ------------------------ |
| **User**            | Stream                | References | 1:Many      | Creator → streams        |
| **User**            | Follow (as follower)  | References | 1:Many      | User → followers         |
| **User**            | Follow (as following) | References | 1:Many      | User → following         |
| **User**            | StreamChat            | References | 1:Many      | User → messages          |
| **User**            | StreamLike            | References | 1:Many      | User → liked streams     |
| **Stream**          | StreamCategory        | References | Many:1      | Stream → category        |
| **Stream**          | StreamChat            | References | 1:Many      | Stream → messages        |
| **Stream**          | StreamAnalytics       | References | 1:1         | Stream → analytics       |
| **Stream**          | StreamLike            | References | 1:Many      | Stream → likes           |
| **User (as array)** | Follow                | References | 1:Many      | followers[], following[] |
| **Admin**           | -                     | Standalone | -           | No relationships         |
| **ResetToken**      | User                  | References | Many:1      | Token → user             |
| **PageSettings**    | -                     | Standalone | -           | No relationships         |

---

## 📈 Data Flow & Operations

### **User Registration → Stream Creation → Live Broadcasting**

```
1. User Register
   └─► Create User document
       ├─ Validate email (unique)
       ├─ Hash password
       └─ Assign role (CREATOR)

2. User Follows Creator
   └─► Create Follow document
       ├─ Check if already following
       ├─ Add to User.following[]
       └─ Add to Creator.followers[]

3. Creator Goes Live
   └─► Create Stream document
       ├─ Assign unique streamKey (DB key, different from IVS key)
       ├─ Set status: LIVE
       ├─ Create StreamAnalytics (1:1)
       └─ Increment User.creatorStats.totalStreams

4. Viewer Watches
   └─► Real-time via Socket.IO
       ├─ StreamChat messages
       ├─ Update Stream.currentViewers
       └─ Stream.totalViews increment

5. Creator Ends Stream
   └─► Update Stream document
       ├─ Set status: OFFLINE
       ├─ endedAt = now
       ├─ Query S3 for recording
       ├─ Save recordingUrl + playbackUrl
       ├─ Compute durationSeconds
       └─ TTL index will auto-delete in 90 days

6. Analytics Aggregation
   └─► StreamAnalytics aggregates:
       ├─ Sum of StreamChat messages → totalComments
       ├─ Count of StreamLike entries → totalLikes
       └─ Peak from currentViewers → peakViewers
       └─ TTL index deletes after 90 days
```

---

## 🔐 Security & Indexing Strategy

### **Query Optimization Indexes**

| Collection          | Index                                | Purpose                    | Cardinality |
| ------------------- | ------------------------------------ | -------------------------- | ----------- |
| **User**            | email (unique)                       | Fast login                 | High        |
|                     | username (unique, sparse)            | Channel name lookup        | High        |
|                     | verified                             | Filter active users        | Low         |
|                     | isBlocked                            | Admin filtering            | Low         |
| **Stream**          | (creatorId, status)                  | Creator's live streams     | High        |
|                     | (status, startedAt DESC)             | Home feed (active)         | Medium      |
|                     | (categoryId, status)                 | Category browse            | Medium      |
|                     | (createdAt DESC)                     | Latest streams             | High        |
|                     | (totalViews DESC)                    | Trending                   | High        |
|                     | isReported                           | Content moderation         | Low         |
|                     | (endedAt) **TTL**                    | Auto-delete (90d)          | Medium      |
| **Follow**          | (followerId, followingId) **unique** | Prevent duplicates         | High        |
|                     | followerId                           | Get following list         | High        |
|                     | followingId                          | Get followers list         | High        |
| **StreamChat**      | (streamId, createdAt DESC)           | Get chat history           | High        |
|                     | (createdAt) **TTL**                  | Auto-delete (configurable) | Medium      |
| **StreamAnalytics** | (userId, createdAt DESC)             | Creator analytics          | High        |
|                     | (createdAt) **TTL**                  | Auto-delete (90d)          | Medium      |
| **StreamLike**      | (streamId, userId) **unique**        | Prevent duplicate likes    | High        |
|                     | (createdAt) **TTL**                  | Auto-delete (90d)          | Medium      |

### **Array Field Indexes**

| Field                   | Strategy       | Notes                                     |
| ----------------------- | -------------- | ----------------------------------------- |
| `User.followers[]`      | Embedded Array | Denormalized for fast `$addToSet`/`$pull` |
| `User.following[]`      | Embedded Array | Denormalized for fast access              |
| `User.likedStreams[]`   | Embedded Array | Denormalized for query speed              |
| `User.socialAccounts[]` | Embedded Array | Platform links                            |
| `User.streamKey`        | Sparse Index   | `select: false` for security              |

---

## ⚡ Performance Optimizations

### **1. Caching Strategy (Embedded Fields)**

```typescript
// Stream.creatorStats (cached on User)
creatorStats: {
  totalFollowers: Number,    // Updated via Follow create/delete
  totalStreams: Number,      // Incremented on stream create
  totalStreamViews: Number,  // Updated when stream.totalViews changes
  totalLikes: Number         // Aggregated from StreamLike count
}

// Stream performance cache
currentViewers: Number,      // Updated real-time via Socket.IO
peakViewers: Number,         // Updated when currentViewers peaks
totalViews: Number,          // Incremented on viewer join
totalLikes: Number,          // Count from StreamLike collection
totalComments: Number        // Count from StreamChat collection
```

### **2. TTL Indexes (Auto-cleanup)**

- **Stream.endedAt** (90 days): Remove offline streams after 3 months
- **StreamChat.createdAt** (configurable): Optional message cleanup
- **StreamAnalytics.createdAt** (90 days): Remove old metrics
- **StreamLike.createdAt** (90 days): Remove old likes

### **3. Sparse Indexes**

- `User.username` (sparse) → `null` doesn't occupy index space
- `User.channelName` (sparse) → Skip when undefined
- `User.streamKey` (sparse) → Only indexed for creators

### **4. Compound Indexes**

- `(creatorId, status)` → Find specific creator's LIVE streams in ms
- `(status, startedAt DESC)` → Home feed queries optimized
- `(categoryId, status)` → Category browsing fast

---

## 📊 Collection Statistics (Estimates)

| Collection          | Typical Size | Grow Rate     | Sample Count |
| ------------------- | ------------ | ------------- | ------------ |
| **User**            | Varies       | +10-100/day   | 10K-100K     |
| **Stream**          | Medium       | +100-1000/day | 50K-500K     |
| **StreamCategory**  | Small        | Static        | 20-100       |
| **Follow**          | Large        | +1000-10K/day | 1M+          |
| **StreamChat**      | Very Large   | +10K-100K/day | 10M+         |
| **StreamAnalytics** | Medium       | +100-1000/day | 50K-500K     |
| **StreamLike**      | Large        | +10K-50K/day  | 1M+          |
| **Admin**           | Tiny         | Static        | 1-10         |
| **ResetToken**      | Small        | Temporary     | 100-1K       |
| **PageSettings**    | Tiny         | Static        | 1            |

---

## 🚀 Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Collections created with indexes
- [ ] TTL indexes configured
- [ ] Unique constraints validated
- [ ] Compound indexes on query-heavy fields
- [ ] Backup strategy enabled
- [ ] Monitoring alerts set up
- [ ] S3 bucket for recordings configured
- [ ] AWS IVS service linked
- [ ] Environment variables validated

---

## 📝 Notes

1. **IVS Integration:** `Stream.streamKey` (DB) ≠ IVS ingestKey (response). DB key is unique per stream; IVS key is shared config for all OBS clients.

2. **Recording Auto-detect:** After stream ends, S3 stores HLS files in `ivs/v1/{accountId}/{channelId}/`. Backend detects and saves URLs.

3. **Chat TTL:** Configurable via `CHAT_TTL_DAYS` env var. Default: keep forever (TTL disabled).

4. **Soft Delete:** `User.isDeleted` flag allows account recovery; queries filter `isDeleted: false`.

5. **Role-based Access:**

   - **CREATOR**: Can stream, manage channel, follow/unfollow
   - **ADMIN**: Can manage users, block creators, manage categories
   - **VIEWER**: Can watch, like, comment (optional role)

6. **Pagination:** All list endpoints support `page` and `limit` query params.

---

## 🔍 ER Diagram ASCII Art (High-Level)

```
┌──────────────┐
│   User       │  ──┬─► followers[] (ObjectId[])
├──────────────┤    ├─► following[] (ObjectId[])
│ _id (PK)     │    ├─► likedStreams[] (ObjectId[])
│ email (UQ)   │    └─► creatorStats { totalFollowers, ... }
│ username (UQ)│
│ channelName  │
│ password     │
│ role         │
└──────┬───────┘
       │
       ├──────────────┬─────────────┐
       │              │             │
    (1:Many)      (1:Many)      (1:Many)
       │              │             │
       ▼              ▼             ▼
   ┌────────┐  ┌──────────┐  ┌──────────┐
   │ Stream │  │StreamChat│  │StreamLike│
   └────────┘  └──────────┘  └──────────┘
       │
       ├─ creatorId (ref: User)
       ├─ categoryId (ref: StreamCategory)
       ├─ status: LIVE|OFFLINE|SCHEDULED
       └─ Compound: (creatorId, status)

┌──────────────┐
│    Follow    │  Unique(followerId, followingId)
├──────────────┤
│ followerId   │ ──► User
│ followingId  │ ──► User
└──────────────┘

┌──────────────┐
│StreamCategory│
├──────────────┤
│ _id (PK)     │
│ name (UQ)    │
└──────────────┘

┌──────────────┐
│StreamAnalytics│ 1:1 with Stream
├──────────────┤
│ streamId(UQ) │
└──────────────┘
```

---

**End of Document**
