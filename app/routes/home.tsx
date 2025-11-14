import { useNavigate } from "react-router";
import { Header } from "@/components/layout/Header";
import { Inset } from "@/components/layout/Inset";
import { CreateNoteFAB } from "@/components/note/CreateNoteFAB";
import { NoteList } from "@/components/note/NoteList";
import { TagSidebar } from "@/components/tag/TagSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SearchProvider } from "@/context/search";
import { combinedSearch as combinedSearchService } from "@/core/application/note/combinedSearch";
import { withContainer } from "@/di";
import { useCreateNote } from "@/hooks/useCreateNote";
import { useNotes } from "@/hooks/useNotes";
import { useNoteTags } from "@/hooks/useNoteTags";
import { useTags } from "@/hooks/useTags";
import { defaultNotification } from "@/presenters/notification";
import { SettingsIcon } from "lucide-react";
import { Link } from "react-router";
import { FilterBadges } from "@/components/note/FilterBadges";
import { SortPopover } from "@/components/note/SortPopover";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SearchBar } from "@/components/layout/SearchBar";
import type { Route } from "./+types/home";

const PAGE_SIZE = 20;
const DEFAULT_SORT_FIELD = "created_at";
const DEFAULT_SORT_ORDER = "desc";

const combinedSearch = withContainer(combinedSearchService);

export function meta(_: Route.MetaArgs) {
  return [
    { title: "WASM Editor - Home" },
    { name: "description", content: "Your notes, all in one place" },
  ];
}

export async function clientLoader(_: Route.ClientLoaderArgs) {
  const notes = await combinedSearch({
    query: "",
    tagIds: [],
    pagination: { page: 1, limit: PAGE_SIZE },
    orderBy: DEFAULT_SORT_FIELD,
    order: DEFAULT_SORT_ORDER,
  });
  return notes;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();

  const { notes, loading, hasMore, fetch, loadMore } = useNotes(
    {
      pageSize: PAGE_SIZE,
      ...defaultNotification,
    },
    {
      notes: loaderData.items,
      counts: loaderData.count,
    },
  );

  const { tags } = useTags();
  const { noteTagsMap } = useNoteTags(notes.map((note) => note.id));

  const { creating, createNote } = useCreateNote();

  const handleCreateNote = async () => {
    const note = await createNote();
    if (note) {
      navigate(`/memos/${note.id}`);
    }
  };

  return (
    <SearchProvider onChangeParams={(params) => fetch(1, params)}>
      <SidebarProvider>
        <TagSidebar tags={tags} />

        <SidebarInset className="flex flex-col pt-0 bg-background">
          <Inset>
            <Header
              leading={<SidebarTrigger />}
              trailing={
                <Link to="/settings" viewTransition>
                  <Button variant="ghost" size="icon">
                    <SettingsIcon className="h-5 w-5" />
                  </Button>
                </Link>
              }
              className="sticky z-2 top-0"
            >
              <div className="flex items-center gap-2">
                <SearchBar className="flex-1" />
                <SortPopover />
              </div>
            </Header>

            <FilterBadges tags={tags} className="mt-4" />

            <NoteList
              notes={notes}
              noteTagsMap={noteTagsMap}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              className="mt-4"
            />
            <CreateNoteFAB creating={creating} onClick={handleCreateNote} />
          </Inset>
        </SidebarInset>
      </SidebarProvider>
    </SearchProvider>
  );
}
