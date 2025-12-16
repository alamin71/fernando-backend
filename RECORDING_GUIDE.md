# 📹 Stream Recording Guide - AWS S3 Integration

**Version:** 1.0.0 | **Last Updated:** December 16, 2025 | **Status:** ✅ Production Ready

---

## Overview

এই guide এ AWS S3 ব্যবহার করে live stream recording save এবং retrieve করার complete process দেওয়া আছে।

---

## Quick Links

- [Recording Workflow](#-recording-workflow)
- [APIs for Recording](#-apis-for-recording)
- [AWS S3 Configuration](#-aws-s3-configuration)
- [Code Examples](#-code-examples)
- [Streaming Server Integration](#-streaming-server-integration-examples)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Recording Workflow

### **Automatic Recording (Recommended)**

```
1. Creator goes live → POST /streams/go-live
2. Streaming server (LiveKit/Agora/AWS IVS) automatically records
3. Recording complete → Server uploads to S3
4. Get S3 URL → Call PATCH /streams/:id/stop-live with recordingUrl
5. Stream ends with recording saved
```

### **Manual Recording Upload**

```
1. Creator goes live → POST /streams/go-live
2. Local recording happens (OBS/Browser)
3. Stream ends → PATCH /streams/:id/stop-live (without recording)
4. Upload recording → POST /streams/:id/upload-recording (file upload)
5. Recording saved to S3 automatically
```

---

## 📡 APIs for Recording

### 1. **End Stream with Recording URL**

**PATCH** `/streams/:id/stop-live`

**Use Case:** Streaming server ne already S3 e upload kore diyeche

```json
{
  "recordingUrl": "https://your-bucket.s3.amazonaws.com/stream-recordings/...",
  "playbackUrl": "https://cdn.example.com/playback/...",
  "durationSeconds": 3600
}
```

**Response:**

```json
{
  "success": true,
  "message": "Stream ended successfully",
  "data": {
    "streamId": "65abc123...",
    "status": "OFFLINE",
    "endedAt": "2025-12-16T11:30:00.000Z"
  }
}
```

---

### 2. **Upload Recording to S3**

**POST** `/streams/:id/upload-recording`

**Auth Required:** Yes (Creator - must own the stream)

**Content-Type:** `multipart/form-data`

**Use Case:** Creator locally record koreche, ekhon upload korbe

**Form Data:**

```
recording: <video file> (mp4, webm, mov)
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Recording uploaded successfully",
  "data": {
    "streamId": "65abc123...",
    "status": "OFFLINE",
    "recordingUrl": "https://your-bucket.s3.amazonaws.com/stream-recordings/65abc123.../1734350400000-recording.mp4",
    "recordingId": "stream-recordings/65abc123.../1734350400000-recording.mp4",
    "endedAt": "2025-12-16T11:30:00.000Z"
  }
}
```

**S3 Folder Structure:**

```
your-bucket/
└── stream-recordings/
    └── {streamId}/
        └── {timestamp}-{filename}.mp4
```

**Postman Setup:**

1. Method: POST
2. URL: `{{BASE_URL}}/streams/{{streamId}}/recording`
3. Headers: `Authorization: Bearer {{token}}`
4. Body → form-data:
   - Key: `recording` (file)
   - Value: Select video file (.mp4, .webm, .mov)

---

### 3. **Get All Recorded Streams**

**GET** `/streams/recordings`

**Auth Required:** No

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 20)
- `creatorId` (string, optional) - Specific creator er recordings
- `categoryId` (string, optional) - Category filter
- `search` (string, optional) - Title/description e search

**Example:**

```
GET /streams/recordings?page=1&limit=10&creatorId=65abc123
```

**Response:**

```json
{
  "success": true,
  "message": "Recorded streams retrieved successfully",
  "data": [
    {
      "_id": "65abc123...",
      "title": "My Gaming Stream",
      "description": "Valorant gameplay",
      "thumbnail": "https://...",
      "status": "OFFLINE",
      "recordingUrl": "https://your-bucket.s3.amazonaws.com/stream-recordings/...",
      "playbackUrl": "https://...",
      "durationSeconds": 3600,
      "totalViews": 1500,
      "totalLikes": 89,
      "startedAt": "2025-12-16T10:00:00.000Z",
      "endedAt": "2025-12-16T11:00:00.000Z",
      "creatorId": {
        "username": "john_doe",
        "channelName": "John's Channel",
        "image": "https://..."
      },
      "categoryId": {
        "name": "Gaming"
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

**Postman Setup:**

1. Method: GET
2. URL: `{{BASE_URL}}/streams/recordings`
3. Params: page=1, limit=10, creatorId=65abc123

---

### 4. **Get Single Stream Recording**

**GET** `/streams/:id/recording`

**Auth Required:** No

**Use Case:** Video player e play korar jonno recording URL pawa

**Response:**

```json
{
  "success": true,
  "message": "Stream recording retrieved successfully",
  "data": {
    "streamId": "65abc123...",
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
      "channelName": "John's Channel",
      "image": "https://..."
    },
    "categoryId": {
      "name": "Gaming"
    }
  }
}
```

**Postman Setup:**

1. Method: GET
2. URL: `{{BASE_URL}}/streams/{{streamId}}/recording`

**Error Response (No Recording):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Recording not available for this stream"
}
```

---

## 🔧 AWS S3 Configuration

### Environment Variables (.env)

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_BUCKET_NAME=your-bucket-name
```

### S3 Bucket Setup

#### 1. Create S3 Bucket

```bash
aws s3 mb s3://your-stream-recordings --region ap-south-1
```

#### 2. Configure Bucket Policy (Public Read Access)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-stream-recordings/*"
    }
  ]
}
```

#### 3. Enable CORS (for direct video playback)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

#### 4. IAM User Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-stream-recordings",
        "arn:aws:s3:::your-stream-recordings/*"
      ]
    }
  ]
}
```

---

## 💻 Code Examples

### Frontend - Upload Recording After Stream Ends

```javascript
// Step 1: End stream
const endStream = async (streamId) => {
  const response = await fetch(`${API_URL}/streams/${streamId}/stop-live`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      durationSeconds: calculateDuration(),
    }),
  });

  return await response.json();
};

