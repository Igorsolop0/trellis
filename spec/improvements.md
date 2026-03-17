# Improvements & Tech Debt

## Stack Improvements

### High Priority
- [ ] **Express 5 → Hono або Fastify** — Express 5 не повністю стабільний; Hono легший і type-safe, Fastify швидший в 2-3x
- [ ] **Додати Turborepo** — client/server зараз без зв'язку; потрібні спільні типи, єдиний build pipeline, кешування
- [ ] **Прибрати next-themes** — зайва залежність від Next.js екосистеми в Vite проекті, ThemeContext вже є

### Medium Priority
- [ ] **Wouter → TanStack Router** — type-safe params, nested layouts, loaders — краще для росту проекту
- [ ] **OpenAI → Claude API (або гібрид)** — більше контекстне вікно, краще для аналізу коду; можна embeddings від OpenAI + reasoning від Claude

### Low Priority
- [ ] **Розглянути міграцію на Next.js 15 App Router** — один деплой, Server Components, вбудований routing; але великий рефакторинг

## Tech Debt
- [ ] AI-аналіз на бекенді — заглушки, потрібна реальна інтеграція
- [ ] Інтеграція з Supabase (pgvector для семантичного пошуку)
- [ ] Реальні дані замість mockData

## Ideas / TODO
