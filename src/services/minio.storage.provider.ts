import { Client } from "minio";
import { env } from "../config/env";
import {
  HeadObjectInput,
  HeadObjectOutput,
  SignedDownloadInput,
  SignedUploadInput,
  StorageProvider,
} from "./storage.provider";

export class MinioStorageProvider implements StorageProvider {
  private readonly client: Client;

  constructor() {
    this.client = new Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: Boolean(env.MINIO_USE_SSL),
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }

  async getSignedUploadUrl(input: SignedUploadInput): Promise<string> {
    return this.client.presignedPutObject(input.bucket, input.objectKey, input.expiresInSeconds);
  }

  async getSignedDownloadUrl(input: SignedDownloadInput): Promise<string> {
    return this.client.presignedGetObject(input.bucket, input.objectKey, input.expiresInSeconds);
  }

  async headObject(input: HeadObjectInput): Promise<HeadObjectOutput> {
    const stat = await this.client.statObject(input.bucket, input.objectKey);
    return {
      sizeBytes: BigInt(stat.size),
      etag: stat.etag,
    };
  }

  async deleteObject(input: HeadObjectInput): Promise<void> {
    await this.client.removeObject(input.bucket, input.objectKey);
  }
}
