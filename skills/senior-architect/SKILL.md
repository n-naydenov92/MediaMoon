---
name: senior-architect
description: Comprehensive software architecture skill for designing scalable, maintainable systems using ReactJS, NextJS, NodeJS, Express, React Native, Swift, Kotlin, Flutter, Postgres, GraphQL, Go, Python. Includes architecture diagram generation, system design patterns, tech stack decision frameworks, and dependency analysis. Use when designing system architecture, making technical decisions, creating architecture diagrams, evaluating trade-offs, or defining integration patterns.
---

## Required Context

When making **implementation recommendations** (component structure, patterns, code decisions):
- Read `ai-skills/skills/milestone-core/SKILL.md`
- Read `ai-skills/skills/react-best-practices/SKILL.md`
- Read `ai-skills/skills/clean-code/SKILL.md`

When doing **analysis only** (diagrams, dependency maps, trade-off evaluation): skip the above.

---

# Senior Architect

## Core Capabilities

### 1. Architecture Diagram Generator

**Usage:** Traverse the codebase, identify components and their relationships, then generate an ASCII or Mermaid diagram showing modules, data flows, and integration boundaries.

**Generates:**
- Component relationship diagrams
- Data flow diagrams
- Module Federation host/remote maps
- API boundary diagrams

### 2. Project Architect

**Usage:** Read project structure and source files, analyze architecture patterns, then provide concrete recommendations with trade-off analysis.

**Analyzes:**
- Separation of concerns
- Coupling and cohesion
- Scalability bottlenecks
- SOLID principle violations
- Micro-frontend integration points

### 3. Dependency Analyzer

**Usage:** Scan imports across the codebase to map dependencies, detect circular references, identify heavy dependencies, and report integration patterns.

**Reports:**
- Circular dependency chains
- Unused dependencies in package.json
- Bundle impact of each dependency
- Upgrade risk assessment

## Architecture Principles

### SOLID
| Principle | Rule |
|-----------|------|
| **S** - Single Responsibility | One reason to change per module |
| **O** - Open/Closed | Open for extension, closed for modification |
| **L** - Liskov Substitution | Subtypes must be substitutable |
| **I** - Interface Segregation | No client should depend on unused methods |
| **D** - Dependency Inversion | Depend on abstractions, not concretions |

### Micro-Frontend Patterns (Module Federation)
- **Host** owns routing and shell layout
- **Remotes** own their domain — never share internal state directly
- Cross-MFE communication via typed events (`@milestone/fe-typed-events`)
- Shared dependencies declared in webpack `shared` config — avoid version conflicts
- Each MFE must be independently deployable and testable in standalone mode

### Cross-MFE Data Flow
- MFEs never share store directly
- Data between MFEs only via `@milestone/fe-typed-events` or URL params
- Host can pass initial config as props at mount time
- Pattern: `Host → (typed event) → Remote → (typed event) → Host`

### Security Boundaries
- Each MFE validates its own permissions — never relies on the host to enforce them
- Sensitive data is never passed as URL params between MFEs
- API calls only from the owning MFE — never proxy through another MFE

### Versioning & Breaking Changes Strategy
- Shared deps in webpack `shared` config → patch/minor are safe
- Breaking change in a shared dep → bump major, coordinate all MFEs
- Use feature flags for gradual rollout of breaking changes

### Architecture Decision Records (ADR)
When making significant architectural decisions, document:
1. **Context** — what is the situation?
2. **Decision** — what was chosen?
3. **Consequences** — what are the trade-offs?

## Tech Stack (This Project)

**Frontend:** React 19, TypeScript, Webpack 5 Module Federation
**UI:** MUI v7, @milestone/milestone-theme, @milestone/design-tokens
**Communication:** @milestone/cross-mfe-communication, @milestone/fe-typed-events
**i18n:** i18next, react-i18next
**Backend:** Node.js, Express, TypeScript
**DevOps:** Docker, GitHub Actions

## Common Commands

```bash
# Client
cd client && npm start                # standalone dev
cd client && npm run start:federation # federation dev
cd client && npm run build            # production build
cd client && npm run type-check       # TypeScript check
cd client && npm test                 # run tests

# Server
cd server && npm run dev              # development
cd server && npm run build            # compile TypeScript
cd server && npm start                # production

# Docker
cd server && npm run docker-build
cd server && npm run docker-run
```
