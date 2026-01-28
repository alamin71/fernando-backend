// Test the getRecordedStreams logic locally
require("dotenv").config();
const mongoose = require("mongoose");
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.region || "us-east-1",
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  },
});

async function testGetRecordedStreams() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Connected to MongoDB\n");

    // Define schema
    const streamSchema = new mongoose.Schema({}, { strict: false });
    const Stream = mongoose.model("Stream", streamSchema, "streams");

    console.log(
      "╔════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║         Testing getRecordedStreams Logic                   ║",
    );
    console.log(
      "╚════════════════════════════════════════════════════════════╝\n",
    );

    const bucket = process.env.AWS_BUCKET_NAME || "fernando-buckets";
    const channelId = "2DmwQzILLrtf";
    const accountId = "504956988903";
    const basePrefix = `ivs/v1/${accountId}/${channelId}/`;

    console.log(`📁 Fetching S3 recordings from: ${basePrefix}\n`);

    // Get all recordings from S3
    const s3Recordings = [];
    let continuationToken;
    let pageCount = 0;

    do {
      pageCount++;
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: basePrefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const response = await s3Client.send(command);

      response.Contents?.forEach((obj) => {
        if (obj.Key?.endsWith("/media/hls/master.m3u8")) {
          const sessionPath = obj.Key.replace("/media/hls/master.m3u8", "");
          s3Recordings.push({
            path: `/${sessionPath}`,
            modifiedAt: obj.LastModified || new Date(),
          });
        }
      });

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    console.log(
      `✅ Found ${s3Recordings.length} recordings in S3 (${pageCount} pages)\n`,
    );

    // Sort by modified date
    s3Recordings.sort(
      (a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime(),
    );

    console.log("📝 S3 Recordings:\n");
    s3Recordings.forEach((rec, i) => {
      console.log(
        `${i + 1}. ${rec.path.substring(rec.path.lastIndexOf("/") - 15)}`,
      );
      console.log(`   Modified: ${rec.modifiedAt.toLocaleString()}`);
    });

    // Get database streams
    console.log("\n\n📊 Database OFFLINE Streams:\n");
    const allOfflineStreams = await Stream.find({ status: "OFFLINE" })
      .select("_id title startedAt endedAt recordingUrl")
      .sort({ startedAt: -1 })
      .lean();

    console.log(`Found ${allOfflineStreams.length} streams in database\n`);

    // Create date map
    const streamDataMap = new Map();
    allOfflineStreams.forEach((stream) => {
      if (stream.startedAt) {
        const date = new Date(stream.startedAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1);
        const day = String(date.getDate());
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");
        const dateKey = `${year}/${month}/${day}/${hour}/${minute}`;

        if (!streamDataMap.has(dateKey)) {
          streamDataMap.set(dateKey, []);
        }
        streamDataMap.get(dateKey).push(stream);
      }
    });

    // Try to match S3 recordings with database streams
    console.log("🔄 Matching S3 Recordings with Database Streams:\n");

    let matched = 0;
    let unmatched = 0;

    s3Recordings.forEach((recording, i) => {
      // Extract date from path
      const pathParts = recording.path.split("/");
      const year = pathParts[5];
      const month = pathParts[6];
      const day = pathParts[7];
      const hour = pathParts[8];
      const minute = pathParts[9];
      const sessionId = pathParts[10];

      const dateKey = `${year}/${month}/${day}/${hour}/${minute}`;
      const exactMatch = streamDataMap.get(dateKey)?.[0];

      console.log(`\n${i + 1}. Recording: ${sessionId}`);
      console.log(`   Path: ${recording.path.substring(0, 80)}...`);
      console.log(`   Date: ${year}/${month}/${day} ${hour}:${minute}`);
      console.log(
        `   Exact Match: ${exactMatch ? `✅ ${exactMatch.title}` : "❌ None"}`,
      );

      if (!exactMatch) {
        // Try broader search
        const dateKeyBroad = `${year}/${month}/${day}`;
        const streamsOnDate = allOfflineStreams.filter((s) => {
          const sDate = new Date(s.startedAt);
          return (
            sDate.getFullYear() === parseInt(year) &&
            sDate.getMonth() + 1 === parseInt(month) &&
            sDate.getDate() === parseInt(day)
          );
        });

        if (streamsOnDate.length > 0) {
          const closest = streamsOnDate.reduce((prev, curr) => {
            const currTime = new Date(curr.startedAt).getTime();
            const prevTime = new Date(prev.startedAt).getTime();
            const recordingTime = recording.modifiedAt.getTime();
            const currDiff = Math.abs(currTime - recordingTime);
            const prevDiff = Math.abs(prevTime - recordingTime);
            return currDiff < prevDiff ? curr : prev;
          });

          console.log(
            `   Broad Match: ✅ ${closest.title} (${streamsOnDate.length} streams on this date)`,
          );
          matched++;
        } else {
          console.log(`   Broad Match: ❌ No streams found on this date`);
          unmatched++;
        }
      } else {
        matched++;
      }
    });

    console.log(
      `\n\n╔════════════════════════════════════════════════════════════╗`,
    );
    console.log(
      `║                    SUMMARY                                 ║`,
    );
    console.log(
      `╚════════════════════════════════════════════════════════════╝\n`,
    );
    console.log(`✅ S3 Recordings: ${s3Recordings.length}`);
    console.log(`✅ DB Streams: ${allOfflineStreams.length}`);
    console.log(`✅ Matched: ${matched}`);
    console.log(`❌ Unmatched: ${unmatched}`);
    console.log(
      `\nMatching Rate: ${((matched / s3Recordings.length) * 100).toFixed(1)}%\n`,
    );

    if (unmatched > 0) {
      console.log(
        "❌ PROBLEM: Some S3 recordings not matching database streams!",
      );
      console.log("   → Check if stream was actually created in API\n");
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testGetRecordedStreams();
