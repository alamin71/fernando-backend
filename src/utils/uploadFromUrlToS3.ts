// import AWS from "aws-sdk";
// import axios from "axios";
// import { v4 as uuidv4 } from "uuid";
// import path from "path";
// import config from "../config";

// const s3 = new AWS.S3({
//   accessKeyId: config.aws.accessKeyId,
//   secretAccessKey: config.aws.secretAccessKey,
//   region: config.aws.region,
// });

// export const uploadFromUrlToS3 = async (
//   fileUrl: string,
//   folder = "wallet/aiImage/"
// ) => {
//   const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
//   const fileExtension = path.extname(new URL(fileUrl).pathname) || ".png";
//   const generatedId = uuidv4(); // Generate unique ID
//   const fileName = `${folder}${generatedId}${fileExtension}`;

//   const uploadParams = {
//     Bucket: config.aws.bucket!,
//     Key: fileName,
//     Body: response.data,
//     ContentType: "image/png",
//     // ACL: 'public-read', // ⚠️ Skip this if bucket doesn't allow it
//   };

//   await s3.upload(uploadParams).promise();

//   const imageUrl = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${fileName}`;

//   // ✅ Return full object for Mongoose schema
//   return {
//     id: generatedId,
//     url: imageUrl,
//   };
// };
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import config from "../config";

// ✅ Create S3 Client (v3 style)
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId!,
    secretAccessKey: config.aws.secretAccessKey!,
  },
});

export const uploadFromUrlToS3 = async (
  fileUrl: string,
  folder = "wallet/aiImage/"
) => {
  // 1️⃣ Download file using axios
  const response = await axios.get(fileUrl, { responseType: "arraybuffer" });

  // 2️⃣ Extract file extension or default ".png"
  const fileExtension = path.extname(new URL(fileUrl).pathname) || ".png";
  const generatedId = uuidv4();
  const fileName = `${folder}${generatedId}${fileExtension}`;

  // 3️⃣ Upload to S3 using PutObjectCommand
  const command = new PutObjectCommand({
    Bucket: config.aws.bucket!,
    Key: fileName,
    Body: response.data as Buffer,
    ContentType: "image/png",
    // ACL: "public-read", // use only if bucket policy allows
  });

  await s3Client.send(command);

  // 4️⃣ Construct public URL
  const imageUrl = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${fileName}`;

  return {
    id: generatedId,
    url: imageUrl,
  };
};
