# Improvements & Tech Debt

## Completed

- [x] **Supabase інтеграція** — PostgreSQL через Prisma, session/transaction pooler (eu-west-1)
- [x] **Нова доменна модель** — Feature → BehaviorScenario → TestArtifact → ScenarioLink + OptimizationInsight + Recommendation
- [x] **Inference Engine** — AST parsing, heuristic clustering, AI-powered scenario grouping
- [x] **AI інтеграція (GLM-4-plus)** — scenario inference, intent summarization, gap analysis через z.ai BigModel API
- [x] **Scenario View UI** — dark-first дизайн, coverage chains, confidence meters, insight cards, animated gradient borders
- [x] **Pipeline cost calculation** — cost breakdown по шарах, potential savings
- [x] **Recommendation engine** — move/remove/migrate actions з accept/reject workflow
- [x] **Перейменування Sdui → Trellis**
- [x] **GitHub repo** — https://github.com/Igorsolop0/trellis
- [x] **GitHub integration** — read-only скан репозиторіїв через GitHub API (@octokit/rest), пошук тестових файлів, UI для підключення repo

## Stack Improvements

### High Priority
- [ ] **Express 5 → Hono або Fastify** — Express 5 не повністю стабільний; Hono легший і type-safe, Fastify швидший в 2-3x
- [ ] **Додати Turborepo** — client/server зараз без зв'язку; потрібні спільні типи, єдиний build pipeline, кешування
- [ ] **Прибрати next-themes** — зайва залежність від Next.js екосистеми в Vite проекті, ThemeContext вже є

### Medium Priority
- [ ] **Wouter → TanStack Router** — type-safe params, nested layouts, loaders — краще для росту проекту
- [ ] **Supabase pgvector** — semantic search між тестами через embeddings в БД (потрібна embedding модель або self-hosted)

### Low Priority
- [ ] **Розглянути міграцію на Next.js 15 App Router** — один деплой, Server Components, вбудований routing; але великий рефакторинг

## Tech Debt
- [ ] **Embeddings недоступні на z.ai** — зараз використовується chat-based similarity; потрібно або self-hosted embedding model, або інший провайдер
- [ ] **Дублювання сценаріїв при повторному inference** — потрібно очищати старі scenarios перед re-run або merge logic
- [ ] **Mock data в dummy_repo** — тепер можна сканувати реальні repo через GitHub, але dummy_repo залишився
- [ ] **Відсутній error handling в UI** — немає toast notifications при помилках API

## Ideas / TODO
- [ ] **CI/CD інтеграція** — GitHub Actions webhook для автоматичного підтягування test results, duration, flaky stats
- [ ] **Realtime updates** — Supabase Realtime для live оновлень при запуску тестів
- [ ] **Auth** — щоб команди бачили тільки свої фічі
- [ ] **Migration mode UI** — детальний view для Cypress → Playwright migration (recommendation `migrate_framework` вже є)
- [ ] **PDF/CSV export** — traceability report для менеджменту
- [ ] **GitHub OAuth** — замість токена з env, дати юзерам підключати свої GitHub акаунти
- [ ] **Автоматичний re-scan** — webhook або scheduled scan при push в repo
