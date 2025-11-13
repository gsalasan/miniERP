import request from 'supertest';
import { app } from '../src/utils/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Pricing Rules API', () => {
  let testRuleId: number;

  // Cleanup before all tests
  beforeAll(async () => {
    // Delete test data if exists
    await prisma.pricing_rules.deleteMany({
      where: {
        category: {
          in: ['Test Category', 'Updated Test Category', 'Another Test']
        }
      }
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Delete test data
    await prisma.pricing_rules.deleteMany({
      where: {
        category: {
          in: ['Test Category', 'Updated Test Category', 'Another Test']
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/pricing-rules', () => {
    it('should create a new pricing rule', async () => {
      const response = await request(app)
        .post('/api/pricing-rules')
        .send({
          category: 'Test Category',
          markup_percentage: 25.50
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.category).toBe('Test Category');
      expect(parseFloat(response.body.markup_percentage)).toBe(25.50);

      testRuleId = response.body.id;
    });

    it('should return 400 if category is missing', async () => {
      const response = await request(app)
        .post('/api/pricing-rules')
        .send({
          markup_percentage: 30.00
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if markup_percentage is missing', async () => {
      const response = await request(app)
        .post('/api/pricing-rules')
        .send({
          category: 'Invalid Rule'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if category already exists', async () => {
      const response = await request(app)
        .post('/api/pricing-rules')
        .send({
          category: 'Test Category',
          markup_percentage: 30.00
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/pricing-rules', () => {
    it('should get all pricing rules', async () => {
      const response = await request(app).get('/api/pricing-rules');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/pricing-rules/:id', () => {
    it('should get a pricing rule by id', async () => {
      const response = await request(app).get(`/api/pricing-rules/${testRuleId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testRuleId);
      expect(response.body.category).toBe('Test Category');
    });

    it('should return 404 if pricing rule not found', async () => {
      const response = await request(app).get('/api/pricing-rules/99999');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app).get('/api/pricing-rules/invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/pricing-rules/:id', () => {
    it('should update a pricing rule', async () => {
      const response = await request(app)
        .put(`/api/pricing-rules/${testRuleId}`)
        .send({
          category: 'Updated Test Category',
          markup_percentage: 35.75
        });

      expect(response.status).toBe(200);
      expect(response.body.category).toBe('Updated Test Category');
      expect(parseFloat(response.body.markup_percentage)).toBe(35.75);
    });

    it('should return 404 if pricing rule not found', async () => {
      const response = await request(app)
        .put('/api/pricing-rules/99999')
        .send({
          category: 'Non-existent',
          markup_percentage: 20.00
        });

      expect(response.status).toBe(404);
    });

    it('should return 400 if category is missing', async () => {
      const response = await request(app)
        .put(`/api/pricing-rules/${testRuleId}`)
        .send({
          markup_percentage: 40.00
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 if markup_percentage is missing', async () => {
      const response = await request(app)
        .put(`/api/pricing-rules/${testRuleId}`)
        .send({
          category: 'Incomplete Update'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/pricing-rules/:id', () => {
    let deleteTestId: number;

    beforeAll(async () => {
      // Create a rule to delete
      const rule = await prisma.pricing_rules.create({
        data: {
          category: 'Another Test',
          markup_percentage: 15.00
        }
      });
      deleteTestId = rule.id;
    });

    it('should delete a pricing rule', async () => {
      const response = await request(app).delete(`/api/pricing-rules/${deleteTestId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');

      // Verify it's actually deleted
      const verifyResponse = await request(app).get(`/api/pricing-rules/${deleteTestId}`);
      expect(verifyResponse.status).toBe(404);
    });

    it('should return 404 if pricing rule not found', async () => {
      const response = await request(app).delete('/api/pricing-rules/99999');

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app).delete('/api/pricing-rules/invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('Data Validation', () => {
    it('should reject negative markup percentage', async () => {
      const response = await request(app)
        .post('/api/pricing-rules')
        .send({
          category: 'Negative Test',
          markup_percentage: -10.00
        });

      expect(response.status).toBe(400);
    });

    it('should reject markup percentage exceeding 100', async () => {
      const response = await request(app)
        .post('/api/pricing-rules')
        .send({
          category: 'Exceed Test',
          markup_percentage: 150.00
        });

      expect(response.status).toBe(400);
    });

    it('should handle decimal precision correctly', async () => {
      const response = await request(app)
        .post('/api/pricing-rules')
        .send({
          category: 'Precision Test',
          markup_percentage: 12.345
        });

      // Should round or truncate to 2 decimal places
      expect(response.status).toBe(201);
      const markup = parseFloat(response.body.markup_percentage);
      expect(markup).toBeCloseTo(12.35, 2);

      // Cleanup
      await prisma.pricing_rules.delete({
        where: { id: response.body.id }
      });
    });
  });
});