// Step 2: Upload recording file
const uploadRecording = async (streamId, videoFile) => {
  const formData = new FormData();
  formData.append("recording", videoFile);

  const response = await fetch(
    `${API_URL}/streams/${streamId}/upload-recording`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const result = await response.json();
  console.log("Recording uploaded:", result.data.recordingUrl);
  return result;
};

// Usage
const handleEndStream = async () => {
  // End stream first
  await endStream(currentStreamId);

  // Then upload recording
  const recordingFile = getLocalRecording(); // Get from local storage/MediaRecorder
  await uploadRecording(currentStreamId, recordingFile);

  alert("Stream ended and recording uploaded!");
};
```

### Frontend - Display Recorded Streams

```javascript
// Fetch recorded streams
const getRecordedStreams = async (page = 1) => {
  const response = await fetch(
    `${API_URL}/streams/recordings?page=${page}&limit=12`,
    {
      method: "GET",
    }
  );

  const result = await response.json();
  return result.data; // Array of streams with recordingUrl
};

// Play recording in video player
const playRecording = async (streamId) => {
  const response = await fetch(`${API_URL}/streams/${streamId}/recording`);
  const result = await response.json();

  const videoPlayer = document.getElementById("video-player");
  videoPlayer.src = result.data.recordingUrl;
  videoPlayer.play();
};
```

---

## 🎬 Streaming Server Integration Examples

### Option 1: AWS IVS (Interactive Video Service)

```javascript
// AWS IVS automatically records to S3
const startIVSStream = async (streamKey) => {
  // IVS configuration with auto-recording
  const ivsConfig = {
    streamKey: streamKey,
    recordingConfigurationArn:
      "arn:aws:ivs:region:account:recording-configuration/xxx",
    // IVS will auto-save to S3
  };

  // After stream ends, IVS triggers webhook with S3 URL
};

// Webhook handler (called by IVS)
app.post("/webhooks/ivs-recording-complete", async (req, res) => {
  const { streamArn, recordingS3Location } = req.body;

  // Update stream with recording URL
  await fetch(`${API_URL}/streams/${streamId}/stop-live`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recordingUrl: recordingS3Location,
      playbackUrl: recordingS3Location,
    }),
  });

  res.sendStatus(200);
});
```

### Option 2: LiveKit with S3 Egress

```javascript
import { EgressClient } from "livekit-server-sdk";

const startLiveKitRecording = async (roomName, streamId) => {
  const egressClient = new EgressClient(
    "https://your-livekit-server.com",
    "api-key",
    "secret"
  );

  // Start recording to S3
  const egress = await egressClient.startRoomCompositeEgress(roomName, {
    s3: {
      accessKey: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_BUCKET_NAME,
      prefix: `stream-recordings/${streamId}/`,
    },
    fileType: "mp4",
  });

  return egress.egressId;
};

