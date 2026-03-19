import { classifyTestType, TestTypeSignals, calculateBehaviorScore } from '../services/classificationService';

describe('classifyTestType', () => {

    // ─── Behavior (black-box) tests ───

    describe('should classify as behavior', () => {
        it('E2E test is always behavior', () => {
            const result = classifyTestType({
                name: 'User can login with valid credentials',
                layer: 'e2e',
                filepath: 'e2e/login.spec.ts',
                body: 'await page.goto("/login"); await page.fill("#email", "user@test.com");',
            });
            expect(result.type).toBe('behavior');
            expect(result.confidence).toBeGreaterThanOrEqual(0.9);
        });

        it('test with UI selectors is behavior', () => {
            const result = classifyTestType({
                name: 'should display error message for invalid email',
                layer: 'unit',
                filepath: 'src/components/__tests__/LoginForm.test.tsx',
                body: 'render(<LoginForm />); const error = screen.getByText("Invalid email"); expect(error).toBeVisible();',
            });
            expect(result.type).toBe('behavior');
            expect(result.signals).toContain('ui_selectors');
        });

        it('test with page objects is behavior', () => {
            const result = classifyTestType({
                name: 'should navigate to dashboard after login',
                layer: 'e2e',
                filepath: 'e2e/login.spec.ts',
                body: 'const loginPage = new LoginPage(page); await loginPage.login("user", "pass");',
            });
            expect(result.type).toBe('behavior');
            expect(result.signals).toContain('page_objects');
        });

        it('API test checking HTTP status is behavior', () => {
            const result = classifyTestType({
                name: 'POST /auth/login returns 200 for valid credentials',
                layer: 'api',
                filepath: 'tests/api/auth.spec.ts',
                body: 'const res = await request(app).post("/auth/login").send(validCreds); expect(res.status).toBe(200);',
            });
            expect(result.type).toBe('behavior');
            expect(result.signals).toContain('http_status');
        });

        it('test with user-centric name is behavior', () => {
            const result = classifyTestType({
                name: 'User sees validation error when password is empty',
                layer: 'unit',
                filepath: 'src/components/__tests__/LoginForm.test.tsx',
                body: 'render(<LoginForm />); fireEvent.click(submitButton); expect(screen.getByText("Password required")).toBeInTheDocument();',
            });
            expect(result.type).toBe('behavior');
            expect(result.signals).toContain('user_centric_name');
        });

        it('test rendering a component and checking output is behavior', () => {
            const result = classifyTestType({
                name: 'renders submit button disabled when loading',
                layer: 'unit',
                filepath: 'src/components/__tests__/LoginForm.test.tsx',
                body: 'render(<LoginForm isLoading={true} />); expect(screen.getByRole("button")).toBeDisabled();',
            });
            expect(result.type).toBe('behavior');
            expect(result.signals).toContain('component_render');
        });
    });

    // ─── Implementation (white-box) tests ───

    describe('should classify as implementation', () => {
        it('test calling internal function directly is implementation', () => {
            const result = classifyTestType({
                name: 'validates email format',
                layer: 'unit',
                filepath: 'src/auth/__tests__/validation.test.ts',
                body: 'const result = isValidEmail("test@invalid"); expect(result).toBe(false);',
            });
            expect(result.type).toBe('implementation');
            expect(result.signals).toContain('direct_function_call');
        });

        it('test with jest.mock is implementation', () => {
            const result = classifyTestType({
                name: 'hashes password before sending',
                layer: 'unit',
                filepath: 'src/auth/__tests__/auth.test.ts',
                body: 'jest.mock("../hashService"); const hash = hashPassword("secret"); expect(bcrypt.hash).toHaveBeenCalledWith("secret", 10);',
            });
            expect(result.type).toBe('implementation');
            expect(result.signals).toContain('mocks_internals');
        });

        it('test checking internal state is implementation', () => {
            const result = classifyTestType({
                name: 'sets isLoading to true during request',
                layer: 'unit',
                filepath: 'src/hooks/__tests__/useAuth.test.ts',
                body: 'const { result } = renderHook(() => useAuth()); act(() => result.current.login()); expect(result.current.isLoading).toBe(true);',
            });
            expect(result.type).toBe('implementation');
        });

        it('test with technical name and no UI is implementation', () => {
            const result = classifyTestType({
                name: 'parses JWT token correctly',
                layer: 'unit',
                filepath: 'src/utils/__tests__/jwt.test.ts',
                body: 'const payload = parseToken(mockToken); expect(payload.sub).toBe("user-123");',
            });
            expect(result.type).toBe('implementation');
            expect(result.signals).toContain('technical_name');
        });

        it('test asserting on return value of utility function is implementation', () => {
            const result = classifyTestType({
                name: 'trims whitespace in username',
                layer: 'unit',
                filepath: 'src/utils/__tests__/strings.test.ts',
                body: 'expect(trimUsername("  admin  ")).toBe("admin");',
            });
            expect(result.type).toBe('implementation');
        });
    });

    // ─── Non-functional tests ───

    describe('should classify as non_functional', () => {
        it('performance test is non-functional', () => {
            const result = classifyTestType({
                name: 'login page loads within 2 seconds',
                layer: 'e2e',
                filepath: 'e2e/performance/login.perf.ts',
                body: 'const start = Date.now(); await page.goto("/login"); expect(Date.now() - start).toBeLessThan(2000);',
            });
            expect(result.type).toBe('non_functional');
            expect(result.signals).toContain('performance');
        });

        it('security test is non-functional', () => {
            const result = classifyTestType({
                name: 'should not expose password in response',
                layer: 'api',
                filepath: 'tests/security/auth.test.ts',
                body: 'const res = await request(app).get("/users/me"); expect(res.body.password).toBeUndefined();',
            });
            expect(result.type).toBe('non_functional');
            expect(result.signals).toContain('security');
        });
    });

    // ─── Edge cases ───

    describe('edge cases', () => {
        it('ambiguous test defaults to implementation for unit layer', () => {
            const result = classifyTestType({
                name: 'handles network timeout',
                layer: 'unit',
                filepath: 'src/__tests__/network.test.ts',
                body: 'expect(handleTimeout()).rejects.toThrow();',
            });
            // Unit tests default to implementation unless behavior signals found
            expect(result.type).toBe('implementation');
        });

        it('returns signals array explaining the classification', () => {
            const result = classifyTestType({
                name: 'User can login',
                layer: 'e2e',
                filepath: 'e2e/login.spec.ts',
                body: 'await page.goto("/login");',
            });
            expect(result.signals).toBeInstanceOf(Array);
            expect(result.signals.length).toBeGreaterThan(0);
        });
    });
});

