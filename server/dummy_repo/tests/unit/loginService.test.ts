
import { AuthService } from '../../src/services/auth';

describe('AuthService Unit Tests', () => {
    let authService;

    beforeEach(() => {
        authService = new AuthService();
    });

    test('validateEmail should return true for valid email', () => {
        const result = authService.validateEmail('user@example.com');
        expect(result).toBe(true);
    });

    test('validateEmail should return false for invalid email format', () => {
        const result = authService.validateEmail('invalid-email');
        expect(result).toBe(false);
    });

    test('login should throw error for empty password', async () => {
        await expect(authService.login('user@example.com', '')).rejects.toThrow('Password required');
    });

    test('encryptPassword should hash the password correctly', () => {
        const hash = authService.encryptPassword('secret123');
        expect(hash).not.toBe('secret123');
        expect(hash.length).toBeGreaterThan(10);
    });
});
