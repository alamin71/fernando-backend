// Debug script - Check database streams and their recording status
require("dotenv").config();
const mongoose = require("mongoose");

async function checkDatabaseStreams() {
  try {
    // Connect to MongoDB
    const dbUrl = process.env.DATABASE_URL;
    console.log("\n🔗 Connecting to MongoDB...");
    console.log(`   URL: ${dbUrl.substring(0, 50)}...`);

    await mongoose.connect(dbUrl);
    console.log("   ✅ Connected!\n");

    // Define Stream schema (minimal)
    const streamSchema = new mongoose.Schema({
      creatorId: mongoose.Schema.Types.ObjectId,
      title: String,
      status: String, // LIVE, OFFLINE, SCHEDULED
      startedAt: Date,
      endedAt: Date,
      recordingUrl: String,
      playbackUrl: String,
    });

    const Stream = mongoose.model("Stream", streamSchema, "streams");

    // Get all OFFLINE streams from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log("📊 Database Stream Status:\n");
    console.log(
      `Looking for OFFLINE streams from ${sevenDaysAgo.toLocaleDateString()} onwards\n`,
    );

    const offlineStreams = await Stream.find({
      status: "OFFLINE",
      startedAt: { $gte: sevenDaysAgo },
    })
      .sort({ startedAt: -1 })
      .limit(20);

    console.log(`Found ${offlineStreams.length} OFFLINE streams:\n`);

    if (offlineStreams.length === 0) {
      console.log("❌ No OFFLINE streams found!");
      console.log("   → Either no streams have been ended");
      console.log("   → Or all streams are still LIVE\n");
    } else {
      offlineStreams.forEach((stream, index) => {
        console.log(`${index + 1}. ${stream.title || "Untitled"}`);
        console.log(`   Status: ${stream.status}`);
        console.log(
          `   Started: ${stream.startedAt?.toLocaleString() || "N/A"}`,
        );
        console.log(`   Ended: ${stream.endedAt?.toLocaleString() || "N/A"}`);
        console.log(
          `   Recording URL: ${stream.recordingUrl ? "✅ " + stream.recordingUrl : "❌ NOT SET"}`,
        );
        console.log(
          `   Duration: ${
            stream.startedAt && stream.endedAt
              ? Math.floor((stream.endedAt - stream.startedAt) / 1000) + "s"
              : "N/A"
          }`,
        );
        console.log();
      });
    }

    // Check LIVE streams
    console.log("\n📡 Current LIVE Streams:\n");
    const liveStreams = await Stream.find({ status: "LIVE" }).limit(10);

    if (liveStreams.length === 0) {
      console.log("❌ No LIVE streams currently");
    } else {
      console.log(`Found ${liveStreams.length} LIVE stream(s):\n`);
      liveStreams.forEach((stream, index) => {
        console.log(`${index + 1}. ${stream.title || "Untitled"}`);
        console.log(`   Started: ${stream.startedAt?.toLocaleString()}`);
        console.log(
          `   Duration: ${Math.floor((new Date() - stream.startedAt) / 1000)}s`,
        );
        console.log();
      });
    }

    // Summary
    console.log("\n═══════════════════════════════════════════\n");
    console.log("NEXT STEPS:\n");

    if (offlineStreams.length === 0) {
      console.log("1. Create and end a stream using the API:");
      console.log("   POST /api/v1/streams - to start");
      console.log("   PUT /api/v1/streams/:id/end - to end");
      console.log("\n2. Make sure the stream lasts 30+ seconds");
      console.log("\n3. Wait 2-5 minutes for IVS to process");
      console.log("\n4. Check S3 for new files");
    } else {
      console.log("Streams found in DB!");
      console.log("Check which ones are missing recordingUrl:");
      const missingRecordings = offlineStreams.filter((s) => !s.recordingUrl);
      if (missingRecordings.length > 0) {
        console.log(
          `\n${missingRecordings.length} streams missing recording URLs`,
        );
        console.log("These need to be matched with S3 files");
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.message.includes("connect")) {
      console.log("\n⚠️  Could not connect to MongoDB");
      console.log("Check your DATABASE_URL in .env");
    }
  }
}

checkDatabaseStreams();
