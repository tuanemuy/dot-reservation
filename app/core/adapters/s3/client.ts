import { S3Client } from "@aws-sdk/client-s3";

export type S3Config = {
  readonly region: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucketName: string;
  readonly endpoint: string | undefined;
};

export function getS3Config(): S3Config {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.S3_BUCKET_NAME;
  const endpoint = process.env.S3_ENDPOINT || undefined;

  if (!region) {
    throw new Error("AWS_REGION environment variable is not set");
  }
  if (!accessKeyId) {
    throw new Error("AWS_ACCESS_KEY_ID environment variable is not set");
  }
  if (!secretAccessKey) {
    throw new Error("AWS_SECRET_ACCESS_KEY environment variable is not set");
  }
  if (!bucketName) {
    throw new Error("S3_BUCKET_NAME environment variable is not set");
  }

  return {
    region,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
  };
}

export function createS3Client(config: S3Config): S3Client {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    ...(config.endpoint
      ? { endpoint: config.endpoint, forcePathStyle: true }
      : {}),
  });
}
