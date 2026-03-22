import { MenuId } from "@/core/domain/menu/valueObject";
import type { ServiceArgs } from "../types";

export type UpdateMenuSortOrdersInput = {
  items: { menuId: string; sortOrder: number }[];
};

export async function updateMenuSortOrders({
  container,
  input,
}: ServiceArgs<UpdateMenuSortOrdersInput>): Promise<void> {
  const items = input.items.map((item) => ({
    id: MenuId.create(item.menuId),
    sortOrder: item.sortOrder,
  }));

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    await repositories.menuRepository.updateSortOrders(items);
  });
}
