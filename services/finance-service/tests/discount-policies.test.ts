import request from 'supertest';
import app from '../src/utils/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Discount Policies API', () => {
  let testPolicyId: number;

  // Cleanup before all tests
  beforeAll(async () => {
    await prisma.discount_policies.deleteMany({
      where: {
        user_role: {
          in: ['EMPLOYEE', 'MANAGER']
        }
      }
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    await prisma.discount_policies.deleteMany({
      where: {
        user_role: {
          in: ['EMPLOYEE', 'MANAGER']
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/discount-policies', () => {
    it('should create a new discount policy', async () => {
      const response = await request(app)
        .post('/api/discount-policies')
        .send({
          user_role: 'EMPLOYEE',
          max_discount_percentage: 10.00,
          requires_approval_above: 5.00
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.user_role).toBe('EMPLOYEE');
      expect(parseFloat(response.body.max_discount_percentage)).toBe(10.00);

      testPolicyId = response.body.id;
    });

    it('should create discount policy without requires_approval_above (nullable)', async () => {
      const response = await request(app)
        .post('/api/discount-policies')
        .send({
          user_role: 'MANAGER',
          max_discount_percentage: 25.00
        });

      expect(response.status).toBe(201);
      expect(response.body.requires_approval_above).toBeNull();
    });

    it('should return 400 if user_role is invalid', async () => {
      const response = await request(app)
        .post('/api/discount-policies')
        .send({
          user_role: 'INVALID_ROLE',
          max_discount_percentage: 15.00
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 if max_discount_percentage is missing', async () => {
      const response = await request(app)
        .post('/api/discount-policies')
        .send({
          user_role: 'ADMIN'
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 if requires_approval_above > max_discount_percentage', async () => {
      const response = await request(app)
        .post('/api/discount-policies')
        .send({
          user_role: 'HR',
          max_discount_percentage: 10.00,
          requires_approval_above: 15.00
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('approval threshold');
    });
  });

  describe('GET /api/discount-policies', () => {
    it('should get all discount policies', async () => {
      const response = await request(app).get('/api/discount-policies');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/discount-policies/:id', () => {
    it('should get a discount policy by id', async () => {
      const response = await request(app).get(`/api/discount-policies/${testPolicyId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testPolicyId);
      expect(response.body.user_role).toBe('EMPLOYEE');
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app).get('/api/discount-policies/999999');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/discount-policies/role/:role', () => {
    it('should get discount policy by user role', async () => {
      const response = await request(app).get('/api/discount-policies/role/EMPLOYEE');

      expect(response.status).toBe(200);
      expect(response.body.user_role).toBe('EMPLOYEE');
    });

    it('should return 404 for role without policy', async () => {
      const response = await request(app).get('/api/discount-policies/role/FINANCE');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/discount-policies/:id', () => {
    it('should update an existing discount policy', async () => {
      const response = await request(app)
        .put(`/api/discount-policies/${testPolicyId}`)
        .send({
          max_discount_percentage: 15.00,
          requires_approval_above: 10.00
        });

      expect(response.status).toBe(200);
      expect(parseFloat(response.body.max_discount_percentage)).toBe(15.00);
    });

    it('should return 404 when updating non-existent policy', async () => {
      const response = await request(app)
        .put('/api/discount-policies/999999')
        .send({
          max_discount_percentage: 20.00
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/discount-policies/:id', () => {
    it('should delete a discount policy', async () => {
      const response = await request(app).delete(`/api/discount-policies/${testPolicyId}`);

      expect(response.status).toBe(200);

      // Verify deletion
      const checkResponse = await request(app).get(`/api/discount-policies/${testPolicyId}`);
      expect(checkResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent policy', async () => {
      const response = await request(app).delete('/api/discount-policies/999999');

      expect(response.status).toBe(404);
    });
  });

  describe('Validation Tests', () => {
    it('should validate max_discount_percentage range (0-100)', async () => {
      const response = await request(app)
        .post('/api/discount-policies')
        .send({
          user_role: 'ADMIN',
          max_discount_percentage: 150.00
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('0-100');
    });

    it('should not allow negative discount percentage', async () => {
      const response = await request(app)
        .post('/api/discount-policies')
        .send({
          user_role: 'FINANCE',
          max_discount_percentage: -10.00
        });

      expect(response.status).toBe(400);
    });

    it('should enforce unique user_role constraint', async () => {
      // First policy
      await request(app)
        .post('/api/discount-policies')
        .send({
          user_role: 'ADMIN',
          max_discount_percentage: 30.00
        });

      // Duplicate role
      const response = await request(app)
        .post('/api/discount-policies')
        .send({
          user_role: 'ADMIN',
          max_discount_percentage: 35.00
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });
  });
});
