import { BrowserExporter } from "@/core/adapters/browser/exporter";
import { BrowserSettingsRepository } from "@/core/adapters/browser/settingsRepository";
import { BrowserTagExtractor } from "@/core/adapters/browser/tagExtractor";
import { LocalStorageNoteQueryService } from "@/core/adapters/localStorage/noteQueryService";
import { LocalStorageTagQueryService } from "@/core/adapters/localStorage/tagQueryService";
import { LocalStorageUnitOfWorkProvider } from "@/core/adapters/localStorage/unitOfWork";
import { type Database, getDatabase } from "@/core/adapters/tursoWasm/client";
import { TursoWasmNoteQueryService } from "@/core/adapters/tursoWasm/noteQueryService";
import { TursoWasmTagQueryService } from "@/core/adapters/tursoWasm/tagQueryService";
import { TursoWasmUnitOfWorkProvider } from "@/core/adapters/tursoWasm/unitOfWork";
import type { Container } from "@/core/application/container";
import { TagCleanupService, TagSyncService } from "@/core/domain/tag/service";

// Storage adapter type
type StorageAdapter = "localStorage" | "tursoWasm";

// Get storage adapter from environment variable
// Defaults to localStorage for development convenience
const VALID_ADAPTERS = ["localStorage", "tursoWasm"] as const;
const envAdapter = import.meta.env.VITE_STORAGE_ADAPTER as string | undefined;
const STORAGE_ADAPTER: StorageAdapter = (() => {
  if (!envAdapter) {
    return "localStorage";
  }
  if (!VALID_ADAPTERS.includes(envAdapter as StorageAdapter)) {
    throw new Error(
      `Invalid VITE_STORAGE_ADAPTER: "${envAdapter}". Must be one of: ${VALID_ADAPTERS.join(", ")}`,
    );
  }
  return envAdapter as StorageAdapter;
})();

export function withContainer<T extends unknown[], K>(
  fn: (container: Container, ...args: T) => Promise<K>,
): (...args: T) => Promise<K> {
  return async (...args: T) => {
    const container = await createContainerAsync();
    return fn(container, ...args);
  };
}

async function createContainerAsync(): Promise<Container> {
  if (STORAGE_ADAPTER === "tursoWasm") {
    const database = await getDatabase(import.meta.env.VITE_DATABASE_PATH);
    return createTursoWasmContainer(database);
  }

  return createLocalStorageContainer();
}

export function createTursoWasmContainer(db: Database): Container {
  const unitOfWorkProvider = new TursoWasmUnitOfWorkProvider(db);
  const noteQueryService = new TursoWasmNoteQueryService(db);
  const tagQueryService = new TursoWasmTagQueryService(db);
  const tagCleanupService = new TagCleanupService();
  const tagSyncService = new TagSyncService();
  const exporter = new BrowserExporter();
  const tagExtractor = new BrowserTagExtractor();
  const settingsRepository = new BrowserSettingsRepository();

  return {
    unitOfWorkProvider,
    noteQueryService,
    tagQueryService,
    tagCleanupService,
    tagSyncService,
    exporter,
    tagExtractor,
    settingsRepository,
  };
}

export function createLocalStorageContainer(): Container {
  const unitOfWorkProvider = new LocalStorageUnitOfWorkProvider();
  const noteQueryService = new LocalStorageNoteQueryService();
  const tagQueryService = new LocalStorageTagQueryService();
  const tagCleanupService = new TagCleanupService();
  const tagSyncService = new TagSyncService();
  const exporter = new BrowserExporter();
  const tagExtractor = new BrowserTagExtractor();
  const settingsRepository = new BrowserSettingsRepository();

  return {
    unitOfWorkProvider,
    noteQueryService,
    tagQueryService,
    tagCleanupService,
    tagSyncService,
    exporter,
    tagExtractor,
    settingsRepository,
  };
}
