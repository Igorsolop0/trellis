describe('Auth API', () => {
    test('POST /auth/login - success', async () => {
        const res = await request(app).post('/auth/login').send(validCreds);
        expect(res.status).toBe(200);
    });

    test('POST /auth/login - wrong_password', async () => {
        const res = await request(app).post('/auth/login').send(badPass);
        expect(res.status).toBe(401);
    });
});
