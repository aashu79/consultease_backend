import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import {
  HeadObjectInput,
  HeadObjectOutput,
  SignedDownloadInput,
  SignedUploadInput,
  StorageProvider,
} from "./storage.provider";

export class AwsS3StorageProvider implements StorageProvider {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.AWS_REGION,
      credentials: env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
    });
  }

  async getSignedUploadUrl(input: SignedUploadInput): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.objectKey,
      ContentType: input.mimeType,
    });
    return getSignedUrl(this.client, command, { expiresIn: input.expiresInSeconds });
  }

  async getSignedDownloadUrl(input: SignedDownloadInput): Promise<string> {
    const command = new GetObjectCommand({ Bucket: input.bucket, Key: input.objectKey });
    return getSignedUrl(this.client, command, { expiresIn: input.expiresInSeconds });
  }

  async headObject(input: HeadObjectInput): Promise<HeadObjectOutput> {
    const response = await this.client.send(
      new HeadObjectCommand({
        Bucket: input.bucket,
        Key: input.objectKey,
      }),
    );

    return {
      sizeBytes: BigInt(response.ContentLength ?? 0),
      etag: response.ETag,
    };
  }

  async deleteObject(): Promise<void> {
    return;
  }
}
