export type SignedUploadInput = {
  bucket: string;
  objectKey: string;
  mimeType: string;
  expiresInSeconds: number;
};

export type SignedDownloadInput = {
  bucket: string;
  objectKey: string;
  expiresInSeconds: number;
};

export type HeadObjectInput = {
  bucket: string;
  objectKey: string;
};

export type HeadObjectOutput = {
  sizeBytes: bigint;
  etag?: string;
};

export interface StorageProvider {
  getSignedUploadUrl(input: SignedUploadInput): Promise<string>;
  getSignedDownloadUrl(input: SignedDownloadInput): Promise<string>;
  headObject(input: HeadObjectInput): Promise<HeadObjectOutput>;
  deleteObject?(input: HeadObjectInput): Promise<void>;
}
