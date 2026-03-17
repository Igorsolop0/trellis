# Trellis - Project Documentation

**Project Name:** Trellis  
**Version:** 1.0.0  
**Status:** MVP - Feature Detail View Implemented  
**Last Updated:** January 2026  
**Author:** Manus AI  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision & Goals](#product-vision--goals)
3. [Architecture Overview](#architecture-overview)
4. [Design System](#design-system)
5. [Feature Implementation](#feature-implementation)
6. [Code Structure](#code-structure)
7. [Data Model](#data-model)
8. [Responsive Design](#responsive-design)
9. [Development Guidelines](#development-guidelines)
10. [Next Steps & Roadmap](#next-steps--roadmap)

---

## Executive Summary

The **Trellis** is a frontend-only visualization tool designed to help development teams understand test coverage across three critical testing layers: Unit tests, API tests, and End-to-End (E2E) tests. The dashboard presents test data as an interconnected chain, emphasizing the relationship between different test layers and highlighting potential gaps or duplications.

The current implementation focuses on a **Feature Detail View** that displays comprehensive test coverage information for individual features (such as "Login"). The design uses a modern, iOS-inspired aesthetic with pill-shaped nodes connected by gradient lines, creating a visual metaphor of a continuous testing chain.

**Key Characteristics:**
- **Frontend-Only:** Pure React application with no backend dependencies (currently uses mocked data)
- **Responsive Design:** Adapts seamlessly from desktop (horizontal chain) to mobile (vertical stack)
- **Modern UI:** iOS-style glassmorphism effects, gradient connections, and smooth animations
- **Data-Driven:** Mocked test data structure ready for backend integration
- **Accessibility-First:** Built with shadcn/ui components and semantic HTML

---

## Product Vision & Goals

### Vision Statement

The Trellis aims to make test coverage transparent and actionable by visualizing the interconnected nature of testing layers. Instead of treating Unit, API, and E2E tests as separate concerns, the dashboard presents them as a unified chain, helping teams understand how different test layers complement each other and where gaps or overlaps exist.

### Primary Goals

**1. Transparency:** Provide clear visibility into test coverage across all three layers for each feature.

**2. Gap Identification:** Highlight missing test coverage and potential gaps in the testing strategy.

**3. Duplication Detection:** Identify redundant tests across layers and suggest optimizations.

**4. Team Alignment:** Create a shared understanding of testing strategy across development, QA, and product teams.

**5. Data-Driven Decisions:** Enable teams to make informed decisions about test investment and prioritization.

### Target Users

- **Development Teams:** Understand test coverage for features they own
- **QA Engineers:** Identify gaps and plan additional test coverage
- **Engineering Managers:** Monitor overall test health and team productivity
- **Product Managers:** Understand quality assurance status of features

---

## Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 19 | UI component library and state management |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework |
| **UI Components** | shadcn/ui | Pre-built, accessible component library |
| **Routing** | Wouter | Lightweight client-side routing |
| **Icons** | Lucide React | Modern icon library |
| **Build Tool** | Vite 7 | Fast development server and build tool |
| **Type Safety** | TypeScript 5.6 | Static type checking |
| **Animations** | Framer Motion | Smooth animations and transitions |
| **Forms** | React Hook Form | Efficient form state management |
| **Theming** | Next Themes | Light/dark theme support |

### Project Structure

```
trellis/
├── client/
│   ├── public/                 # Static assets
│   │   └── images/            # Image assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── Map.tsx
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx
│   │   ├── pages/
│   │   │   ├── FeatureDetail.tsx  # Main Feature Detail View
│   │   │   └── NotFound.tsx
│   │   ├── lib/               # Utility functions
│   │   ├── App.tsx            # Root component with routing
│   │   ├── main.tsx           # React entry point
│   │   ├── const.ts           # Application constants
│   │   └── index.css          # Global styles and design tokens
│   └── index.html             # HTML entry point
├── server/                    # Placeholder for backend (not used in static version)
├── shared/                    # Shared types and constants
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── tailwind.config.ts        # Tailwind CSS configuration
```

### Component Hierarchy

```
App
├── ErrorBoundary
│   └── ThemeProvider
│       └── TooltipProvider
│           ├── Toaster (Sonner notifications)
│           └── Router
│               └── Switch
│                   ├── Route "/" → FeatureDetail
│                   └── Route "*" → NotFound
```

---

## Design System

### Color Palette

The dashboard uses a carefully curated color palette that aligns with the Trellis brand while providing clear visual distinction between the three testing layers.

| Layer | Primary Color | Gradient Start | Gradient End | Purpose |
|-------|--------------|-----------------|--------------|---------|
| **Unit Tests** | Blue (#3B82F6) | #1E3A8A | #3B82F6 | Represents foundational, isolated testing |
| **API Tests** | Purple (#A78BFA) | #7C3AED | #A78BFA | Represents integration and contract testing |
| **E2E Tests** | Teal (#06B6D4) | #0891B2 | #06B6D4 | Represents end-to-end user flows |
| **Accent** | Green (#10B981) | - | - | Indicates "Controlled" status |
| **Warning** | Amber (#F59E0B) | - | - | Indicates potential duplications |
| **Error** | Red (#EF4444) | - | - | Indicates missing coverage |

### Typography System

The dashboard uses a clean, modern typography hierarchy that emphasizes readability and visual hierarchy.

| Element | Font | Size | Weight | Usage |
|---------|------|------|--------|-------|
| **Page Title** | System Sans | 32px | 700 (Bold) | Feature name (e.g., "Login") |
| **Section Title** | System Sans | 18px | 600 (Semibold) | Card headers (e.g., "AI Analysis") |
| **Body Text** | System Sans | 14px | 400 (Regular) | Descriptive text and test lists |
| **Small Text** | System Sans | 12px | 500 (Medium) | Labels and metadata |
| **Badge Text** | System Sans | 10px | 600 (Semibold) | Status indicators and counts |

### Visual Effects

**Glassmorphism:** The pill-shaped nodes use a frosted glass effect with semi-transparent backgrounds and backdrop blur, creating a premium, modern appearance.

**Gradient Connections:** A continuous gradient line (blue → purple → teal) connects the three nodes, visually representing the flow of testing from unit to API to E2E.

**Glow Effects:** When a feature has "Controlled" status, the connecting line glows with a subtle shadow effect, indicating active data flow.

**Hover States:** Nodes scale up slightly (105%) and increase their shadow intensity on hover, providing visual feedback for interactivity.

### Spacing & Layout

The design uses a consistent 8px spacing grid with Tailwind's spacing utilities. Key spacing values:

- **Gap between nodes:** 32px (desktop), 32px (mobile)
- **Padding inside nodes:** 8px
- **Card padding:** 24px (mobile), 48px (desktop)
- **Section spacing:** 32px

---

## Feature Implementation

### Feature Detail View

The **Feature Detail View** is the primary interface for exploring test coverage for a specific feature. It consists of four main sections:

#### 1. Header Section

The header displays the feature name, category, and overall status, along with a quick summary of test counts across all layers.

**Components:**
- Feature title with category badge (e.g., "Authentication")
- Status badge indicating overall control level ("Controlled", "Partial", "At Risk")
- Brief description of the feature
- Quick stats showing test counts for each layer and duplication count

**Data Structure:**
```typescript
interface FeatureHeader {
  name: string;              // e.g., "Login"
  category: string;          // e.g., "Authentication"
  status: "controlled" | "partial" | "at_risk";
  description: string;
  unitTestCount: number;
  apiTestCount: number;
  e2eTestCount: number;
  duplicationCount: number;
}
```

#### 2. Test Coverage Chain Visualization

The centerpiece of the Feature Detail View is the **Test Coverage Chain**, a visual representation of how testing layers connect.

**Design Elements:**

- **Three Pill-Shaped Nodes:** Each node represents a testing layer (Unit, API, E2E)
  - **Icon:** Distinctive icon for each layer (brackets for Unit, network for API, globe for E2E)
  - **Title:** Layer name ("Unit tests", "API tests", "E2E tests")
  - **Badge:** Test count in the bottom-right corner
  - **Gradient Background:** Layer-specific gradient from dark to light
  - **Gloss Effect:** Semi-transparent white gradient at the top for depth

- **Connecting Gradient Line:** A continuous line connecting all three nodes
  - **Color Gradient:** Blue → Purple → Teal
  - **Glow Effect:** Subtle shadow for visual emphasis
  - **Responsive:** Horizontal on desktop, vertical on mobile

- **Status Indicator:** Below the chain, a status bar showing overall control level

**Responsive Behavior:**

| Breakpoint | Layout | Node Width | Spacing | Connector |
|-----------|--------|-----------|---------|-----------|
| **Mobile** | Vertical Stack | 100% | 32px gap | Vertical gradient line |
| **Tablet** | Horizontal | ~32% | Tight | Horizontal gradient line |
| **Desktop** | Horizontal | ~32% | Balanced | Horizontal gradient line |

#### 3. Test Lists Panel (Right Sidebar)

The right sidebar displays detailed test information for each layer, organized in collapsible cards.

**Unit Tests Card:**
- Lists individual unit tests with checkmarks
- Shows test names describing what is being validated
- Example: "validates email format", "rejects empty password"

**API Tests Card:**
- Lists API endpoints and test scenarios
- Shows HTTP method (POST, GET, etc.) and endpoint path
- Includes test scenario description
- Example: "POST /auth/login - success"

**E2E Tests Card:**
- Lists user-facing test scenarios
- Describes complete user flows
- Example: "User can login with valid credentials and sees dashboard"

#### 4. AI Analysis Panel

The bottom panel provides AI-driven insights about test coverage.

**Sections:**

- **Potential Duplications:** Highlights tests that may be redundant across layers
  - Shows which layer has the duplication
  - Explains why it might be redundant
  - Suggests optimization

- **Missing Coverage:** Identifies gaps in test coverage
  - Lists scenarios not covered by any layer
  - Suggests which layer should cover it
  - Provides context for why it matters

**Action:** "Generate suggestions" button for future AI integration

---

## Code Structure

### Main Components

#### `App.tsx` - Root Component

The root component sets up the application structure with routing, theming, and global providers.

```typescript
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

**Key Responsibilities:**
- Error boundary for catching React errors
- Theme provider for light/dark mode support
- Tooltip provider for accessible tooltips
- Toast notifications via Sonner
- Client-side routing via Wouter

#### `FeatureDetail.tsx` - Feature Detail View

The main feature component that displays the test coverage chain and related information.

**Structure:**
```typescript
export default function FeatureDetail() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header Section */}
      {/* Test Coverage Chain */}
      {/* AI Analysis Panel */}
      {/* Test Lists Sidebar */}
    </div>
  );
}
```

**Key Sections:**
1. **Header:** Feature name, status, and quick stats
2. **Chain Visualization:** Three pill nodes with connecting gradient
3. **AI Analysis:** Duplications and gaps
4. **Test Lists:** Detailed test information by layer

#### `ThemeContext.tsx` - Theme Management

Provides theme switching capabilities and persists theme preference to localStorage.

```typescript
interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}
```

**Features:**
- Light/dark theme support
- Persistent theme preference
- Optional theme switching
- CSS class-based theme application

### Styling Approach

The project uses **Tailwind CSS 4** with custom design tokens defined in `index.css`.

#### Design Tokens

Custom CSS variables are defined in the `:root` selector:

```css
:root {
  /* Test Layer Colors */
  --color-unit-start: #1E3A8A;
  --color-unit-end: #3B82F6;
  --color-api-start: #7C3AED;
  --color-api-end: #A78BFA;
  --color-e2e-start: #0891B2;
  --color-e2e-end: #06B6D4;
  
  /* Semantic Colors */
  --background: #F8FAFC;
  --foreground: #0F172A;
  --card: #FFFFFF;
  --border: #E2E8F0;
  
  /* Spacing */
  --radius: 0.75rem;
}
```

#### Tailwind Configuration

The `tailwind.config.ts` extends Tailwind with custom theme values and enables advanced features like CSS variables and animations.

### Key CSS Classes & Patterns

**Pill Node Structure:**
```html
<div class="rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6]">
  <!-- Icon circle -->
  <div class="rounded-full bg-white/10"></div>
  <!-- Content -->
  <div class="flex-1 text-center">
    <h3>Unit tests</h3>
    <div class="bg-white/20 rounded-full">7 tests</div>
  </div>
</div>
```

**Gradient Connection Line:**
```html
<!-- Desktop (Horizontal) -->
<div class="absolute top-1/2 left-12 right-12 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"></div>

<!-- Mobile (Vertical) -->
<div class="absolute left-1/2 top-12 bottom-12 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-cyan-500"></div>
```

**Responsive Utilities:**
- `md:` prefix for medium screens and up
- `lg:` prefix for large screens and up
- `hidden md:block` for desktop-only elements
- `md:hidden` for mobile-only elements

---

## Data Model

### Feature Data Structure

The dashboard works with a mocked data structure that represents a feature and its test coverage.

```typescript
interface TestLayer {
  name: "unit" | "api" | "e2e";
  count: number;
  tests: Test[];
  status: "covered" | "partial" | "uncovered";
}

interface Test {
  id: string;
  name: string;
  description?: string;
  status: "pass" | "fail" | "pending";
  lastRun?: Date;
}

interface Feature {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "controlled" | "partial" | "at_risk";
  layers: {
    unit: TestLayer;
    api: TestLayer;
    e2e: TestLayer;
  };
  duplications: Duplication[];
  gaps: Gap[];
}

interface Duplication {
  id: string;
  layers: string[];
  description: string;
  severity: "low" | "medium" | "high";
}

interface Gap {
  id: string;
  description: string;
  suggestedLayer: "unit" | "api" | "e2e";
  priority: "low" | "medium" | "high";
}
```

### Mocked Data Example

The current implementation uses hardcoded mocked data for the "Login" feature:

**Unit Tests (7):**
- validates email format
- rejects empty password
- trims whitespace in username
- hashes password before sending
- handles network timeout
- clears error on input
- disables button while loading

**API Tests (4):**
- POST /auth/login - success
- POST /auth/login - wrong_password
- POST /auth/login - non_existing_user
- POST /auth/login - empty_credentials

**E2E Tests (2):**
- User can login with valid credentials and sees dashboard
- User sees error message when submitting empty password

**Duplications (1):**
- E2E: "empty password shows error" duplicates Unit and API validation

**Gaps (2):**
- No Unit test for locked user state
- No API test for rate limiting on /auth/login

---

## Responsive Design

### Breakpoints

The dashboard uses Tailwind's standard breakpoints with custom adaptations:

| Breakpoint | Screen Width | Layout | Primary Changes |
|-----------|-------------|--------|-----------------|
| **Mobile** | < 768px | Vertical Stack | Single column, vertical chain, full-width cards |
| **Tablet** | 768px - 1024px | Horizontal (Tight) | Two-column grid, horizontal chain, reduced padding |
| **Desktop** | > 1024px | Horizontal (Balanced) | Three-column grid, horizontal chain, full padding |

### Mobile Adaptations

**Test Coverage Chain:**
- Nodes stack vertically with 32px gap
- Connecting line changes from horizontal to vertical
- Nodes scale down to fit mobile screen width
- Icon size reduces from 80px to 56px

**Layout:**
- Single column layout
- Cards expand to full width
- Padding reduces from 48px to 16px
- Test lists appear below the chain

### Tablet Adaptations

**Test Coverage Chain:**
- Nodes remain horizontal but with tighter spacing
- Connecting line remains horizontal
- Nodes maintain 24px height
- Icon size remains at 64px

**Layout:**
- Two-column layout (chain + test lists side-by-side)
- Cards maintain reasonable width
- Padding adjusts to 24px

### Desktop Adaptations

**Test Coverage Chain:**
- Nodes display horizontally with balanced spacing
- Connecting line spans full width
- Nodes maintain 96px height
- Icon size at 80px

**Layout:**
- Three-column grid (chain spans 2 columns, test lists in 1 column)
- Maximum width constraint (1280px)
- Full padding (48px)

---

## Development Guidelines

### Code Style & Conventions

**TypeScript:**
- Use strict mode (`"strict": true` in tsconfig.json)
- Define interfaces for all data structures
- Use union types for status values instead of strings
- Avoid `any` type; use `unknown` and type narrowing instead

**React:**
- Use functional components with hooks
- Keep components focused and single-responsibility
- Extract reusable logic into custom hooks
- Use React.memo for performance-critical components
- Avoid inline function definitions in JSX

**Tailwind CSS:**
- Use utility classes instead of custom CSS
- Leverage design tokens from `index.css`
- Use responsive prefixes (`md:`, `lg:`) for breakpoint-specific styles
- Group related utilities for readability
- Use `@apply` directive sparingly

**File Organization:**
- Components in `/components` directory
- Pages in `/pages` directory
- Utilities in `/lib` directory
- Contexts in `/contexts` directory
- Keep related files together

### Component Development Checklist

When adding new components, follow this checklist:

- [ ] Create component file in appropriate directory
- [ ] Define TypeScript interfaces for props
- [ ] Use shadcn/ui components where applicable
- [ ] Add proper accessibility attributes (aria-*, role, etc.)
- [ ] Implement responsive design with Tailwind breakpoints
- [ ] Add error handling and loading states
- [ ] Test component in different screen sizes
- [ ] Document component usage with JSDoc comments
- [ ] Ensure component follows design system guidelines

### Performance Optimization

**Best Practices:**
- Use React.memo for components that receive stable props
- Implement useMemo for expensive computations
- Use useCallback for event handlers passed to child components
- Lazy load components with React.lazy and Suspense
- Minimize re-renders by proper state management
- Use Tailwind's purge feature to remove unused CSS

### Testing Strategy

While the current implementation is frontend-only, the following testing strategy is recommended:

**Unit Tests:** Test individual components and utility functions
- Component rendering with different props
- User interactions (clicks, input changes)
- Conditional rendering based on state

**Integration Tests:** Test component interactions
- Feature Detail View with different data states
- Theme switching functionality
- Responsive layout changes

**E2E Tests:** Test complete user flows
- Navigate to feature detail view
- Interact with test coverage chain
- Verify data display accuracy

---

## Next Steps & Roadmap

### Phase 1: Interactivity (Immediate)

**1.1 Node Interaction**
- Implement click handlers on nodes to highlight corresponding tests
- Add hover effects to show related information
- Implement smooth scroll to test lists when node is clicked

**1.2 Test List Filtering**
- Add filter buttons to show/hide tests by status
- Implement search functionality for tests
- Add expand/collapse functionality for test lists

**1.3 Animations**
- Add pulsation effect to connecting line
- Implement smooth transitions when data changes
- Add entrance animations for nodes

### Phase 2: Dashboard Overview (Short-term)

**2.1 Feature List View**
- Create overview page listing all features
- Display feature cards with quick stats
- Implement filtering and sorting

**2.2 Navigation**
- Add breadcrumb navigation
- Implement back button from feature detail
- Add feature search and quick navigation

**2.3 Dashboard Layout**
- Create persistent sidebar with navigation
- Add header with branding and user menu
- Implement responsive sidebar collapse

### Phase 3: Backend Integration (Medium-term)

**3.1 API Integration**
- Replace mocked data with real API calls
- Implement data fetching with error handling
- Add loading states and skeleton screens

**3.2 Real-Time Updates**
- Implement WebSocket connection for live updates
- Add notification system for test results
- Implement auto-refresh functionality

**3.3 Authentication**
- Integrate OAuth login flow
- Implement user sessions
- Add role-based access control

### Phase 4: Advanced Features (Long-term)

**4.1 AI-Powered Insights**
- Implement "Generate suggestions" functionality
- Add trend analysis for test coverage over time
- Implement anomaly detection for test failures

**4.2 CI/CD Integration**
- Connect to GitHub Actions, GitLab CI, or Jenkins
- Display real test results from CI pipelines
- Implement test result history and trends

**4.3 Team Collaboration**
- Add comments and notes on features
- Implement team notifications
- Add activity feed for test changes

**4.4 Dark Theme**
- Implement comprehensive dark theme
- Optimize colors for dark backgrounds
- Add theme preference persistence

### Phase 5: Analytics & Reporting (Future)

**5.1 Analytics Dashboard**
- Track test coverage trends over time
- Analyze test execution times
- Generate coverage reports

**5.2 Export Functionality**
- Export feature details as PDF
- Generate team reports
- Create coverage metrics dashboards

---

## Deployment & Hosting

### Current Setup

The project is deployed on **Manus** hosting with the following configuration:

- **Dev Server:** Vite development server running on port 3000
- **Build Command:** `pnpm build`
- **Start Command:** `pnpm start` (for production)
- **Environment:** Node.js with Express server (placeholder)

### Deployment Steps

1. **Build the project:**
   ```bash
   pnpm build
   ```

2. **Run production server:**
   ```bash
   pnpm start
   ```

3. **Access the application:**
   - Development: `http://localhost:3000`
   - Production: Manus-provided domain

### Environment Variables

The following environment variables are automatically injected:

- `VITE_APP_ID`: Application identifier
- `VITE_APP_TITLE`: Application title
- `VITE_APP_LOGO`: Application logo URL
- `VITE_ANALYTICS_ENDPOINT`: Analytics endpoint
- `VITE_ANALYTICS_WEBSITE_ID`: Analytics website ID
- `VITE_OAUTH_PORTAL_URL`: OAuth portal URL
- `VITE_FRONTEND_FORGE_API_URL`: Frontend API URL
- `VITE_FRONTEND_FORGE_API_KEY`: Frontend API key

---

## Troubleshooting & Known Issues

### Known Issues

**1. Browser Extension Conflicts**
- Some browser extensions may cause "origins don't match" errors
- This is external to the application and can be ignored
- Workaround: Disable extensions or use incognito mode

**2. Theme Persistence**
- Theme preference is not persisted by default (switchable = false)
- To enable persistence, set `switchable={true}` in ThemeProvider

### Common Development Issues

**Issue: Styles not applying**
- Solution: Ensure Tailwind CSS build process is running
- Check that class names are correctly spelled
- Verify design tokens are defined in `index.css`

**Issue: Components not rendering**
- Solution: Check browser console for React errors
- Verify component imports are correct
- Ensure component is exported as default

**Issue: Responsive layout breaking**
- Solution: Test with actual device or browser DevTools
- Verify Tailwind breakpoint prefixes are correct
- Check that responsive utilities are applied correctly

---

## Contributing Guidelines

### Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd trellis
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start development server:**
   ```bash
   pnpm dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Follow code style guidelines
   - Test in different screen sizes
   - Update documentation if needed

3. **Format code:**
   ```bash
   pnpm format
   ```

4. **Check types:**
   ```bash
   pnpm check
   ```

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push origin feature/your-feature-name
   ```

---

## Contact & Support

For questions or issues related to this project, please contact the development team or refer to the project repository for additional resources.

**Project Repository:** Manus Project ID: `DFsK99uyktkFspy7uPqSLN`  
**Live Preview:** https://3000-iooxjdgmi7422gyepyzoy-6c0173ea.us2.manus.computer

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Maintained By:** Manus AI
