import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { PrismaService } from './prisma.service';
import { DefaultDelegates, PagePaginationMeta, PaginatedResult } from './types';

/**
 * Prisma 모델 타입 헬퍼
 */
declare type PrismaModelType<T extends Prisma.ModelName> =
  Prisma.TypeMap['model'][T];

declare type PrismaPayloadScalarType<T extends Prisma.ModelName> =
  PrismaModelType<T>['payload']['scalars'];

declare type PrismaOperationType<
  T extends Prisma.ModelName,
  MethodName extends DefaultDelegates,
> = PrismaModelType<T>['operations'][MethodName];

declare type PrismaArgsType<
  T extends Prisma.ModelName,
  MethodName extends DefaultDelegates,
> = PrismaOperationType<T, MethodName>['args'];

/**
 * Abstract Base Repository
 * Prisma 모델에 대한 공통 CRUD 작업과 트랜잭션 지원을 제공합니다.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserRepository extends BaseRepository<'User'> {
 *   constructor(
 *     prisma: PrismaService,
 *     txHost: TransactionHost<TransactionalAdapterPrisma>,
 *   ) {
 *     super(prisma, 'user', txHost);
 *   }
 * }
 * ```
 */
export abstract class BaseRepository<T extends Prisma.ModelName> {
  protected readonly logger: Logger;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly model: Lowercase<T> | string,
    protected readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {
    this.logger = new Logger(`${this.constructor.name}`);
  }

  /**
   * 쿼리 실행 및 로깅 헬퍼
   */
  protected async executeWithLogging<R>(
    operation: string,
    args: unknown,
    queryFn: () => Promise<R>,
  ): Promise<R> {
    const start = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - start;
      this.logger.debug(`${this.model}.${operation} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error(
        `${this.model}.${operation} failed after ${duration}ms: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 새 엔티티 생성 (트랜잭션 지원)
   */
  async create(
    data: PrismaArgsType<T, 'create'>['data'],
    select?: PrismaArgsType<T, 'create'>['select'],
  ): Promise<PrismaPayloadScalarType<T>> {
    const params = { data, select };
    return this.executeWithLogging('create', params, () =>
      this.txHost.tx[this.model].create(params),
    );
  }

  /**
   * 여러 엔티티 일괄 생성 (트랜잭션 지원)
   */
  async createMany(
    data: PrismaArgsType<T, 'createMany'>['data'],
  ): Promise<{ count: number }> {
    const params = { data, skipDuplicates: true };
    return this.executeWithLogging('createMany', params, () =>
      this.txHost.tx[this.model].createMany(params),
    );
  }

  /**
   * ID로 엔티티 조회 (트랜잭션 지원)
   */
  async findById(
    id: number | string,
    select?: PrismaArgsType<T, 'findUnique'>['select'],
  ): Promise<PrismaPayloadScalarType<T> | null> {
    const params = { where: { id }, select };
    return this.executeWithLogging('findUnique', params, () =>
      this.txHost.tx[this.model].findUnique(params),
    );
  }

  /**
   * 유니크 조건으로 엔티티 조회 (트랜잭션 지원)
   */
  async findUnique(
    where: PrismaArgsType<T, 'findUnique'>['where'],
    select?: PrismaArgsType<T, 'findUnique'>['select'],
  ): Promise<PrismaPayloadScalarType<T> | null> {
    const params = { where, select };
    return this.executeWithLogging('findUnique', params, () =>
      this.txHost.tx[this.model].findUnique(params),
    );
  }

  /**
   * 조건에 맞는 첫 번째 엔티티 조회 (트랜잭션 지원)
   */
  async findFirst(
    where?: PrismaArgsType<T, 'findFirst'>['where'],
    select?: PrismaArgsType<T, 'findFirst'>['select'],
  ): Promise<PrismaPayloadScalarType<T> | null> {
    const params = { where, select };
    return this.executeWithLogging('findFirst', params, () =>
      this.txHost.tx[this.model].findFirst(params),
    );
  }

  /**
   * 엔티티 목록 조회 (트랜잭션 지원)
   */
  async findMany(
    where?: PrismaArgsType<T, 'findMany'>['where'],
    select?: PrismaArgsType<T, 'findMany'>['select'],
    orderBy?: PrismaArgsType<T, 'findMany'>['orderBy'],
    options?: { skip?: number; take?: number; include?: any },
  ): Promise<PrismaPayloadScalarType<T>[]> {
    const params = {
      where,
      select,
      orderBy,
      skip: options?.skip,
      take: options?.take,
      include: options?.include,
    };
    return this.executeWithLogging('findMany', params, () =>
      this.txHost.tx[this.model].findMany(params),
    );
  }

  /**
   * 모든 엔티티 조회
   */
  async findAll(): Promise<PrismaPayloadScalarType<T>[]> {
    return this.findMany();
  }

  /**
   * 페이지 기반 페이지네이션 조회 (트랜잭션 지원)
   */
  async paginate(
    page: number = 1,
    limit: number = 20,
    where?: PrismaArgsType<T, 'findMany'>['where'],
    orderBy?: PrismaArgsType<T, 'findMany'>['orderBy'],
    select?: PrismaArgsType<T, 'findMany'>['select'],
  ): Promise<PaginatedResult<PrismaPayloadScalarType<T>>> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.findMany(where, select, orderBy, { skip, take: limit }),
      this.count(where),
    ]);

