const MenuErrorCode = {
  NameEmpty: "MENU_NAME_EMPTY",
  NameTooLong: "MENU_NAME_TOO_LONG",
  CategoryEmpty: "MENU_CATEGORY_EMPTY",
  CategoryTooLong: "MENU_CATEGORY_TOO_LONG",
  DescriptionTooLong: "MENU_DESCRIPTION_TOO_LONG",
  DurationTooShort: "MENU_DURATION_TOO_SHORT",
  DurationNotMultipleOf15: "MENU_DURATION_NOT_MULTIPLE_OF_15",
  PriceNegative: "MENU_PRICE_NEGATIVE",
  PriceNotInteger: "MENU_PRICE_NOT_INTEGER",
} as const;

type MenuErrorCode = (typeof MenuErrorCode)[keyof typeof MenuErrorCode];

export { MenuErrorCode };
