// Test script to check S3 IVS recordings
require("dotenv").config();
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.region || "us-east-1",
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  },
});

async function checkIVSRecordings() {
  try {
    const bucket = process.env.AWS_BUCKET_NAME || "fernando-buckets";
    const prefix = "ivs/v1/504956988903/2DmwQzILLrtf/";

    console.log(`\n🔍 Checking S3 bucket: ${bucket}`);
    console.log(`📁 Prefix: ${prefix}\n`);

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 1000,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      console.log("❌ NO FILES FOUND!");
      console.log("\n⚠️  Possible reasons:");
      console.log("   1. No stream has been broadcasted yet");
      console.log("   2. Recording is not enabled in IVS");
      console.log("   3. Stream was too short (< 10 seconds)");
      console.log(
        "   4. Recording is still processing (wait 2-5 minutes after stream ends)",
      );
      return;
    }

    console.log(`✅ Found ${response.Contents.length} files:\n`);

    // Group by date/hour
    const masterFiles = response.Contents.filter((obj) =>
      obj.Key?.endsWith("/media/hls/master.m3u8"),
    );

    if (masterFiles.length > 0) {
      console.log(`🎥 Found ${masterFiles.length} recording(s):\n`);
      masterFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.Key}`);
        console.log(`   Size: ${(file.Size / 1024).toFixed(2)} KB`);
        console.log(`   Modified: ${file.LastModified}`);

        // Extract session path
        const sessionPath = file.Key.replace("/media/hls/master.m3u8", "");
        const fullUrl = `https://${bucket}.s3.${process.env.region || "us-east-1"}.amazonaws.com/${file.Key}`;
        console.log(`   URL: ${fullUrl}\n`);
      });
    } else {
      console.log("⚠️  Files found but no master.m3u8 files yet");
      console.log("   Recording might still be processing...\n");

      // Show first 10 files
      console.log("First 10 files found:");
      response.Contents.slice(0, 10).forEach((file) => {
        console.log(`   - ${file.Key}`);
      });
    }

    // Check for today's recordings
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayPrefix = `${prefix}${year}/${month}/${day}/`;

    console.log(`\n📅 Checking today's recordings: ${todayPrefix}`);

    const todayFiles = response.Contents.filter((obj) =>
      obj.Key?.startsWith(todayPrefix),
    );

    if (todayFiles.length > 0) {
      console.log(`   ✅ Found ${todayFiles.length} files from today`);
    } else {
      console.log(`   ❌ No recordings from today`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.name === "AccessDenied") {
      console.log("\n⚠️  Access Denied - Check S3 bucket permissions");
    }
  }
}

checkIVSRecordings();
