import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import config from "../config/index";

/**
 * Set up CORS on S3 bucket to allow playback from web browsers
 * Run this once during initialization
 */
export const setupS3CORS = async () => {
  try {
    const s3Client = new S3Client({
      region: config.aws.region || "us-east-1",
      credentials: {
        accessKeyId: config.aws.accessKeyId || "",
        secretAccessKey: config.aws.secretAccessKey || "",
      },
    });

    const bucketName = config.aws.bucket || "fernando-buckets";

    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "HEAD"],
          AllowedOrigins: ["*"], // In production, specify your domain
          ExposeHeaders: ["ETag", "x-amz-version-id"],
          MaxAgeSeconds: 3000,
        },
      ],
    };

    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration,
    });

    await s3Client.send(command);
    console.log(`✅ CORS configured successfully on bucket: ${bucketName}`);
  } catch (error) {
    console.error("❌ Failed to configure CORS on S3 bucket:", error);
    // Don't throw - this is initialization and shouldn't crash the app
  }
};

/**
 * Alternative: Update CORS to be more restrictive (production)
 * Specify your actual domain instead of "*"
 */
export const setupS3CORSSecure = async (allowedOrigins: string[]) => {
  try {
    const s3Client = new S3Client({
      region: config.aws.region || "us-east-1",
      credentials: {
        accessKeyId: config.aws.accessKeyId || "",
        secretAccessKey: config.aws.secretAccessKey || "",
      },
    });

    const bucketName = config.aws.bucket || "fernando-buckets";

    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "HEAD"],
          AllowedOrigins: allowedOrigins,
          ExposeHeaders: ["ETag", "x-amz-version-id"],
          MaxAgeSeconds: 3000,
        },
      ],
    };

    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration,
    });

    await s3Client.send(command);
    console.log(
      `✅ Secure CORS configured on bucket: ${bucketName}`,
      allowedOrigins,
    );
  } catch (error) {
    console.error("❌ Failed to configure secure CORS on S3 bucket:", error);
  }
};
