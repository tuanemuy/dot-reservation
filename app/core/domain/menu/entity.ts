import type { WithEvents } from "@/core/domain/common/event";
import type { TenantId } from "@/core/domain/tenant/valueObject";
import { type MenuEvent, MenuEvents } from "./events";
import {
  MenuCategory,
  type MenuCategory as MenuCategoryType,
  MenuDescription,
  type MenuDescription as MenuDescriptionType,
  MenuDuration,
  type MenuDuration as MenuDurationType,
  MenuId,
  type MenuId as MenuIdType,
  MenuName,
  type MenuName as MenuNameType,
  MenuPrice,
  type MenuPrice as MenuPriceType,
} from "./valueObject";

type Menu = Readonly<{
  id: MenuIdType;
  tenantId: TenantId;
  name: MenuNameType;
  category: MenuCategoryType | null;
  description: MenuDescriptionType | null;
  duration: MenuDurationType;
  price: MenuPriceType;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}>;

const Menu = {
  create: (params: {
    tenantId: TenantId;
    name: string;
    category: string | null;
    description: string | null;
    duration: number;
    price: number;
    sortOrder: number;
  }): WithEvents<Menu, MenuEvent> => {
    const now = new Date();
    const menu: Menu = {
      id: MenuId.generate(),
      tenantId: params.tenantId,
      name: MenuName.create(params.name),
      category:
        params.category !== null ? MenuCategory.create(params.category) : null,
      description:
        params.description !== null
          ? MenuDescription.create(params.description)
          : null,
      duration: MenuDuration.create(params.duration),
      price: MenuPrice.create(params.price),
      sortOrder: params.sortOrder,
      createdAt: now,
      updatedAt: now,
    };

    return {
      entity: menu,
      events: [MenuEvents.created(menu.id, params.tenantId)],
    };
  },

  update: (
    menu: Menu,
    params: {
      name?: string;
      category?: string | null;
      description?: string | null;
      duration?: number;
      price?: number;
    },
  ): WithEvents<Menu, MenuEvent> => {
    return {
      entity: {
        ...menu,
        name:
          params.name !== undefined ? MenuName.create(params.name) : menu.name,
        category:
          params.category !== undefined
            ? params.category !== null
              ? MenuCategory.create(params.category)
              : null
            : menu.category,
        description:
          params.description !== undefined
            ? params.description !== null
              ? MenuDescription.create(params.description)
              : null
            : menu.description,
        duration:
          params.duration !== undefined
            ? MenuDuration.create(params.duration)
            : menu.duration,
        price:
          params.price !== undefined
            ? MenuPrice.create(params.price)
            : menu.price,
        updatedAt: new Date(),
      },
      events: [],
    };
  },
};

export { Menu };
