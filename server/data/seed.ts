import { Feature, FeatureSummary } from '../types';

const MOCK_LOGIN_FEATURE: Feature = {
    id: "feat-001",
    name: "Login",
    category: "Authentication",
    description: "User authentication via email and password",
    status: "controlled",
    layers: {
        unit: {
            name: "unit",
            status: "covered",
            tests: [
                { id: "u1", name: "validates email format", status: "pass", lastRun: new Date() },
                { id: "u2", name: "rejects empty password", status: "pass", lastRun: new Date() },
                { id: "u3", name: "trims whitespace in username", status: "pass", lastRun: new Date() },
                { id: "u4", name: "hashes password before sending", status: "pass", lastRun: new Date() },
                { id: "u5", name: "handles network timeout", status: "pending", lastRun: new Date() },
                { id: "u6", name: "clears error on input", status: "pass", lastRun: new Date() },
                { id: "u7", name: "disables button while loading", status: "pass", lastRun: new Date() },
            ],
        },
        api: {
            name: "api",
            status: "covered",
            tests: [
                { id: "a1", name: "POST /auth/login - success", status: "pass", description: "Verifies 200 OK and JWT return", lastRun: new Date() },
                { id: "a2", name: "POST /auth/login - wrong_password", status: "pass", description: "Verifies 401 Unauthorized", lastRun: new Date() },
                { id: "a3", name: "POST /auth/login - non_existing_user", status: "pass", description: "Verifies 404 Not Found", lastRun: new Date() },
                { id: "a4", name: "POST /auth/login - empty_credentials", status: "pass", description: "Verifies 400 Bad Request", lastRun: new Date() },
            ],
        },
        e2e: {
            name: "e2e",
            status: "partial",
            tests: [
                { id: "e1", name: "User can login with valid credentials", status: "pass", description: "Full flow from home -> login -> dashboard", lastRun: new Date() },
                { id: "e2", name: "User sees error message on empty password", status: "pass", description: "Validation UI check", lastRun: new Date() },
            ],
        },
    },
    duplications: [
        {
            id: "d1",
            layers: ["unit", "api", "e2e"],
            description: "Empty password validation is checked in all 3 layers. Consider removing E2E check if UI logic is covered by Unit tests.",
            severity: "low",
        },
    ],
    gaps: [
        {
            id: "g1",
            description: "No Unit test for locked user state handling in UI component",
            suggestedLayer: "unit",
            priority: "medium",
        },
        {
            id: "g2",
            description: "No API test for rate limiting on /auth/login endpoint",
            suggestedLayer: "api",
            priority: "high",
        },
    ],
};

const MOCK_REGISTER_FEATURE: Feature = {
    id: "feat-002",
    name: "Registration",
    category: "Authentication",
    description: "New user registration flow",
    status: "partial",
    layers: {
        unit: { name: "unit", status: "covered", tests: [] },
        api: { name: "api", status: "partial", tests: [] },
        e2e: { name: "e2e", status: "missing", tests: [] }
    },
    duplications: [],
    gaps: []
};

const MOCK_CHECKOUT_FEATURE: Feature = {
    id: "feat-003",
    name: "Checkout",
    category: "Orders",
    description: "Product checkout and payment processing",
    status: "at_risk",
    layers: {
        unit: { name: "unit", status: "partial", tests: [] },
        api: { name: "api", status: "covered", tests: [] },
        e2e: { name: "e2e", status: "missing", tests: [] }
    },
    duplications: [],
    gaps: []
};

export const MOCK_FEATURES = [MOCK_LOGIN_FEATURE, MOCK_REGISTER_FEATURE, MOCK_CHECKOUT_FEATURE];
