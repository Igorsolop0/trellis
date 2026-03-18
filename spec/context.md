## Trellis — Project Context

**Trellis** — behavior-based test traceability and optimization platform. Connects tests across unit, API, and E2E layers even when there are no Jira links or manual tagging.

### Problem
Teams write tests at different layers but can't see:
- Which tests cover a specific user behavior
- Where duplications exist between unit/api/e2e
- Which checks should move to a cheaper layer
- What will break during framework migrations (Cypress → Playwright)

### How it works
1. **Connect** a GitHub repo (read-only)
2. **Scan** — finds test files, parses them via AST (assertions, endpoints, selectors, frameworks)
3. **Infer** — AI (GLM-4) groups tests into behavior scenarios ("User logs in with valid credentials" instead of "AuthService unit tests")
4. **Visualize** — coverage chain per scenario: Unit → API → E2E with confidence scores
5. **Optimize** — pipeline cost breakdown, recommendations (move to cheaper layer, remove duplicates, add missing coverage)

### Stack
- **Frontend:** React 19, Vite, Tailwind, Framer Motion
- **Backend:** Express, TypeScript, Prisma
- **Database:** Supabase (PostgreSQL)
- **AI:** GLM-4-plus via z.ai (OpenAI-compatible API)
- **GitHub:** @octokit/rest (read-only file scanning)

### Key entities
- **Feature** → **BehaviorScenario** → **ScenarioLink** → **TestArtifact** → **ExecutionRun**
- **OptimizationInsight** (gaps, redundancy)
- **Recommendation** (move/remove/migrate with accept/reject workflow)

### Target users
- Teams without dedicated QA who write tests with AI and need visibility
- QA leads who want to see gaps and overlaps across layers
- Engineering managers who need pipeline cost optimization and ROI data

### Repo
https://github.com/Igorsolop0/trellis
