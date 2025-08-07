const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Security Tests', () => {
  const validUser = {
    email: 'security@example.com',
    password: 'SecurePass123!',
    firstName: 'Security',
    lastName: 'Test'
  };

  describe('Password Security', () => {
    it('should enforce minimum password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: '123' })
        .expect(400);

      expect(response.body.error).toMatch(/password.*8.*characters/i);
    });

    it('should not return password in any response', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body.user).not.toHaveProperty('password');
    });
  });

  describe('JWT Token Security', () => {
    let authToken;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser);
      authToken = response.body.token;
    });

    it('should include user ID in JWT payload', async () => {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(authToken);
      
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    it('should expire JWT tokens', async () => {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(authToken);
      
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
      expect(decoded.exp - decoded.iat).toBeLessThanOrEqual(24 * 60 * 60); // Max 24 hours
    });
  });

  describe('Input Validation', () => {
    it('should sanitize input to prevent XSS', async () => {
      const maliciousData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousData)
        .expect(201);

      expect(response.body.user.firstName).not.toContain('<script>');
    });

    it('should validate email format strictly', async () => {
      const invalidEmails = ['invalid', '@example.com', 'test@', 'test.example.com'];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({ ...validUser, email })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting on auth endpoints', async () => {
      const requests = Array(20).fill(null).map(() => 
        request(app)
          .post('/api/auth/login')
          .send({ email: 'nonexistent@example.com', password: 'wrongpass' })
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.some(res => res.status === 429);
      
      expect(tooManyRequests).toBe(true);
    });
  });
});
