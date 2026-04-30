import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let createdUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // ⚠️ Match your main.ts setup
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    await app.init();

    prisma = app.get(PrismaService);
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('POST /api/users - creates a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .send({ email: 'e2e@example.com', name: 'E2EUser', password: 'Password123!!' })
      .expect(201);

    console.log(res.status, res.body);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('e2e@example.com');
    createdUserId = res.body.id;
  });

  it('GET /api/users - returns users list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users')
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('GET /api/users/:id - returns one user', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/users/${createdUserId}`)
      .expect(200);

    expect(res.body.id).toBe(createdUserId);
  });

  it('GET /api/users/:id - 400 on invalid UUID', async () => {
    await request(app.getHttpServer())
      .get('/api/users/not-a-uuid')
      .expect(400);
  });

  it('PATCH /api/users/:id - updates the user', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/users/${createdUserId}`)
      .send({ name: 'UpdatedE2E' })
      .expect(200);

    expect(res.body.name).toBe('UpdatedE2E');
  });

  it('DELETE /api/users/:id - deletes the user (204)', async () => {
    await request(app.getHttpServer())
      .delete(`/api/users/${createdUserId}`)
      .expect(204);
  });

  it('GET /api/users/:id - 404 after deletion', async () => {
    await request(app.getHttpServer())
      .get(`/api/users/${createdUserId}`)
      .expect(404);
  });
});
