import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { UserService } from '../src/user.service';
import { UserRepository } from '../src/repositories';
import { PrismaModule, PrismaService } from '@app/prisma';
import configurations from '@app/core/config/configurations';

describe('UserService (e2e)', () => {
  let service: UserService;
  let prisma: PrismaService;
  let testUserId: number;
  const testEmail = `user-service-e2e-${Date.now()}@example.com`;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configurations],
        }),
        PrismaModule,
      ],
      providers: [UserService, UserRepository],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: 'user-service-e2e-',
          },
        },
      });
    } catch (error) {
      // 이미 삭제된 경우 무시
    }
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: testEmail,
        name: 'E2E Test User',
        password: 'testPassword123',
      };

      const result = await service.create(createUserDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', testEmail);
      expect(result).toHaveProperty('name', createUserDto.name);
      expect(result).not.toHaveProperty('password');

      testUserId = result.id;
    });

    it('should fail when creating user with duplicate email', async () => {
      const createUserDto = {
        email: testEmail,
        name: 'Duplicate User',
        password: 'testPassword123',
      };

      await expect(service.create(createUserDto)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const result = await service.findById(testUserId);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id', testUserId);
      expect(result).toHaveProperty('email', testEmail);
    });

    it('should return null for non-existent id', async () => {
      const result = await service.findById(999999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const result = await service.findByEmail(testEmail);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('email', testEmail);
    });

    it('should return null for non-existent email', async () => {
      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto = {
        name: 'Updated E2E User',
      };

      const result = await service.update(testUserId, updateUserDto);

      expect(result).toHaveProperty('id', testUserId);
      expect(result).toHaveProperty('name', updateUserDto.name);
    });

    it('should fail when updating non-existent user', async () => {
      const updateUserDto = {
        name: 'Should Fail',
      };

      await expect(service.update(999999, updateUserDto)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      // 삭제할 새 유저 생성
      const newUser = await service.create({
        email: `delete-e2e-${Date.now()}@example.com`,
        name: 'Delete Test User',
        password: 'testPassword123',
      });

      const result = await service.delete(newUser.id);

      expect(result).toHaveProperty('id', newUser.id);

      // 삭제 확인
      const deletedUser = await service.findById(newUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should fail when deleting non-existent user', async () => {
      await expect(service.delete(999999)).rejects.toThrow();
    });
  });
});
