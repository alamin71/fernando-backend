// Live Stream Test Guide - How to properly test IVS recording
const config = {
  ivsIngestEndpoint:
    "rtmps://bdfffd168b47.global-contribute.live-video.net:443/app/",
  ivsStreamKey: "sk_us-east-1_aOnw31UmmeVz_CeSex8BYDPzlfPQa03mUZ9KOZQMcYi",
  ivsPlaybackUrl:
    "https://bdfffd168b47.us-east-1.playback.live-video.net/api/video/v1/us-east-1.504956988903.channel.2DmwQzILLrtf.m3u8",
};

console.log(`
╔════════════════════════════════════════════════════════════════╗
║         IVS LIVE STREAMING & RECORDING TEST GUIDE              ║
╚════════════════════════════════════════════════════════════════╝

⚠️  IMPORTANT: Your IVS recording configuration is CORRECT!
   The issue is that video is NOT being broadcast/published.

═══════════════════════════════════════════════════════════════════

📺 TO TEST LIVE STREAMING & RECORDING:

1️⃣  Use OBS Studio (or any RTMPS streaming software):
   ├─ Server (RTMP URL): ${config.ivsIngestEndpoint}
   ├─ Stream Key: ${config.ivsStreamKey}
   └─ Stream at least for 15-30 seconds minimum

2️⃣  Alternative: Use FFmpeg to test:
   └─ ffmpeg -f gdigrab -i desktop -c:v libx264 -c:a aac -f flv "rtmps://${config.ivsStreamKey}@bdfffd168b47.global-contribute.live-video.net:443/app/"

3️⃣  Watch the stream live:
   └─ URL: ${config.ivsPlaybackUrl}

4️⃣  Stop streaming (minimum 15 seconds broadcast time)

5️⃣  Wait 2-5 minutes for IVS to process recording

6️⃣  Check your backend API:
   └─ GET /api/v1/streams/recordings?page=1&limit=20
   └─ You should see the recording with playback URL

═══════════════════════════════════════════════════════════════════

✅ YOUR CURRENT SETUP IS CORRECT:
   ✓ IVS Channel: fernando
   ✓ Recording Configuration: fernando-live (ACTIVE)
   ✓ S3 Bucket: fernando-buckets
   ✓ Recording Destination: s3://fernando-buckets/ivs/v1/504956988903/2DmwQzILLrtf/

═══════════════════════════════════════════════════════════════════

🔴 IF VIDEOS STILL NOT SAVING:

Check:
1. Stream duration - must be > 15 seconds minimum
2. Stream quality - IVS must receive video frames
3. Recording processing time - wait 5+ minutes
4. S3 bucket permissions - check CORS & bucket policies
5. CloudWatch logs - check IVS service logs for errors

═══════════════════════════════════════════════════════════════════

🎯 FOR TESTING LOCALLY:
   
   Use OBS Studio:
   Settings → Stream
   ├─ Service: Custom...
   ├─ Server: ${config.ivsIngestEndpoint}
   └─ Stream Key: ${config.ivsStreamKey}
   
   Then click "Start Streaming" for 30+ seconds

═══════════════════════════════════════════════════════════════════
`);
