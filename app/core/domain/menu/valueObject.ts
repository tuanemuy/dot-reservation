import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { MenuErrorCode } from "./errorCode";

const MENU_NAME_MAX_LENGTH = 100;
const MENU_CATEGORY_MAX_LENGTH = 50;
const MENU_DESCRIPTION_MAX_LENGTH = 2000;
const MENU_DURATION_MIN = 15;

// MenuId
type MenuId = string & { readonly brand: "MenuId" };

const MenuId = {
  create: (id: string): MenuId => {
    return id as MenuId;
  },
  generate: (): MenuId => {
    return uuidv7() as MenuId;
  },
};

export { MenuId };

// MenuName
type MenuName = string & { readonly brand: "MenuName" };

const MenuName = {
  create: (value: string): MenuName => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        MenuErrorCode.NameEmpty,
        "Menu name cannot be empty",
      );
    }
    if (value.length > MENU_NAME_MAX_LENGTH) {
      throw new BusinessRuleError(
        MenuErrorCode.NameTooLong,
        `Menu name must be ${MENU_NAME_MAX_LENGTH} characters or less`,
      );
    }
    return value as MenuName;
  },
  maxLength: MENU_NAME_MAX_LENGTH,
};

export { MenuName };

// MenuCategory
type MenuCategory = string & { readonly brand: "MenuCategory" };

const MenuCategory = {
  create: (value: string): MenuCategory => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        MenuErrorCode.CategoryEmpty,
        "Menu category cannot be empty",
      );
    }
    if (value.length > MENU_CATEGORY_MAX_LENGTH) {
      throw new BusinessRuleError(
        MenuErrorCode.CategoryTooLong,
        `Menu category must be ${MENU_CATEGORY_MAX_LENGTH} characters or less`,
      );
    }
    return value as MenuCategory;
  },
  maxLength: MENU_CATEGORY_MAX_LENGTH,
};

export { MenuCategory };

// MenuDescription
type MenuDescription = string & { readonly brand: "MenuDescription" };

const MenuDescription = {
  create: (value: string): MenuDescription => {
    if (value.length > MENU_DESCRIPTION_MAX_LENGTH) {
      throw new BusinessRuleError(
        MenuErrorCode.DescriptionTooLong,
        `Menu description must be ${MENU_DESCRIPTION_MAX_LENGTH} characters or less`,
      );
    }
    return value as MenuDescription;
  },
  maxLength: MENU_DESCRIPTION_MAX_LENGTH,
};

export { MenuDescription };

// MenuDuration
type MenuDuration = number & { readonly brand: "MenuDuration" };

const MenuDuration = {
  create: (value: number): MenuDuration => {
    if (value < MENU_DURATION_MIN) {
      throw new BusinessRuleError(
        MenuErrorCode.DurationTooShort,
        `Menu duration must be at least ${MENU_DURATION_MIN} minutes`,
      );
    }
    if (value % 15 !== 0) {
      throw new BusinessRuleError(
        MenuErrorCode.DurationNotMultipleOf15,
        "Menu duration must be a multiple of 15 minutes",
      );
    }
    return value as MenuDuration;
  },
  minValue: MENU_DURATION_MIN,
};

export { MenuDuration };

// MenuPrice
type MenuPrice = number & { readonly brand: "MenuPrice" };

const MenuPrice = {
  create: (value: number): MenuPrice => {
    if (value < 0) {
      throw new BusinessRuleError(
        MenuErrorCode.PriceNegative,
        "Menu price must be 0 or greater",
      );
    }
    if (!Number.isInteger(value)) {
      throw new BusinessRuleError(
        MenuErrorCode.PriceNotInteger,
        "Menu price must be an integer",
      );
    }
    return value as MenuPrice;
  },
};

export { MenuPrice };
