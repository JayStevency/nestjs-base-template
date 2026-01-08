/**
 * Prisma Delegate 메서드 타입
 */
export type DefaultDelegates =
  | 'create'
  | 'createMany'
  | 'findUnique'
  | 'findFirst'
  | 'findMany'
  | 'update'
  | 'updateMany'
  | 'upsert'
  | 'delete'
  | 'deleteMany'
  | 'count';

/**
 * Prisma Select 타입
 */
export type PrismaSelectionType = Record<string, boolean>;

/**
 * 페이지 기반 페이지네이션 메타데이터
 */
export type PagePaginationMeta = {
  isFirstPage: boolean;
  isLastPage: boolean;
  currentPage: number;
  previousPage: number | null;
  nextPage: number | null;
  pageCount?: number;
  totalCount?: number;
};

/**
 * 커서 기반 페이지네이션 메타데이터
 */
export type CursorPaginationMeta = {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

/**
 * 페이지네이션 결과 타입
 */
export type PaginatedResult<T> = {
  data: T[];
  meta: PagePaginationMeta;
};

/**
 * 커서 페이지네이션 결과 타입
 */
export type CursorPaginatedResult<T> = {
  data: T[];
  meta: CursorPaginationMeta;
};
