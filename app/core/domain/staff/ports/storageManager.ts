export interface StorageManager {
  uploadImage(file: File): Promise<string>;
  deleteImage(key: string): Promise<void>;
  resolveImageUrl(key: string): string;
}
