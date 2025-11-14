import type { NoteRepository } from "@/core/domain/note/ports/noteRepository";
import type { TagRepository } from "@/core/domain/tag/ports/tagRepository";

export type Repositories = {
  noteRepository: NoteRepository;
  tagRepository: TagRepository;
};

export interface UnitOfWorkProvider {
  run<T>(fn: (repositories: Repositories) => Promise<T>): Promise<T>;
}
