// Show actual S3 recording structure
require("dotenv").config();
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.region || "us-east-1",
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  },
});

async function showRecordingStructure() {
  try {
    const bucket = process.env.AWS_BUCKET_NAME || "fernando-buckets";
    const prefix = `ivs/v1/504956988903/2DmwQzILLrtf/`;

    console.log(
      `\n╔════════════════════════════════════════════════════════════╗`,
    );
    console.log(
      `║           IVS RECORDING S3 STRUCTURE                       ║`,
    );
    console.log(
      `╚════════════════════════════════════════════════════════════╝\n`,
    );

    console.log(`Bucket: ${bucket}`);
    console.log(`Prefix: ${prefix}\n`);

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 500,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      console.log("❌ No files found");
      return;
    }

    // Group by date
    const byDate = {};

    response.Contents.forEach((obj) => {
      // Extract date from path: ivs/v1/{accountId}/{channelId}/{year}/{month}/{day}/...
      const pathParts = obj.Key.split("/");
      if (pathParts.length >= 9) {
        const year = pathParts[5];
        const month = pathParts[6];
        const day = pathParts[7];
        const hour = pathParts[8];
        const minute = pathParts[9] || "--";
        const sessionId = pathParts[10] || "unknown";

        const dateKey = `${year}/${month}/${day}`;
        const timeKey = `${hour}:${minute}`;

        if (!byDate[dateKey]) {
          byDate[dateKey] = {};
        }
        if (!byDate[dateKey][timeKey]) {
          byDate[dateKey][timeKey] = [];
        }

        byDate[dateKey][timeKey].push({
          path: obj.Key,
          size: obj.Size,
          modified: obj.LastModified,
          sessionId: sessionId,
        });
      }
    });

    // Print organized view
    Object.keys(byDate)
      .sort()
      .reverse()
      .forEach((dateKey) => {
        console.log(`\n📅 ${dateKey}`);
        console.log(`${"═".repeat(60)}`);

        Object.keys(byDate[dateKey])
          .sort()
          .reverse()
          .forEach((timeKey) => {
            const recordings = byDate[dateKey][timeKey];
            console.log(`  ⏰ ${timeKey}`);

            recordings.forEach((rec) => {
              const isPlaylist = rec.path.includes("master.m3u8");
              const icon = isPlaylist ? "🎬" : "📹";
              console.log(`     ${icon} ${rec.sessionId}`);

              if (isPlaylist) {
                const s3Url = `s3://${bucket}/${rec.path}`;
                const httpUrl = `https://${bucket}.s3.${process.env.region || "us-east-1"}.amazonaws.com/${rec.path}`;
                console.log(`        Path: ${rec.path}`);
                console.log(`        URL: ${httpUrl}`);
              }
            });
          });
      });

    console.log(
      `\n\n╔════════════════════════════════════════════════════════════╗`,
    );
    console.log(
      `║              HOW IVS RECORDING WORKS                        ║`,
    );
    console.log(
      `╚════════════════════════════════════════════════════════════╝\n`,
    );

    console.log(`1️⃣  Stream লাইভ হয় → IVS সার্ভারে video যায়`);
    console.log(`2️⃣  IVS Recording Config linked → Auto S3 তে save হয়`);
    console.log(`3️⃣  Path automatically create হয়:`);
    console.log(
      `    ivs/v1/{accountId}/{channelId}/{YYYY}/{M}/{D}/{HH}/{MM}/{SESSION_ID}/\n`,
    );

    console.log(`⚠️  IMPORTANT: আমাদের code S3 তে save করে না!`);
    console.log(`   ✓ IVS automatically save করে`);
    console.log(`   ✓ আমরা শুধু খুঁজে বের করি\n`);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

showRecordingStructure();
