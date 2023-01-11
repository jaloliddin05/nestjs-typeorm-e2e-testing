import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

import {
  Flower_1_Creating,
  Flower_1_Updating,
  Flower_2_Creating,
} from './flower-objects';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Flower Module', () => {
    beforeEach(async () => {
      const uncleared = await request(app.getHttpServer()).get('/flowers');
      await Promise.all(
        uncleared.body.items.map(async (flower) => {
          return await request(app.getHttpServer()).delete(
            `/flowers/${flower.id}`,
          );
        }),
      );
    });

    it('Post position, get all, get by id, delete', async () => {
      //creating
      const createdResult_1 = await request(app.getHttpServer())
        .post('/flowers')
        .send(Flower_1_Creating)
        .expect(201);

      const createdResult_2 = await request(app.getHttpServer())
        .post('/flowers')
        .send(Flower_2_Creating)
        .expect(201);

      //getting

      const allFlowers = await request(app.getHttpServer())
        .get('/flowers')
        .expect(200);

      const flowers = allFlowers.body.items;

      expect(flowers).toEqual(expect.any(Array));
      expect(flowers.length).toBe(2);
      expect(flowers[0]).toEqual({
        ...Flower_1_Creating,
        id: expect.any(String),
      });

      const id = flowers.find((t) => t.title == Flower_2_Creating.title).id;

      const getFlowerById = await request(app.getHttpServer())
        .get(`/flowers/${id}`)
        .expect(200);

      expect(getFlowerById.body.title).toEqual(Flower_2_Creating.title);

      // updating

      const updateResult = await request(app.getHttpServer())
        .patch(`/flowers/${id}`)
        .send(Flower_1_Updating)
        .expect(200);

      expect(updateResult.body.raw).toEqual(expect.any(Array));

      const getById = await request(app.getHttpServer())
        .get(`/flowers/${id}`)
        .expect(200);

      expect(getById.body.title).toEqual(Flower_1_Updating.title);

      //deleting
      await request(app.getHttpServer()).delete(`/flowers/${id}`).expect(204);
    }, 20000);
  });
});