describe('calculateBehaviorScore', () => {
    it('returns 1.0 when all tests are behavior', () => {
        const score = calculateBehaviorScore([
            { type: 'behavior', confidence: 0.9, signals: [] },
            { type: 'behavior', confidence: 0.8, signals: [] },
        ]);
        expect(score.score).toBe(1.0);
        expect(score.behaviorCount).toBe(2);
        expect(score.totalCount).toBe(2);
    });

    it('returns 0.0 when all tests are implementation', () => {
        const score = calculateBehaviorScore([
            { type: 'implementation', confidence: 0.9, signals: [] },
            { type: 'implementation', confidence: 0.8, signals: [] },
        ]);
        expect(score.score).toBe(0.0);
        expect(score.implementationCount).toBe(2);
    });

    it('returns correct ratio for mixed tests', () => {
        const score = calculateBehaviorScore([
            { type: 'behavior', confidence: 0.9, signals: [] },
            { type: 'implementation', confidence: 0.8, signals: [] },
            { type: 'behavior', confidence: 0.7, signals: [] },
            { type: 'implementation', confidence: 0.9, signals: [] },
        ]);
        expect(score.score).toBe(0.5);
        expect(score.behaviorCount).toBe(2);
        expect(score.implementationCount).toBe(2);
    });

    it('returns 0 for empty array', () => {
        const score = calculateBehaviorScore([]);
        expect(score.score).toBe(0);
        expect(score.totalCount).toBe(0);
    });

    it('includes non_functional in total but not in behavior', () => {
        const score = calculateBehaviorScore([
            { type: 'behavior', confidence: 0.9, signals: [] },
            { type: 'non_functional', confidence: 0.8, signals: [] },
        ]);
        expect(score.score).toBe(0.5);
        expect(score.totalCount).toBe(2);
        expect(score.nonFunctionalCount).toBe(1);
    });

    it('calculates per-layer breakdown', () => {
        const score = calculateBehaviorScore(
            [
                { type: 'behavior', confidence: 0.9, signals: [] },
                { type: 'implementation', confidence: 0.8, signals: [] },
                { type: 'behavior', confidence: 0.9, signals: [] },
            ],
            ['e2e', 'unit', 'api'],
        );
        expect(score.byLayer?.unit).toBe(0.0);
        expect(score.byLayer?.api).toBe(1.0);
        expect(score.byLayer?.e2e).toBe(1.0);
    });
});
