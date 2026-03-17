describe('User Login Unit Tests', () => {
    it('validates email format', () => {
        const email = 'test@invalid';
        expect(isValid(email)).toBe(false);
    });

    it('rejects empty password', () => {
        // Logic to check empty password
        const result = validatePassword('');
        expect(result.isValid).toBe(false);
    });
});
