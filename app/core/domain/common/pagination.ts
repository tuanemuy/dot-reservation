export type Pagination = {
  readonly page: number;
  readonly limit: number;
};

export type PaginationResult<T> = {
  readonly items: readonly T[];
  readonly total: number;
};
