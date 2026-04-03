import {
  DeleteObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { v7 as uuidv7 } from "uuid";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { StorageManager } from "@/core/domain/staff/ports/storageManager";

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) {
    return "";
  }
  return filename.slice(lastDot);
}

export class S3StorageManager implements StorageManager {
  constructor(
    private readonly client: S3Client,
    private readonly bucketName: string,
    private readonly region: string,
    private readonly endpoint: string | undefined,
  ) {}

  async uploadImage(file: File): Promise<string> {
    const extension = getExtension(file.name);
    const key = `images/${uuidv7()}${extension}`;
    const buffer = new Uint8Array(await file.arrayBuffer());

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        }),
      );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to upload image to S3",
        error,
      );
    }

    return key;
  }

  async deleteImage(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to delete image from S3",
        error,
      );
    }
  }

  resolveImageUrl(key: string): string {
    if (this.endpoint) {
      return `${this.endpoint}/${this.bucketName}/${key}`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
