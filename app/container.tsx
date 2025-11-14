import { createContext, useContext } from "react";
import { BrowserExporter } from "@/core/adapters/browser/exporter";
import { BrowserSettingsRepository } from "@/core/adapters/browser/settingsRepository";
import { BrowserTagExtractor } from "@/core/adapters/browser/tagExtractor";
import { getDatabase } from "@/core/adapters/drizzleSqlite/client";
import { DrizzleSqliteNoteQueryService } from "@/core/adapters/drizzleSqlite/noteQueryService";
import { DrizzleSqliteTagQueryService } from "@/core/adapters/drizzleSqlite/tagQueryService";
import { DrizzleSqliteUnitOfWorkProvider } from "@/core/adapters/drizzleSqlite/unitOfWork";
import type { Context } from "@/core/application/context";
import { TagCleanupService, TagSyncService } from "@/core/domain/tag/service";

export type Container = Context;

export const ContainerContext = createContext<Container>({} as Container);

export const useContainer = () => {
  return useContext(ContainerContext);
};

function createContainer(): Context {
  const databasePath = process.env.VITE_APP_DATABASE_PATH;
  if (!databasePath) {
    throw new Error("VITE_APP_DATABASE_PATH is not defined");
  }

  const db = getDatabase(databasePath);

  const container: Context = {
    unitOfWorkProvider: new DrizzleSqliteUnitOfWorkProvider(db),
    noteQueryService: new DrizzleSqliteNoteQueryService(db),
    tagQueryService: new DrizzleSqliteTagQueryService(db),
    tagCleanupService: new TagCleanupService(),
    tagSyncService: new TagSyncService(),
    exporter: new BrowserExporter(),
    tagExtractor: new BrowserTagExtractor(),
    settingsRepository: new BrowserSettingsRepository(),
  };

  return container;
}

export function ContainerProvider({ children }: { children: React.ReactNode }) {
  const container = createContainer();

  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  );
}
