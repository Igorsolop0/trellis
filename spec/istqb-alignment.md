# ISTQB Alignment — How Trellis Maps to ISTQB CTFL v4.0.1

## Problem Statement

Most unit and integration tests verify **implementation** (white-box), not **user behavior** (black-box). A test like `validates email format` checks that `isValid()` returns false — but it doesn't tell you whether the user sees an error message, whether the form blocks submission, or whether the API rejects the request.

Trellis should help teams see this distinction and ensure their test suite actually covers **what users experience**, not just what code does.

## ISTQB Test Levels vs Trellis Layers

ISTQB defines 5 test levels. Trellis currently supports 3:

| ISTQB Level | Trellis Layer | What it Tests | Status |
|---|---|---|---|
| Component testing | `unit` | Isolated functions/classes | Supported |
| Component integration | — | Interfaces between components | Missing |
| System testing | `e2e` (partial) | Full system behavior, functional + non-functional | Partial |
| System integration | — | Interfaces with external systems | Missing |
| Acceptance testing (UAT) | — | Business needs validation | Missing |

### Gap: We collapse 5 levels into 3
- Component integration (service-to-service, module-to-module) gets lumped into `unit` or `api`
- System testing and acceptance testing both map to `e2e`
- No way to distinguish "tests the API contract" from "tests the user flow"

### Recommendation
Expand to 5 layers: `unit` | `integration` | `api` | `e2e` | `acceptance`

## ISTQB Test Types — Behavior vs Implementation

ISTQB distinguishes test types by what they verify:

| Test Type | Focus | Example |
|---|---|---|
| **Functional (black-box)** | WHAT the system does | "User can log in with valid credentials" |
| **Non-functional** | HOW WELL the system does it | "Login page loads in < 2 seconds" |
| **White-box (structural)** | Code structure & paths | "All branches in validatePassword() are covered" |

### Key Insight for Trellis
Most unit tests are **white-box** — they test internal implementation:
- `validates email format` → tests `isValid()` function
- `hashes password before sending` → tests `hashPassword()` function

These are valuable but they do NOT verify user behavior. A user doesn't call `isValid()` — they type an email into a form and either see an error or proceed.

**Behavior-covering tests** look like:
- "User sees error message when entering invalid email" (E2E)
- "POST /auth/login returns 400 for invalid email format" (API)
- "LoginForm component shows validation error for invalid email" (Component/Unit with rendering)

### Recommendation
Add a **test type classification** to each TestArtifact:
- `behavior` — verifies user-visible behavior (black-box)
- `implementation` — verifies internal logic (white-box)
- `non_functional` — verifies performance, security, etc.

Then calculate a **Behavior Coverage Score**: what percentage of tests actually cover user behavior.

## ISTQB Traceability

ISTQB says traceability should connect:
```
Test Basis (requirements, user stories, risks)
    ↓
Test Conditions (what to test)
    ↓
Test Cases (how to test)
    ↓
Test Results (what happened)
    ↓
Defects (what failed)
```

### Current Trellis Model
```
Feature
    ↓
BehaviorScenario (= Test Condition)
    ↓
TestArtifact (= Test Case)
    ↓
ExecutionRun (= Test Result)
```

### What's Missing
- **Test Basis** — no link to requirements, user stories, or acceptance criteria
- **Risk** — no risk level on scenarios (likelihood × impact)
- **Defects** — no link to bug tracking

### Recommendation
1. Add optional `acceptanceCriteria` field to BehaviorScenario
2. Add `riskLevel` (high/medium/low) to BehaviorScenario based on business criticality
3. Future: Jira/Linear integration to link scenarios to tickets

## ISTQB Test Techniques for Smarter Gap Detection

ISTQB defines specific black-box techniques that Trellis could check for:

| Technique | What it Covers | How Trellis Could Detect |
|---|---|---|
| **Equivalence Partitioning** | Valid + invalid input groups | Does the test suite cover both valid AND invalid cases? |
| **Boundary Value Analysis** | Edge cases at boundaries | Are there tests for min/max/empty/overflow? |
| **Decision Table Testing** | Combinations of conditions | For multi-condition logic, are all combinations tested? |
| **State Transition Testing** | State changes | For stateful flows (login → dashboard → logout), are transitions covered? |

### Recommendation
AI gap analysis prompt could check: "Does this scenario have tests for happy path AND error cases AND edge cases?" instead of just "is there a test at this layer?"

## ISTQB Risk-Based Testing

ISTQB recommends prioritizing tests by risk:
- **Risk = Likelihood × Impact**
- High-risk scenarios should have more thorough coverage
- Low-risk scenarios can have less coverage

### Recommendation
Add risk scoring to scenarios:
- Business-critical flow (login, checkout, payment) = high risk
- Admin settings page = low risk
- Recommendations should weight by risk: "This high-risk scenario has no unit tests" > "This low-risk scenario has no E2E"

## Summary of Proposed Improvements

| Improvement | Impact | Effort |
|---|---|---|
| **Test type classification** (behavior/implementation/non-functional) | High — answers "do my tests cover user behavior?" | Medium |
| **Behavior Coverage Score** | High — new KPI for teams | Low (once classification exists) |
| **Expand to 5 layers** | Medium — more accurate mapping | Medium |
| **Risk scoring on scenarios** | High — smarter prioritization | Low |
| **Acceptance criteria linking** | Medium — connects to requirements | Low |
| **Smarter gap detection** (EP, BVA, state transitions) | Medium — deeper analysis | Medium |
