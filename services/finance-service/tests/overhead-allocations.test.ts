import request from 'supertest';
import app from '../src/utils/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Overhead Allocations API', () => {
  let testAllocationId: number;

  // Cleanup before all tests
  beforeAll(async () => {
    await prisma.overhead_cost_allocations.deleteMany({
      where: {
        cost_category: {
          in: ['Test Overhead', 'Updated Overhead', 'Another Overhead']
        }
      }
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    await prisma.overhead_cost_allocations.deleteMany({
      where: {
        cost_category: {
          in: ['Test Overhead', 'Updated Overhead', 'Another Overhead']
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/overhead-allocations', () => {
    it('should create a new overhead allocation', async () => {
      const response = await request(app)
        .post('/api/overhead-allocations')
        .send({
          cost_category: 'Test Overhead',
          target_percentage: 15.00,
          allocation_percentage_to_hpp: 10.50
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.cost_category).toBe('Test Overhead');
      expect(parseFloat(response.body.allocation_percentage_to_hpp)).toBe(10.50);

      testAllocationId = response.body.id;
    });

    it('should create overhead allocation without target_percentage (nullable)', async () => {
      const response = await request(app)
        .post('/api/overhead-allocations')
        .send({
          cost_category: 'Another Overhead',
          allocation_percentage_to_hpp: 12.00
        });

      expect(response.status).toBe(201);
      expect(response.body.target_percentage).toBeNull();
    });

    it('should return 400 if cost_category is missing', async () => {
      const response = await request(app)
        .post('/api/overhead-allocations')
        .send({
          allocation_percentage_to_hpp: 10.00
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 if allocation_percentage_to_hpp is missing', async () => {
      const response = await request(app)
        .post('/api/overhead-allocations')
        .send({
          cost_category: 'Invalid Overhead'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/overhead-allocations', () => {
    it('should get all overhead allocations', async () => {
      const response = await request(app).get('/api/overhead-allocations');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/overhead-allocations/:id', () => {
    it('should get an overhead allocation by id', async () => {
      const response = await request(app).get(`/api/overhead-allocations/${testAllocationId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testAllocationId);
      expect(response.body.cost_category).toBe('Test Overhead');
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app).get('/api/overhead-allocations/999999');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/overhead-allocations/:id', () => {
    it('should update an existing overhead allocation', async () => {
      const response = await request(app)
        .put(`/api/overhead-allocations/${testAllocationId}`)
        .send({
          allocation_percentage_to_hpp: 15.75
        });

      expect(response.status).toBe(200);
      expect(parseFloat(response.body.allocation_percentage_to_hpp)).toBe(15.75);
    });

    it('should return 404 when updating non-existent allocation', async () => {
      const response = await request(app)
        .put('/api/overhead-allocations/999999')
        .send({
          allocation_percentage_to_hpp: 20.00
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/overhead-allocations/:id', () => {
    it('should delete an overhead allocation', async () => {
      const response = await request(app).delete(`/api/overhead-allocations/${testAllocationId}`);

      expect(response.status).toBe(200);

      // Verify deletion
      const checkResponse = await request(app).get(`/api/overhead-allocations/${testAllocationId}`);
      expect(checkResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent allocation', async () => {
      const response = await request(app).delete('/api/overhead-allocations/999999');

      expect(response.status).toBe(404);
    });
  });

  describe('Validation Tests', () => {
    it('should validate allocation_percentage_to_hpp range (0-100)', async () => {
      const response = await request(app)
        .post('/api/overhead-allocations')
        .send({
          cost_category: 'Invalid Range Test',
          allocation_percentage_to_hpp: 150.00
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('0-100');
    });

    it('should not allow negative allocation percentage', async () => {
      const response = await request(app)
        .post('/api/overhead-allocations')
        .send({
          cost_category: 'Negative Test',
          allocation_percentage_to_hpp: -10.00
        });

      expect(response.status).toBe(400);
    });
  });
});
