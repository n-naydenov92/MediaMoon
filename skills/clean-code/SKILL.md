---
name: clean-code
description: Pragmatic coding standards based on "Clean Code" by Robert C. Martin — concise, direct, no over-engineering, no unnecessary comments. Language-agnostic principles (naming, functions, errors, tests, classes, systems).
allowed-tools: Read, Write, Edit
version: 4.0
priority: CRITICAL
---

# Clean Code — Pragmatic Coding Standards

> Based on "Clean Code" by Robert C. Martin.

**If you need code examples for any principle below, read `ai-skills/skills/clean-code/examples.md`.**

---

## Core Principles

| Principle | Rule |
|-----------|------|
| **SRP** | Single Responsibility — each function/class does ONE thing |
| **DRY** | Don't Repeat Yourself — extract duplicates, reuse |
| **KISS** | Keep It Simple — simplest solution that works |
| **YAGNI** | You Aren't Gonna Need It — don't build unused features |
| **Boy Scout** | Leave code cleaner than you found it |

---

## Ch.1 — Philosophy

- **Broken windows:** one bad file in the codebase invites more bad code. Don't leave it.
- **Boy Scout Rule:** leave the code cleaner than you found it — even if it's just renaming a variable.
- **Attitude:** YOU are responsible for code quality — not deadlines, not managers.

---

## Ch.2 — Meaningful Names

Names are the most important form of documentation. If you need a comment to explain a name — rename it.

**Rules:**
- Class names: nouns (`Rule`, `Gateway`, `Validator`)
- Method names: verbs (`fetchRules`, `deleteGroup`, `validateForm`)
- Booleans: `is/has/can` prefix (`isLoading`, `hasError`, `canSubmit`)
- Constants: SCREAMING_SNAKE (`MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE`)
- Avoid meaningless words: `data`, `info`, `manager`, `processor`, `handler`
- One word per concept — pick `fetch` or `get` or `retrieve`, never mix them
- Names must be pronounceable and searchable

### Magic Numbers

Every literal number or string with implicit meaning must have a named constant. No exceptions.

---

## Ch.3 — Functions

**Rules:**
- Max 20 lines, ideally 5–10
- One level of abstraction per function — don't mix high-level and detail
- Max 3 arguments, prefer 0–2
- No side effects — don't mutate inputs unexpectedly
- Command/Query separation: a function either does something OR returns something, not both
- **Always use braces for if statements** — even single-line: `if (x) { return }` not `if (x) return`
- **No nested ternaries** — use if/else or early returns instead
- Use guard clauses to reduce nesting — fail fast at the top

---

## Ch.4 — Comments

A comment is a failure — it means the code isn't clear enough on its own. Try renaming or refactoring first.

