import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import request from 'supertest';
import createApp from '../app.js';

const FIXTURE_CSV = `number,name,rarity,color,type,manaCost,normal,foil
001,Lightning Bolt,Common,Red,Instant,{R},true,false
002,Counterspell,Common,Blue,Instant,{U}{U},false,true
003,Giant Growth,Common,Green,Instant,{G},false,false
`;

let tmpDir;
let app;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mtg-test-'));
  fs.writeFileSync(path.join(tmpDir, 'testset.csv'), FIXTURE_CSV);
  app = createApp(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('GET /api/sets', () => {
  it('returns array of set names from CSV filenames', async () => {
    const res = await request(app).get('/api/sets');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(['testset']);
  });
});

describe('GET /api/sets/:filename', () => {
  it('returns parsed JSON with boolean normal/foil fields', async () => {
    const res = await request(app).get('/api/sets/testset');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toMatchObject({
      number: '001',
      name: 'Lightning Bolt',
      normal: true,
      foil: false,
    });
    expect(res.body[1]).toMatchObject({
      normal: false,
      foil: true,
    });
  });

  it('returns 404 for nonexistent set', async () => {
    const res = await request(app).get('/api/sets/nosuchset');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /api/sets/:filename/cards/:cardNumber', () => {
  it('updates normal field and persists to CSV', async () => {
    const res = await request(app)
      .patch('/api/sets/testset/cards/003')
      .send({ normal: true });

    expect(res.status).toBe(200);
    expect(res.body.normal).toBe(true);

    // Verify persistence
    const verify = await request(app).get('/api/sets/testset');
    const card = verify.body.find(c => c.number === '003');
    expect(card.normal).toBe(true);
  });

  it('updates foil field and persists to CSV', async () => {
    const res = await request(app)
      .patch('/api/sets/testset/cards/001')
      .send({ foil: true });

    expect(res.status).toBe(200);
    expect(res.body.foil).toBe(true);

    // Verify persistence
    const verify = await request(app).get('/api/sets/testset');
    const card = verify.body.find(c => c.number === '001');
    expect(card.foil).toBe(true);
  });

  it('returns 404 for nonexistent set', async () => {
    const res = await request(app)
      .patch('/api/sets/nosuchset/cards/001')
      .send({ normal: true });
    expect(res.status).toBe(404);
  });

  it('returns 404 for nonexistent card number', async () => {
    const res = await request(app)
      .patch('/api/sets/testset/cards/999')
      .send({ normal: true });
    expect(res.status).toBe(404);
  });
});
