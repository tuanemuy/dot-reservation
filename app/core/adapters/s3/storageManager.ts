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

function buildObjectUrl(
  bucketName: string,
  region: string,
  key: string,
  endpoint: string | undefined,
): string {
  if (endpoint) {
    return `${endpoint}/${bucketName}/${key}`;
  }
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

function extractKeyFromUrl(
  url: string,
  bucketName: string,
  endpoint: string | undefined,
): string {
  if (endpoint) {
    const prefix = `${endpoint}/${bucketName}/`;
    if (url.startsWith(prefix)) {
      return url.slice(prefix.length);
    }
  }

  const s3Prefix = `https://${bucketName}.s3.`;
  if (url.startsWith(s3Prefix)) {
    const pathStart = url.indexOf(".amazonaws.com/");
    if (pathStart !== -1) {
      return url.slice(pathStart + ".amazonaws.com/".length);
    }
  }

  throw new SystemError(
    SystemErrorCode.StorageError,
    `Cannot extract key from URL: ${url}`,
  );
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

    return buildObjectUrl(this.bucketName, this.region, key, this.endpoint);
  }

  async deleteImage(url: string): Promise<void> {
    const key = extractKeyFromUrl(url, this.bucketName, this.endpoint);

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
}
