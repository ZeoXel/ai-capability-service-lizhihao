import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('POST /v1/capabilities/run', () => {
  it('should return a successful summary with ok: true and meta', async () => {
    const res = await request(app)
      .post('/v1/capabilities/run')
      .send({
        capability: 'text_summary',
        input: { text: 'The quick brown fox jumps over the lazy dog. It was a sunny day. The birds were singing in the trees.' },
        request_id: 'test-123',
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.result).toBeTypeOf('string');
    expect(res.body.data.result.length).toBeGreaterThan(0);
    expect(res.body.meta.request_id).toBe('test-123');
    expect(res.body.meta.capability).toBe('text_summary');
    expect(res.body.meta.elapsed_ms).toBeTypeOf('number');
    expect(res.body.meta.elapsed_ms).toBeGreaterThanOrEqual(0);
  });

  it('should return 400 when input.text is missing', async () => {
    const res = await request(app)
      .post('/v1/capabilities/run')
      .send({
        capability: 'text_summary',
        input: {},
      });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.capability).toBe('text_summary');
  });

  it('should return 404 for unknown capability', async () => {
    const res = await request(app)
      .post('/v1/capabilities/run')
      .send({
        capability: 'nonexistent',
        input: {},
      });

    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('CAPABILITY_NOT_FOUND');
    expect(res.body.meta).toBeDefined();
  });

  it('should return 400 when request body is empty', async () => {
    const res = await request(app)
      .post('/v1/capabilities/run')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.meta).toBeDefined();
  });

  it('should auto-generate request_id when not provided', async () => {
    const res = await request(app)
      .post('/v1/capabilities/run')
      .send({
        capability: 'text_summary',
        input: { text: 'Hello world. This is a test sentence.' },
      });

    expect(res.status).toBe(200);
    expect(res.body.meta.request_id).toBeTypeOf('string');
    expect(res.body.meta.request_id.length).toBeGreaterThan(0);
    // UUID v4 format
    expect(res.body.meta.request_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('should return request_id as-is when provided', async () => {
    const res = await request(app)
      .post('/v1/capabilities/run')
      .send({
        capability: 'text_summary',
        input: { text: 'Some text to summarize.' },
        request_id: 'my-custom-id-001',
      });

    expect(res.status).toBe(200);
    expect(res.body.meta.request_id).toBe('my-custom-id-001');
  });

  it('should return positive elapsed_ms', async () => {
    const res = await request(app)
      .post('/v1/capabilities/run')
      .send({
        capability: 'text_summary',
        input: { text: 'Performance timing test.' },
      });

    expect(res.body.meta.elapsed_ms).toBeTypeOf('number');
    expect(res.body.meta.elapsed_ms).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(res.body.meta.elapsed_ms)).toBe(true);
  });

  it('should return 400 when input is null', async () => {
    const res = await request(app)
      .post('/v1/capabilities/run')
      .send({
        capability: 'text_summary',
        input: null,
      });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should validate max_length is a positive number', async () => {
    const res = await request(app)
      .post('/v1/capabilities/run')
      .send({
        capability: 'text_summary',
        input: { text: 'Hello world.', max_length: -5 },
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /v1/capabilities/run — image_caption', () => {
  it('should return a mock caption for a valid image URL', async () => {
    const res = await request(app)
      .post('/v1/capabilities/run')
      .send({
        capability: 'image_caption',
        input: { image_url: 'https://example.com/photo.jpg' },
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.result).toBeTypeOf('string');
    expect(res.body.meta.capability).toBe('image_caption');
  });

  it('should return 400 for missing image_url', async () => {
    const res = await request(app)
      .post('/v1/capabilities/run')
      .send({
        capability: 'image_caption',
        input: {},
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid URL format', async () => {
    const res = await request(app)
      .post('/v1/capabilities/run')
      .send({
        capability: 'image_caption',
        input: { image_url: 'not-a-url' },
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /v1/capabilities', () => {
  it('should list registered capabilities', async () => {
    const res = await request(app).get('/v1/capabilities');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.capabilities).toContain('text_summary');
    expect(res.body.capabilities).toContain('image_caption');
  });
});

describe('GET /health', () => {
  it('should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
