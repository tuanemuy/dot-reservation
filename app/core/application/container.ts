import type { Exporter } from "@/core/domain/note/ports/exporter";
import type { NoteQueryService } from "@/core/domain/note/ports/noteQueryService";
import type { SettingsRepository } from "@/core/domain/settings/ports/settingsRepository";
import type { TagExtractor } from "@/core/domain/tag/ports/tagExtractor";
import type { TagQueryService } from "@/core/domain/tag/ports/tagQueryService";
import type {
  TagCleanupService,
  TagSyncService,
} from "@/core/domain/tag/service";
import type { UnitOfWorkProvider } from "./unitOfWork";

/**
 * Dependency Injection Container
 */
export type Container = {
  unitOfWorkProvider: UnitOfWorkProvider;
  noteQueryService: NoteQueryService;
  tagQueryService: TagQueryService;
  tagCleanupService: TagCleanupService;
  tagSyncService: TagSyncService;
  exporter: Exporter;
  tagExtractor: TagExtractor;
  settingsRepository: SettingsRepository;
};
