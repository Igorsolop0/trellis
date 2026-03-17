**Spec**

Починати варто не з екранів, а з чіткого формулювання проблеми й артефактів системи.

`Product problem`
Команди мають тести на різних рівнях, але не бачать:
- якими саме тестами покрита конкретна behavior/feature
- де є дублювання між unit/api/e2e
- які перевірки краще перенести на дешевший рівень
- що втратиться при міграції Cypress -> Playwright або при зміні pipeline strategy

`Core hypothesis`
Навіть якщо тести не прив’язані до Jira/requirements, можна побудувати корисну `behavior-based traceability` через:
- назви тестів
- AST/body тестів
- файловий контекст
- доменні ключові слова
- runtime metadata
- semantic similarity між тестами різних рівнів

`Primary entity`
Головна сутність має бути не `Feature` у сенсі Jira-ticket, а `BehaviorScenario`.

Приклад:
- `User logs in with valid credentials`
- `User sees validation for invalid password`
- `Expired session redirects to login`

Саме до цього сценарію лінкуються тести різних рівнів.

`Main user stories`
1. Як QA/Engineer я хочу відкрити feature/behavior і побачити весь chain: `unit -> api -> e2e`.
2. Як QA Lead я хочу бачити gaps і overlaps між рівнями.
3. Як команда, що мігрує Cypress -> Playwright, я хочу зрозуміти, які old e2e already covered lower-level tests.
4. Як Engineering Manager я хочу бачити expensive coverage і рекомендації для pipeline optimization.

`MVP success criteria`
- для 1 feature система групує тести в 3-7 осмислених сценаріїв
- для кожного сценарію видно coverage by layer
- система показує хоча б 2 типи insight:
  - missing layer
  - possible redundancy
- користувач може пояснити, чому певний e2e тест існує або зайвий

---

**Design**

Тут я б переосмислив модель даних і весь flow навколо `scenario graph`.

`1. Domain model`
Замість поточної моделі `Feature -> layers -> tests` краще рухатись до:

- `Feature`
- `BehaviorScenario`
- `TestArtifact`
- `ScenarioLink`
- `ExecutionRun`
- `OptimizationInsight`

Мінімально:

```ts
Feature {
  id
  name
  description
  category
}

BehaviorScenario {
  id
  featureId
  title
  summary
  confidence
  source // inferred | manual | imported
}

TestArtifact {
  id
  name
  layer // unit | api | e2e
  filepath
  codeSignature
  intentSummary
  framework // jest | vitest | playwright | cypress | supertest
}

ScenarioLink {
  id
  scenarioId
  testArtifactId
  confidence
  rationale
  linkType // verifies | partially_verifies | duplicates
}

ExecutionRun {
  id
  testArtifactId
  status
  durationMs
  commitHash
  ciJobId
  createdAt
}

OptimizationInsight {
  id
  scenarioId
  type // missing_layer | redundancy | expensive_e2e | weak_assertion
  severity
  summary
  recommendation
}
```

`2. Product flow`
Сильний flow для MVP:
1. Scan repo
2. Parse tests
3. Normalize tests into `TestArtifact`
4. Infer `BehaviorScenario`
5. Link tests to scenarios with confidence
6. Generate insights
7. Render chain per scenario

`3. Detection logic`
Не варто одразу покладатися тільки на LLM. Краще hybrid pipeline:

- Rule-based parsing
  - `describe/it/test` names
  - file path
  - framework detection
  - tags
- AST summarization
  - action verbs
  - assertions
  - API endpoints
  - page objects/selectors
- Semantic similarity
  - embeddings for scenario clustering
- LLM verification
  - тільки для ambiguous cases
- Human correction
  - accepted/rejected links

`4. UX direction`
Головний екран має бути не просто card list, а 3 views:

- `Feature View`
  Показує feature summary, risk, cost, coverage ratio.

- `Scenario View`
  Найважливіший екран.
  Для кожного scenario:
  - unit tests
  - api tests
  - e2e tests
  - confidence
  - missing links
  - duplicates
  - recommendation

- `Optimization View`
  Дає управлінський сенс:
  - “3 e2e tests overlap with api coverage”
  - “this scenario has only e2e and no lower-level safety net”
  - “moving X checks from e2e to api could reduce pipeline cost”