**Never write:**
- Redundant comments (the code already says this)
- Misleading comments (the comment lies)
- Changelogs in code (that's what git is for)
- Commented-out code (delete it, git preserves it)

**Only write:**
- Intent — explains WHY, not HOW
- Warning of consequence
- TODO — for known tech debt

**Rule:** Before writing a comment — try to rename or refactor. If you can't — then comment.

---

## Ch.5 — Formatting

- **Newspaper metaphor:** high-level logic at top, implementation details at bottom
- **Caller above callee:** the function that calls `processRule` is above `processRule`
- **Vertical openness:** blank line between concepts
- **Vertical density:** related code is compact — no unnecessary blank lines inside a block
- **Horizontal:** max ~120 characters per line

---

## Ch.6 — Objects & Data Structures

Objects hide data and expose behavior. Data structures expose data and have no meaningful behavior. Don't mix them.

**Law of Demeter — "Don't talk to strangers":**
Only call methods on your own object, objects you created, objects passed to you, your direct fields. Not on "friends of friends" (`a.getB().getC().doX()` → bad).

---

## Ch.7 — Error Handling

- Use exceptions, not error codes — errors cannot be silently ignored
- Return empty collections instead of `null` for lists
- Throw if you expect to always find the record (`getRuleOrThrow`)
- Catch only what you can handle meaningfully — rethrow the rest
- **Null Object Pattern:** when "not found" has a sensible default, return a safe default object instead of null

---

## Ch.8 — Boundaries

Don't let third-party APIs leak throughout your code. Wrap them once in a Gateway. If you swap the underlying library — only the Gateway changes.

---

## Ch.9 — Unit Tests

**FIRST Principles:**

| Letter | Principle | Violation |
|--------|-----------|-----------|
| **F**ast | Tests run in seconds | Test that calls a real API |
| **I**ndependent | Tests don't depend on each other | Test relying on execution order |
| **R**epeatable | Same result everywhere | Test depending on system clock |
| **S**elf-Validating | Boolean pass/fail | Test requiring manual inspection |
| **T**imely | Written with the code | Tests written "after the feature" |

**Rules:**
- One concept per test — if it fails, you know exactly what broke
- Tests are documentation: a new developer should understand the system by reading tests

---

## Ch.10 — Classes

- Small — measured in responsibilities, not lines
- High cohesion — all methods use the class fields
- **OCP:** open for extension, closed for modification — add new types by adding new classes, not modifying existing ones
- **DIP:** depend on interfaces, not concrete implementations — makes classes testable

---

## Ch.11 — Systems

Separate construction from use. "Main" (entry point, DI container, Provider) handles construction. The system handles behavior. Inject dependencies — don't instantiate them inside classes.

---

## Ch.12 — Emergence — Kent Beck's 4 Rules of Simple Design

In priority order:

1. **Passes all tests** — works correctly
2. **Reveals intention** — names say what things do
3. **No duplication** — DRY
4. **Fewest elements** — no speculative abstractions

---

## Ch.13 — Concurrency

- Isolate IO from business logic — pure functions only do logic, async functions only do IO
- Don't share mutable state between async operations without synchronization
- Prefer `Promise.all()` for parallel independent operations
- One `useEffect` does one thing — don't mix fetch, transform, and subscribe

---

## Code Smells

| Smell | Description | Fix |
|-------|-------------|-----|
| **Feature Envy** | A function more interested in another class's data than its own | Move it to the class it envies |
| **Data Clumps** | Same 3–4 params always appear together | Extract into an object/interface |
| **Primitive Obsession** | Using `string` for email/id/status | Create a type or small class |
| **Middle Man** | A class that only delegates | Remove it, call directly |
| **Speculative Generality** | Code for hypothetical future requirements | Delete it (YAGNI) |
| **Temporary Field** | A field that's only set sometimes | SRP violation — extract to own class |
| **Message Chains** | `a.getB().getC().doX()` | Law of Demeter — add a method to `a` |
| **Switch Statements** | Long switch on type | OCP — use polymorphism/map |

### Rule of Three

- **Once:** write it inline
- **Twice:** duplicate — that's OK, resist premature abstraction
- **Third time:** now extract — the pattern is real

---

## 🔴 Before Editing ANY File (THINK FIRST!)

| Question | Why |
|----------|-----|
| **What imports this file?** | They might break |
| **What does this file import?** | Interface changes cascade |
| **What tests cover this?** | Tests might fail |
| **Is this a shared component?** | Multiple places affected |

> 🔴 **Rule:** Edit the file + all dependent files in the SAME task. Never leave broken imports or missing updates.

---

## 🔴 Self-Check Before Completing (MANDATORY)

| Check | Question |
|-------|----------|
| ✅ **Goal met?** | Did I do exactly what was asked? |
| ✅ **Files edited?** | Did I modify all necessary files? |
| ✅ **Code works?** | Did I verify the change? |
| ✅ **No errors?** | Lint and TypeScript pass? |
| ✅ **Nothing forgotten?** | Any edge cases missed? |

> 🔴 **Rule:** If ANY check fails, fix it before completing.
