import { Menu } from "@/core/domain/menu/entity";
import { MenuId, MenuName } from "@/core/domain/menu/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type UpdateMenuInput = {
  menuId: string;
  name: string;
  category: string | null;
  description: string | null;
  duration: number;
  price: number;
};

export type UpdateMenuOutput = {
  id: string;
  name: string;
};

export async function updateMenu({
  container,
  input,
}: ServiceArgs<UpdateMenuInput>): Promise<UpdateMenuOutput> {
  const menuId = MenuId.create(input.menuId);

  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      const existing = await repositories.menuRepository.findById(menuId);
      if (!existing) {
        throw new NotFoundError(NotFoundErrorCode.NotFound, "Menu not found");
      }

      // Check for duplicate name within the tenant (excluding self)
      const menuName = MenuName.create(input.name);
      if (menuName !== existing.name) {
        const nameExists =
          await repositories.menuRepository.existsByTenantIdAndName(
            existing.tenantId,
            menuName,
          );
        if (nameExists) {
          throw new ConflictError(
            ConflictErrorCode.Conflict,
            "A menu with this name already exists in the tenant",
          );
        }
      }

      const { entity: updated, events } = Menu.update(existing, {
        name: input.name,
        category: input.category,
        description: input.description,
        duration: input.duration,
        price: input.price,
      });

      await repositories.menuRepository.save(updated);
      await repositories.outboxRepository.saveEvents(events);

      return {
        id: updated.id,
        name: updated.name,
      };
    },
  );

  return result;
}