`5. MVP output`
Якщо коротко, найсильніший MVP артефакт:
- `Scenario Coverage Graph`
- `Optimization Insights Panel`
- `Migration Impact View`

`6. What to de-prioritize now`
Поки не інвестував би сильно в:
- красивий PDF RTM
- Jira integration as core
- генерацію тестів AI-кою
- складні ролі/авторизацію
- polished dashboard metrics without strong inference engine

---

**Development**

Я б розбив розробку на 4 фази.

`Phase 1. Stabilize the data model`
Мета: перейти від demo-моделі до справжнього graph foundation.

Що зробити:
- додати Prisma-моделі для `BehaviorScenario`, `TestArtifact`, `ScenarioLink`, `OptimizationInsight`
- перестати зберігати тести лише всередині feature layers
- винести correlation/gap data в БД
- зберігати `framework`, `filepath`, `intentSummary`, `codeSignature`

Очікуваний результат:
- дані не губляться між запусками
- correlations/gaps стають реальними сутностями, а не runtime decoration

`Phase 2. Build the inference engine`
Мета: навчити систему будувати chain без Jira.

Що зробити:
- покращити ingestion patterns для реальних repo structures
- розширити AST parser:
  - test title
  - describe hierarchy
  - assertions
  - endpoints
  - selectors / page objects
- додати `scenario clustering`
- додати `scenario linking confidence`
- реалізувати `analyzeCrossLayerCorrelations()`
- реалізувати `analyzeGaps()`

Принцип:
- спочатку deterministic heuristics
- потім embeddings
- потім LLM verify only on low-confidence cases

Очікуваний результат:
- для feature з’являються реальні grouped scenarios
- у кожного scenario є набір linked tests по рівнях

`Phase 3. Make the product useful`
Мета: дати користувачу рішення, а не просто visualization.

Що зробити:
- Scenario View в UI
- confidence badges
- explainability:
  - чому цей test linked
  - які сигнали спрацювали
- insights:
  - missing lower-level coverage
  - e2e-only scenario
  - duplicate intent across layers
  - expensive test concentration

Очікуваний результат:
- користувач може приймати рішення по test strategy, а не лише дивитися граф

`Phase 4. Add the business payoff`
Мета: довести, що це інструмент для optimization.

Що зробити:
- підтягувати test duration / flaky stats / run frequency
- рахувати approximate pipeline cost per scenario
- додати migration mode:
  - Cypress tests mapped to Playwright tests
  - missing migrated scenarios
  - lower-level safety net availability
- додати recommendation engine:
  - keep at e2e
  - move to api
  - move to unit
  - remove as duplicate candidate

Очікуваний результат:
- з’являється чіткий ROI narrative

---

**Concrete MVP Plan**

Якби ми обирали лише 3 найбільш цінні кроки, я б радив такі:

1. Ввести `BehaviorScenario` як центральну сутність.
2. Реально реалізувати `cross-layer correlations` і зберігати їх у БД.
3. Побудувати UI навколо `scenario coverage + optimization insight`, а не навколо просто `feature cards`.

Це дасть тобі MVP, який уже можна показувати і пояснювати без фрази “ну тут AI потім доробимо”.

---

**Recommended Spec Slice**

Якщо хочеш рухатися маленькими і сильними кроками, ось найкращий перший slice:

`Goal`
Для 1 feature система автоматично виділяє scenario groupings і показує chain між unit/api/e2e.

`Input`
- test files from repo
- existing feature names/descriptions

`Output`
- 3-7 scenarios per feature
- linked tests with confidence
- gap/redundancy hints

`Non-goals`
- Jira sync
- test generation
- pipeline cost math
- flaky analytics

---

**Моя порада по позиціонуванню**

Я б формулював проєкт так:

`A behavior-based test traceability and optimization dashboard`

Не “traceability matrix replacement”, а:
- “connects tests across layers even when ticket links are missing”
- “helps teams understand coverage by behavior”
- “supports migration and pipeline optimization”

Це звучить точніше і сильніше.

Якщо хочеш, я можу наступним кроком прямо написати тобі `v1 product spec` у вигляді майже готового документа для цього проекту: з problem statement, scope, architecture decisions і phased roadmap.