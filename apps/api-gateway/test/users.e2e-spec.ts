import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users API (e2e)', () => {
  let app: INestApplication;
  let createdUserId: number;
  const testEmail = `test-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: testEmail,
        name: 'E2E Test User',
        password: 'testPassword123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', createUserDto.email);
      expect(response.body).toHaveProperty('name', createUserDto.name);
      expect(response.body).not.toHaveProperty('password');

      createdUserId = response.body.id;
    });

    it('should fail with invalid email', async () => {
      const createUserDto = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'testPassword123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send(createUserDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail without required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({})
        .expect(400);
    });

    it('should fail without password', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({
          email: 'nopassword@example.com',
          name: 'No Password User',
        })
        .expect(400);
    });
  });

  describe('GET /api/users', () => {
    it('should return list of users', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a user by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/users/${createdUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdUserId);
      expect(response.body).toHaveProperty('email', testEmail);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/api/users/999999')
        .expect(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user', async () => {
      const updateUserDto = {
        name: 'Updated Name',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/users/${createdUserId}`)
        .send(updateUserDto)
        .expect(200);

      expect(response.body).toHaveProperty('name', updateUserDto.name);
    });

    it('should return error when updating non-existent user', async () => {
      await request(app.getHttpServer())
        .put('/api/users/999999')
        .send({ name: 'Should Fail' })
        .expect(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      // 먼저 삭제할 유저 생성
      const createResponse = await request(app.getHttpServer())
        .post('/api/users')
        .send({
          email: `delete-test-${Date.now()}@example.com`,
          name: 'Delete Test User',
          password: 'testPassword123',
        })
        .expect(201);

      const userIdToDelete = createResponse.body.id;

      // 유저 삭제
      await request(app.getHttpServer())
        .delete(`/api/users/${userIdToDelete}`)
        .expect(200);

      // 삭제 확인
      await request(app.getHttpServer())
        .get(`/api/users/${userIdToDelete}`)
        .expect(404);
    });

    it('should return 400 when deleting non-existent user', async () => {
      await request(app.getHttpServer())
        .delete('/api/users/999999')
        .expect(400);
    });
  });
});