    const pageCount = Math.ceil(total / limit);
    const meta: PagePaginationMeta = {
      isFirstPage: page === 1,
      isLastPage: page >= pageCount,
      currentPage: page,
      previousPage: page > 1 ? page - 1 : null,
      nextPage: page < pageCount ? page + 1 : null,
      pageCount,
      totalCount: total,
    };

    return { data, meta };
  }

  /**
   * 엔티티 수 조회 (트랜잭션 지원)
   */
  async count(where?: PrismaArgsType<T, 'count'>['where']): Promise<number> {
    const params = { where };
    return this.executeWithLogging('count', params, () =>
      this.txHost.tx[this.model].count(params),
    );
  }

  /**
   * 엔티티 업데이트 (트랜잭션 지원)
   */
  async update(
    where: PrismaArgsType<T, 'update'>['where'],
    data: PrismaArgsType<T, 'update'>['data'],
    select?: PrismaArgsType<T, 'update'>['select'],
  ): Promise<PrismaPayloadScalarType<T>> {
    const params = { where, data, select };
    return this.executeWithLogging('update', params, () =>
      this.txHost.tx[this.model].update(params),
    );
  }

  /**
   * ID로 엔티티 업데이트 (트랜잭션 지원)
   */
  async updateById(
    id: number | string,
    data: PrismaArgsType<T, 'update'>['data'],
    select?: PrismaArgsType<T, 'update'>['select'],
  ): Promise<PrismaPayloadScalarType<T>> {
    return this.update({ id } as any, data, select);
  }

  /**
   * 조건에 맞는 엔티티 일괄 업데이트 (트랜잭션 지원)
   */
  async updateMany(
    where: PrismaArgsType<T, 'updateMany'>['where'],
    data: PrismaArgsType<T, 'updateMany'>['data'],
  ): Promise<{ count: number }> {
    const params = { where, data };
    return this.executeWithLogging('updateMany', params, () =>
      this.txHost.tx[this.model].updateMany(params),
    );
  }

  /**
   * 엔티티 삭제 (트랜잭션 지원)
   */
  async delete(
    where: PrismaArgsType<T, 'delete'>['where'],
  ): Promise<PrismaPayloadScalarType<T>> {
    const params = { where };
    return this.executeWithLogging('delete', params, () =>
      this.txHost.tx[this.model].delete(params),
    );
  }

  /**
   * ID로 엔티티 삭제 (트랜잭션 지원)
   */
  async deleteById(id: number | string): Promise<PrismaPayloadScalarType<T>> {
    return this.delete({ id } as any);
  }

  /**
   * 조건에 맞는 엔티티 일괄 삭제 (트랜잭션 지원)
   */
  async deleteMany(
    where?: PrismaArgsType<T, 'deleteMany'>['where'],
  ): Promise<{ count: number }> {
    const params = { where };
    return this.executeWithLogging('deleteMany', params, () =>
      this.txHost.tx[this.model].deleteMany(params),
    );
  }

  /**
   * Upsert (트랜잭션 지원)
   */
  async upsert(
    where: PrismaArgsType<T, 'upsert'>['where'],
    create: PrismaArgsType<T, 'upsert'>['create'],
    update: PrismaArgsType<T, 'upsert'>['update'],
    select?: PrismaArgsType<T, 'upsert'>['select'],
  ): Promise<PrismaPayloadScalarType<T>> {
    const params = { where, create, update, select };
    return this.executeWithLogging('upsert', params, () =>
      this.txHost.tx[this.model].upsert(params),
    );
  }

  /**
   * 엔티티 존재 여부 확인 (트랜잭션 지원)
   */
  async exists(where: PrismaArgsType<T, 'count'>['where']): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * ID로 엔티티 존재 여부 확인
   */
  async existsById(id: number | string): Promise<boolean> {
    return this.exists({ id } as any);
  }
}
