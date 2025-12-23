import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import httpStatus from "http-status";
// import mime from 'mime'; // Library to determine MIME types
import config from "../config";
import AppError from "../errors/AppError";
import { s3Client } from "./s3";

// Upload a single file to S3
export const uploadToS3 = async (file: any, fileName: string) => {
  try {
    const uniqueNumber = parseInt(
      (
        Date.now().toString() + Math.floor(Math.random() * 10000).toString()
      ).slice(-8),
      10
    );
    const uniqueFileName = `${fileName}-${uniqueNumber}-${file.originalname}`;

    console.log("S3 Upload Info:", {
      bucket: config.aws.bucket,
      key: uniqueFileName,
      region: config.aws.region,
      hasAccessKey: !!config.aws.accessKeyId,
      hasSecretKey: !!config.aws.secretAccessKey,
    });

    const command = new PutObjectCommand({
      Bucket: config.aws.bucket,
      Key: uniqueFileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    // Generate the publicly accessible URL for the file
    const url = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${uniqueFileName}`;
    return { id: uniqueFileName, url };
  } catch (error: any) {
    console.error("S3 Upload Error:", {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      fullError: error,
    });
    throw new AppError(httpStatus.BAD_REQUEST, "File Upload failed!");
  }
};

// Delete a single file from S3
export const deleteFromS3 = async (key: string) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.aws.bucket,
      Key: key,
    });
    await s3Client.send(command);
  } catch (error) {
    throw new AppError(httpStatus.BAD_REQUEST, "S3 file delete failed");
  }
};

// Upload multiple files to S3
export const uploadManyToS3 = async (
  files: {
    file: any;
    path: string; // Path for the folder, e.g., 'service/'
    originalname?: string; // Optional custom filename
  }[]
): Promise<{ url: string; id: string }[]> => {
  try {
    const uniqueNumber = parseInt(
      (
        Date.now().toString() + Math.floor(Math.random() * 10000).toString()
      ).slice(-8),
      10
    );

    // Map each file upload to a promise
    const uploadPromises = files.map(async ({ file, path, originalname }) => {
      const folderPath = path.endsWith("/") ? path : `${path}/`;
      const uniqueFileName = `${originalname || uniqueNumber}-${
        file.originalname
      }`;
      const fullKey = `${folderPath}${uniqueFileName}`;

      const command = new PutObjectCommand({
        Bucket: config.aws.bucket,
        Key: fullKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);

      // Generate URL for the uploaded file
      const url = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${fullKey}`;
      return { url, id: fullKey };
    });

    // Wait for all uploads to complete
    const uploadedUrls = await Promise.all(uploadPromises);
    return uploadedUrls;
  } catch (error) {
    console.log(error);
    throw new AppError(httpStatus.BAD_REQUEST, "File Upload failed");
  }
};

// Delete multiple files from S3
export const deleteManyFromS3 = async (keys: string[]) => {
  try {
    const deleteParams = {
      Bucket: config.aws.bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: false,
      },
    };

    const command = new DeleteObjectsCommand(deleteParams);
    await s3Client.send(command);
  } catch (error) {
    throw new AppError(httpStatus.BAD_REQUEST, "S3 file delete failed");
  }
};

// Upload stream recording to S3
export const uploadStreamRecordingToS3 = async (
  file: any,
  streamId: string
) => {
  try {
    const timestamp = Date.now();
    const fileName = `stream-recordings/${streamId}/${timestamp}-${file.originalname}`;

    console.log("Recording Upload Info:", {
      bucket: config.aws.bucket,
      key: fileName,
      size: file.size,
      mimetype: file.mimetype,
    });

    const command = new PutObjectCommand({
      Bucket: config.aws.bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype || "video/mp4",
      // Add metadata for better organization
      Metadata: {
        streamId: streamId,
        uploadedAt: timestamp.toString(),
      },
    });

    await s3Client.send(command);

    const url = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${fileName}`;
    return { id: fileName, url };
  } catch (error: any) {
    console.error("Recording Upload Error:", error);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Recording upload failed: " + error.message
    );
  }
};

// Upload recording from URL to S3 (for external recording services)
export const uploadRecordingFromUrl = async (
  videoUrl: string,
  streamId: string
): Promise<{ url: string; id: string }> => {
  try {
    // Fetch video from URL
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const timestamp = Date.now();
    const fileName = `stream-recordings/${streamId}/${timestamp}-recording.mp4`;

    const command = new PutObjectCommand({
      Bucket: config.aws.bucket,
      Key: fileName,
      Body: Buffer.from(buffer),
      ContentType: "video/mp4",
      Metadata: {
        streamId: streamId,
        uploadedAt: timestamp.toString(),
        source: "external",
      },
    });

    await s3Client.send(command);

    const url = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${fileName}`;
    return { id: fileName, url };
  } catch (error: any) {
    console.error("Recording URL Upload Error:", error);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Failed to upload recording from URL: " + error.message
    );
  }
};
