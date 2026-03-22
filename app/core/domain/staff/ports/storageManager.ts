export interface StorageManager {
  uploadImage(file: File): Promise<string>;
  deleteImage(url: string): Promise<void>;
}