// When recording finishes
egressClient.onEgressEnded(async (egressInfo) => {
  const s3Url = egressInfo.fileResults[0].location;

  // Update database
  await fetch(`${API_URL}/streams/${streamId}/end`, {
    method: "PATCH",
    body: JSON.stringify({ recordingUrl: s3Url }),
  });
});
```

### Option 3: MediaRecorder API (Browser Recording)

```javascript
let mediaRecorder;
let recordedChunks = [];

// Start recording
const startRecording = (stream) => {
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9",
    videoBitsPerSecond: 2500000,
  });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const file = new File([blob], "recording.webm", { type: "video/webm" });

    // Upload to backend
    await uploadRecording(currentStreamId, file);
    recordedChunks = [];
  };

  mediaRecorder.start(1000); // Collect data every second
};

// Stop recording
const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
};
```

---

## 📊 Storage & Cost Optimization

### S3 Lifecycle Policy

Automatically delete old recordings after 90 days:

```json
{
  "Rules": [
    {
      "Id": "DeleteOldRecordings",
      "Status": "Enabled",
      "Prefix": "stream-recordings/",
      "Expiration": {
        "Days": 90
      }
    },
    {
      "Id": "MoveToGlacierAfter30Days",
      "Status": "Enabled",
      "Prefix": "stream-recordings/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

### CloudFront CDN (Optional)

Better performance for video playback:

```javascript
// Use CloudFront URL instead of direct S3
const playbackUrl = `https://d123456789.cloudfront.net/stream-recordings/${streamId}/recording.mp4`;
```

---

## 🧪 Testing with Postman

### Test Workflow:

1. **Start Stream**

   ```
   POST /streams/start
   → Get streamId
   ```

2. **Simulate Recording**

   ```
   (Record 30 seconds of test video)
   ```

3. **End Stream**

   ```
   PATCH /streams/:streamId/end
   ```

4. **Upload Recording**

   ```
   POST /streams/:streamId/recording
   Body: form-data → recording: test-video.mp4
   → Get recordingUrl
   ```

5. **Get Recorded Streams**

   ```
   GET /streams/recorded
   → See your recording in the list
   ```

6. **Get Specific Recording**
   ```
   GET /streams/:streamId/recording
   → Get recordingUrl for playback
   ```

---

## 🔍 Troubleshooting

### Issue: "Recording not available"

**Solution:** Check if `recordingUrl` field has value in database

### Issue: "S3 upload failed"

**Solutions:**

1. Check AWS credentials in .env
2. Verify S3 bucket exists
3. Check IAM permissions
4. Ensure bucket is in correct region

### Issue: "Video not playing"

**Solutions:**

1. Check S3 bucket CORS configuration
2. Verify bucket policy allows public read
3. Check video file format (use mp4 for best compatibility)

### Issue: "403 Forbidden"

**Solutions:**

1. Make S3 objects public read
2. Update bucket policy
3. Check IAM user permissions

---

## 📱 Frontend Video Player Integration

### Using HTML5 Video Player

```html
<video id="recording-player" controls width="100%">
  <source id="video-source" src="" type="video/mp4" />
  Your browser does not support the video tag.
</video>

<script>
  const loadRecording = async (streamId) => {
    const response = await fetch(`${API_URL}/streams/${streamId}/recording`);
    const result = await response.json();

    document.getElementById("video-source").src = result.data.recordingUrl;
    document.getElementById("recording-player").load();
  };
</script>
```

### Using Video.js

```html
<link href="https://vjs.zencdn.net/8.3.0/video-js.css" rel="stylesheet" />
<video
  id="my-video"
  class="video-js"
  controls
  preload="auto"
  width="640"
  height="360"
></video>

<script src="https://vjs.zencdn.net/8.3.0/video.min.js"></script>
<script>
  const player = videojs("my-video");

  const loadRecording = async (streamId) => {
    const response = await fetch(`${API_URL}/streams/${streamId}/recording`);
    const result = await response.json();

    player.src({
      src: result.data.recordingUrl,
      type: "video/mp4",
    });
  };
</script>
```

---

**All recording APIs ready! 🎉**

Stream শেষ হওয়ার পর automatically বা manually recording S3 এ upload করতে পারবেন এবং recorded streams list/play করতে পারবেন।

---

## 📚 Related Documentation

- **[COMPLETE_STREAM_GUIDE.md](COMPLETE_STREAM_GUIDE.md)** - Full streaming platform documentation with all 13 endpoints and React components
- **[API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md)** - Quick lookup for all stream endpoints, query parameters, and status codes
- **[STREAM_API_POSTMAN.md](STREAM_API_POSTMAN.md)** - Postman collection setup, curl commands, and testing guide
