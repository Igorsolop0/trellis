
import request from 'supertest';
import app from '../../src/app';

describe('Auth API Integration Tests', () => {

    describe('POST /api/auth/login', () => {
        it('should return 200 and token for valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@user.com', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should return 401 for incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@user.com', password: 'wrongpassword' });

            expect(res.status).toBe(401);
        });

        it('should return 400 validation error for missing fields', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@user.com' });

            expect(res.status).toBe(400);
        });

        it('should lock account after 5 failed attempts', async () => {
            // Simulate 5 failed attempts
            for (let i = 0; i < 5; i++) {
                await request(app).post('/api/auth/login').send({ email: 'locked@user.com', password: 'bad' });
            }

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'locked@user.com', password: 'bad' });

            expect(res.status).toBe(429); // Too many requests
            expect(res.body.message).toContain('locked');
        });
    });
});
