import { MenuEvents } from "@/core/domain/menu/events";
import { MenuId } from "@/core/domain/menu/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type DeleteMenuInput = {
  menuId: string;
};

export async function deleteMenu({
  container,
  input,
}: ServiceArgs<DeleteMenuInput>): Promise<void> {
  const menuId = MenuId.create(input.menuId);

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const existing = await repositories.menuRepository.findById(menuId);
    if (!existing) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Menu not found");
    }

    const events = [MenuEvents.deleted(existing.id, existing.tenantId)];

    await repositories.menuRepository.delete(menuId);
    await repositories.outboxRepository.saveEvents(events);
  });
}
