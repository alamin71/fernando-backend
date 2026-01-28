// Test the recording finder logic
require("dotenv").config();
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.region || "us-east-1",
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  },
});

async function findRecordingPath(accountId, channelId, startDate) {
  try {
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1);
    const day = String(startDate.getDate());
    const bucket = process.env.AWS_BUCKET_NAME || "fernando-buckets";

    // IVS uses inconsistent path formats - try both
    const prefixesToTry = [
      // Non-zero-padded (what IVS actually uses)
      `ivs/v1/${accountId}/${channelId}/${year}/${month}/${day}/`,
      // Zero-padded
      `ivs/v1/${accountId}/${channelId}/${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}/`,
    ];

    for (const datePrefix of prefixesToTry) {
      console.log(`\n🔍 Searching: ${datePrefix}`);

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: datePrefix,
        MaxKeys: 100,
      });

      const response = await s3Client.send(command);

      if (response.Contents && response.Contents.length > 0) {
        console.log(`   Found ${response.Contents.length} files`);
      }

      const masterFile = response.Contents?.find((obj) =>
        obj.Key?.endsWith("/media/hls/master.m3u8"),
      );

      if (masterFile?.Key) {
        const sessionPath = masterFile.Key.replace(
          "/media/hls/master.m3u8",
          "",
        );
        console.log(`   ✅ SUCCESS! Recording path: ${sessionPath}`);
        const fullUrl = `https://${bucket}.s3.${process.env.region || "us-east-1"}.amazonaws.com/${masterFile.Key}`;
        console.log(`   🎥 Playback URL: ${fullUrl}`);
        return sessionPath;
      }
    }

    console.log(`   ❌ No recording found`);
    return null;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return null;
  }
}

// Test with the actual recording date from S3
async function runTests() {
  console.log("=== Testing Recording Finder ===\n");

  const accountId = "504956988903";
  const channelId = "2DmwQzILLrtf";

  // Test 1: Jan 26, 2026 20:34 (we know this exists)
  console.log("TEST 1: Known recording from Jan 26, 2026");
  const testDate1 = new Date("2026-01-26T14:34:00Z"); // Adjusted for timezone
  await findRecordingPath(accountId, channelId, testDate1);

  // Test 2: Jan 26, 2026 21:48 (second recording)
  console.log("\n\nTEST 2: Second recording from Jan 26, 2026");
  const testDate2 = new Date("2026-01-26T15:48:00Z"); // Adjusted for timezone
  await findRecordingPath(accountId, channelId, testDate2);

  // Test 3: Today (should not exist)
  console.log("\n\nTEST 3: Today (should not exist)");
  const today = new Date();
  await findRecordingPath(accountId, channelId, today);

  console.log("\n\n=== Test Complete ===");
}

runTests();
