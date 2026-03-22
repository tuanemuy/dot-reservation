import { Menu } from "@/core/domain/menu/entity";
import { MenuName } from "@/core/domain/menu/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import { ConflictError, ConflictErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type CreateMenuInput = {
  tenantId: string;
  name: string;
  category: string | null;
  description: string | null;
  duration: number;
  price: number;
};

export type CreateMenuOutput = {
  id: string;
  name: string;
};

export async function createMenu({
  container,
  input,
}: ServiceArgs<CreateMenuInput>): Promise<CreateMenuOutput> {
  const tenantId = TenantId.create(input.tenantId);
  const menuName = MenuName.create(input.name);

  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      // Check for duplicate name within the tenant
      const nameExists =
        await repositories.menuRepository.existsByTenantIdAndName(
          tenantId,
          menuName,
        );
      if (nameExists) {
        throw new ConflictError(
          ConflictErrorCode.Conflict,
          "A menu with this name already exists in the tenant",
        );
      }

      // Determine sort order (append to end)
      const existingMenus =
        await repositories.menuRepository.findByTenantId(tenantId);
      const maxSortOrder = existingMenus.reduce(
        (max, menu) => Math.max(max, menu.sortOrder),
        0,
      );

      const { entity: menu, events } = Menu.create({
        tenantId,
        name: input.name,
        category: input.category,
        description: input.description,
        duration: input.duration,
        price: input.price,
        sortOrder: maxSortOrder + 1,
      });

      await repositories.menuRepository.save(menu);
      await repositories.outboxRepository.saveEvents(events);

      return {
        id: menu.id,
        name: menu.name,
      };
    },
  );

  return result;
}
