import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

const missingId = '00000000-0000-4000-8000-000000000000';

describe('Cinema API (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    http = request(app.getHttpServer());
  });

  afterEach(async () => {
    await app.close();
  });

  async function seed() {
    const film = await http
      .post('/films')
      .send({ title: 'Dune', durationMinutes: 166, releaseYear: 2024 })
      .expect(201);
    const hall = await http
      .post('/halls')
      .send({ name: 'Hall 1', rows: 3, seatsPerRow: 5 })
      .expect(201);
    const showing = await http
      .post('/showings')
      .send({
        filmId: film.body.id,
        hallId: hall.body.id,
        startsAt: '2030-05-01T18:30:00Z',
        price: 12500,
      })
      .expect(201);
    return {
      filmId: film.body.id as string,
      hallId: hall.body.id as string,
      showingId: showing.body.id as string,
    };
  }

  describe('films', () => {
    it('creates, reads, updates and deletes a film', async () => {
      const { body } = await http
        .post('/films')
        .send({ title: 'A', durationMinutes: 90, releaseYear: 2020, extra: 1 })
        .expect(201);
      expect(body).toEqual({
        id: expect.any(String),
        title: 'A',
        durationMinutes: 90,
        releaseYear: 2020,
      });
      await http.get('/films').expect(200, [body]);
      await http.get(`/films/${body.id}`).expect(200, body);
      await http
        .patch(`/films/${body.id}`)
        .send({ title: 'B' })
        .expect(200)
        .expect((r) => expect(r.body.title).toBe('B'));
      await http
        .patch(`/films/${body.id}`)
        .send({ releaseYear: 'x' })
        .expect(400);
      await http.delete(`/films/${body.id}`).expect(204, '');
      await http.get(`/films/${body.id}`).expect(404);
      await http.delete(`/films/${missingId}`).expect(404);
    });

    it('rejects missing or wrongly typed fields', async () => {
      await http
        .post('/films')
        .send({ title: 'A', releaseYear: 2020 })
        .expect(400);
      await http
        .post('/films')
        .send({ title: 'A', durationMinutes: '90', releaseYear: 2020 })
        .expect(400);
    });
  });

  describe('halls', () => {
    it('returns seats list and enforces unique name', async () => {
      const { body } = await http
        .post('/halls')
        .send({ name: 'Big', rows: 3, seatsPerRow: 5 })
        .expect(201);
      const hall = await http.get(`/halls/${body.id}`).expect(200);
      expect(hall.body.seats).toHaveLength(15);
      expect(hall.body.seats[0]).toEqual({ row: 1, seat: 1 });
      expect(hall.body.seats[14]).toEqual({ row: 3, seat: 5 });

      await http
        .post('/halls')
        .send({ name: 'Big', rows: 1, seatsPerRow: 1 })
        .expect(409);
      await http
        .post('/halls')
        .send({ name: 'X', rows: 1.5, seatsPerRow: 1 })
        .expect(400);
      await http.get(`/halls/${missingId}`).expect(404);
    });

    it('forbids deleting film and hall used by a showing', async () => {
      const { filmId, hallId } = await seed();
      await http.delete(`/films/${filmId}`).expect(409);
      await http.delete(`/halls/${hallId}`).expect(409);
    });
  });

  describe('showings', () => {
    it('validates references, date and price', async () => {
      const { filmId, hallId } = await seed();
      const base = {
        filmId,
        hallId,
        startsAt: '2030-01-01T10:00:00Z',
        price: 100,
      };
      const missingFilm = await http
        .post('/showings')
        .send({ ...base, filmId: missingId })
        .expect(400);
      expect(missingFilm.body.message).toContain('Film');
      await http
        .post('/showings')
        .send({ ...base, hallId: missingId })
        .expect(400);
      await http
        .post('/showings')
        .send({ ...base, startsAt: 'nope' })
        .expect(400);
      await http
        .post('/showings')
        .send({ ...base, startsAt: '2000-01-01T10:00:00Z' })
        .expect(400);
      await http
        .post('/showings')
        .send({ ...base, price: 0 })
        .expect(400);
    });

    it('filters, sorts and returns names', async () => {
      const { filmId, hallId, showingId } = await seed();
      const other = await http
        .post('/films')
        .send({ title: 'Other', durationMinutes: 100, releaseYear: 2021 })
        .expect(201);
      const create = (fId: string, startsAt: string) =>
        http
          .post('/showings')
          .send({ filmId: fId, hallId, startsAt, price: 100 })
          .expect(201);
      await create(filmId, '2030-05-01T09:00:00Z');
      await create(filmId, '2030-05-02T09:00:00Z');
      await create(other.body.id, '2030-05-01T12:00:00Z');

      const all = await http.get('/showings').expect(200);
      expect(all.body).toHaveLength(4);
      const times = all.body.map((s: { startsAt: string }) => s.startsAt);
      expect(times).toEqual([...times].sort());

      const filtered = await http
        .get(`/showings?filmId=${filmId}&date=2030-05-01`)
        .expect(200);
      expect(filtered.body).toHaveLength(2);
      expect(filtered.body[0]).toMatchObject({
        filmTitle: 'Dune',
        hallName: 'Hall 1',
        startsAt: '2030-05-01T09:00:00.000Z',
      });
      expect(filtered.body[0].filmId).toBeUndefined();

      await http.get('/showings?date=2030-5-1').expect(400);
      await http.get('/showings?date=2030-02-30').expect(400);
      await http
        .get(`/showings/${showingId}`)
        .expect(200)
        .expect((r) => expect(r.body.hallName).toBe('Hall 1'));
      await http.get(`/showings/${missingId}`).expect(404);
    });
  });

  describe('bookings', () => {
    it('books, conflicts atomically and cancels', async () => {
      const { showingId } = await seed();
      const url = `/showings/${showingId}/bookings`;

      const booking = await http
        .post(url)
        .send({
          seats: [
            { row: 1, seat: 3 },
            { row: 1, seat: 4 },
          ],
        })
        .expect(201);
      expect(booking.body.totalPrice).toBe(25000);

      await http.post(url).send({ seats: [] }).expect(400);
      await http
        .post(url)
        .send({ seats: [{ row: 1 }] })
        .expect(400);
      await http
        .post(url)
        .send({
          seats: [
            { row: 2, seat: 2 },
            { row: 2, seat: 2 },
          ],
        })
        .expect(400);
      await http
        .post(url)
        .send({ seats: [{ row: 4, seat: 1 }] })
        .expect(400);
      await http
        .post(url)
        .send({ seats: [{ row: 1, seat: 6 }] })
        .expect(400);
      await http
        .post(`/showings/${missingId}/bookings`)
        .send({ seats: [{ row: 1, seat: 1 }] })
        .expect(404);

      await http
        .post(url)
        .send({
          seats: [
            { row: 2, seat: 1 },
            { row: 1, seat: 4 },
          ],
        })
        .expect(409);

      const seats = await http.get(`/showings/${showingId}/seats`).expect(200);
      expect(seats.body).toHaveLength(15);
      const booked = seats.body
        .filter((s: { isBooked: boolean }) => s.isBooked)
        .map((s: { row: number; seat: number }) => `${s.row}:${s.seat}`);
      expect(booked).toEqual(['1:3', '1:4']);

      await http
        .get(url)
        .expect(200)
        .expect((r) => expect(r.body).toHaveLength(1));
      await http
        .get('/bookings')
        .expect(200)
        .expect((r) => expect(r.body).toHaveLength(1));

      await http.delete(`/bookings/${booking.body.id}`).expect(204);
      await http.delete(`/bookings/${booking.body.id}`).expect(404);
      await http
        .post(url)
        .send({
          seats: [
            { row: 1, seat: 3 },
            { row: 1, seat: 4 },
          ],
        })
        .expect(201);
    });
  });
});
