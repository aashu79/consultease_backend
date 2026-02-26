import { env } from "./env";
import { AwsS3StorageProvider } from "../services/aws.storage.provider";
import { MinioStorageProvider } from "../services/minio.storage.provider";
import { StorageProvider } from "../services/storage.provider";

let storageProvider: StorageProvider;

if (env.STORAGE_PROVIDER === "AWS_S3") {
  storageProvider = new AwsS3StorageProvider();
} else {
  storageProvider = new MinioStorageProvider();
}

export { storageProvider };
