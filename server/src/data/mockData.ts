// Mock data updated for new domain model
// Used for seeding/development only

export const MOCK_FEATURES = [
    { name: 'Login', description: 'User authentication via email and password', category: 'Authentication' },
    { name: 'Registration', description: 'New user registration flow', category: 'Authentication' },
    { name: 'Checkout', description: 'Product checkout and payment processing', category: 'Orders' },
];

export const MOCK_SCENARIOS = {
    Login: [
        { title: 'User logs in with valid credentials', summary: 'Happy path login flow', confidence: 0.95 },
        { title: 'User sees validation for invalid password', summary: 'Error handling for wrong password', confidence: 0.9 },
        { title: 'Expired session redirects to login', summary: 'Session timeout behavior', confidence: 0.8 },
        { title: 'User account gets locked after failed attempts', summary: 'Rate limiting / brute force protection', confidence: 0.7 },
    ],
    Registration: [
        { title: 'User registers with valid data', summary: 'Happy path registration', confidence: 0.85 },
        { title: 'Duplicate email is rejected', summary: 'Unique constraint validation', confidence: 0.8 },
    ],
    Checkout: [
        { title: 'User completes purchase with valid card', summary: 'Happy path checkout', confidence: 0.75 },
    ],
};

export const MOCK_TEST_ARTIFACTS = [
    // Login - Unit
    { name: 'validates email format', layer: 'unit' as const, filepath: 'src/auth/__tests__/login.test.ts', framework: 'jest' as const },
    { name: 'rejects empty password', layer: 'unit' as const, filepath: 'src/auth/__tests__/login.test.ts', framework: 'jest' as const },
    { name: 'hashes password before sending', layer: 'unit' as const, filepath: 'src/auth/__tests__/login.test.ts', framework: 'jest' as const },
    { name: 'disables button while loading', layer: 'unit' as const, filepath: 'src/components/__tests__/LoginForm.test.tsx', framework: 'jest' as const },
    // Login - API
    { name: 'POST /auth/login - success', layer: 'api' as const, filepath: 'tests/api/auth.spec.ts', framework: 'supertest' as const },
    { name: 'POST /auth/login - wrong password', layer: 'api' as const, filepath: 'tests/api/auth.spec.ts', framework: 'supertest' as const },
    { name: 'POST /auth/login - rate limiting', layer: 'api' as const, filepath: 'tests/api/auth.spec.ts', framework: 'supertest' as const },
    // Login - E2E
    { name: 'User can login with valid credentials', layer: 'e2e' as const, filepath: 'e2e/login.spec.ts', framework: 'playwright' as const },
    { name: 'User sees error on empty password', layer: 'e2e' as const, filepath: 'e2e/login.spec.ts', framework: 'playwright' as const },
];
