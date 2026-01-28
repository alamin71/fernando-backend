// Check IVS Channel Recording Configuration
require("dotenv").config();
const {
  IvsClient,
  GetChannelCommand,
  GetRecordingConfigurationCommand,
  ListRecordingConfigurationsCommand,
} = require("@aws-sdk/client-ivs");

const ivsClient = new IvsClient({
  region: process.env.IVS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  },
});

async function checkIVSRecordingConfig() {
  try {
    const channelArn =
      process.env.IVS_CHANNEL_ARN ||
      "arn:aws:ivs:us-east-1:504956988903:channel/2DmwQzILLrtf";

    console.log("\n=== IVS Channel Recording Configuration Check ===\n");
    console.log(`Channel ARN: ${channelArn}\n`);

    // 1. Get Channel Details
    console.log("1️⃣  Fetching Channel Details...");
    const getChannelCmd = new GetChannelCommand({ arn: channelArn });
    const channelResponse = await ivsClient.send(getChannelCmd);

    const channel = channelResponse.channel;
    console.log(`   Channel Name: ${channel.name}`);
    console.log(`   Channel Type: ${channel.type}`);
    console.log(`   Ingest Endpoint: ${channel.ingestEndpoint}`);
    console.log(
      `   Recording Config ARN: ${channel.recordingConfigurationArn || "❌ NOT SET"}\n`,
    );

    if (!channel.recordingConfigurationArn) {
      console.log(
        "   ⚠️  ERROR: No Recording Configuration linked to this channel!",
      );
      console.log(
        "   You need to link a Recording Configuration to enable recording.\n",
      );
    }

    // 2. List All Recording Configurations
    console.log("2️⃣  Listing All Recording Configurations...");
    const listConfigCmd = new ListRecordingConfigurationsCommand({});
    const configsResponse = await ivsClient.send(listConfigCmd);

    if (
      configsResponse.recordingConfigurations &&
      configsResponse.recordingConfigurations.length > 0
    ) {
      console.log(
        `   Found ${configsResponse.recordingConfigurations.length} recording configuration(s):\n`,
      );

      for (const config of configsResponse.recordingConfigurations) {
        console.log(`   📝 Name: ${config.name}`);
        console.log(`      ARN: ${config.arn}`);
        console.log(`      State: ${config.state}`);
        console.log(
          `      Destination: ${config.destinationConfiguration?.s3?.bucketName || "N/A"}`,
        );

        if (channel.recordingConfigurationArn === config.arn) {
          console.log(`      ✅ THIS IS THE ACTIVE CONFIG FOR YOUR CHANNEL`);
        }
        console.log();
      }
    } else {
      console.log("   ❌ No Recording Configurations found!\n");
    }

    // 3. Get Active Recording Configuration Details
    if (channel.recordingConfigurationArn) {
      console.log("3️⃣  Getting Active Recording Configuration Details...");
      const getConfigCmd = new GetRecordingConfigurationCommand({
        arn: channel.recordingConfigurationArn,
      });

      const configResponse = await ivsClient.send(getConfigCmd);
      const config = configResponse.recordingConfiguration;

      console.log(`   Name: ${config.name}`);
      console.log(`   State: ${config.state}`);
      console.log(
        `   Destination Type: ${config.destinationConfiguration?.s3 ? "S3" : "Unknown"}`,
      );
      if (config.destinationConfiguration?.s3) {
        console.log(
          `   S3 Bucket: ${config.destinationConfiguration.s3.bucketName}`,
        );
      }
      console.log(
        `   Rendition Config: ${config.recordingRecommendedBitrate ? "Enabled" : "Disabled"}\n`,
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code === "ValidationException") {
      console.log("\n⚠️  Channel might not exist or ARN is invalid");
    }
  }
}

checkIVSRecordingConfig();
