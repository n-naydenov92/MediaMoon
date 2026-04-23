---
name: react-best-practices
description: Practical React + TypeScript patterns based on "React Design Patterns and Best Practices" (Bertoli), "Fluent React" (Kumar, 2024), and React 19 docs. Use when writing or reviewing any React component.
allowed-tools: Read, Write, Edit
version: 3.0
priority: CRITICAL
---

# React Best Practices — Patterns & TypeScript

> Based on "React Design Patterns and Best Practices" (Bertoli), "Fluent React" (Kumar, 2024), and React 19 docs.

**If you need code examples for any principle below, read `ai-skills/skills/react-best-practices/examples.md`.**

---

## Core Principles

| Principle | Rule |
|-----------|------|
| **Composition** | Small composable pieces over large configurable ones |
| **Colocation** | State lives as close to where it's used as possible |
| **Predictability** | Same props → same output. No hidden side effects. |
| **Explicit** | No magic state, no implicit dependencies |
| **Measure first** | Profile before optimizing |

---

## Ch.1 — How React Renders

### Reconciliation Rules

- React reuses a component instance if it's in the **same position** with the **same type**
- Different type at the same position = full unmount + remount (local state, focus, animations reset)
- **Never define components inside other components** — new function reference each render → remount every time
- React 18+ batches all state updates including `setTimeout`, `Promise.then`, and native events — multiple `setState` calls = one re-render

### Key as Reset Mechanism

`key` is not just for lists — it forces a full remount when changed:

```tsx
// Resets all local state when recordId changes — no useEffect needed
<RecordForm key={recordId} recordId={recordId} />
```

Use when navigating between records to reset form state automatically.

---

## Ch.2 — Component Design

### Single Responsibility

A component is too large when you can extract a section with a meaningful name. Split into:
- Data hooks (`useRulesFetch`, `useRuleSearch`)
- Presentation components (`RuleRow`, `RuleStats`)
- Container that composes them

### Controlled vs Uncontrolled

Default to **controlled** components (React owns the value via `useState`). Use uncontrolled only for file inputs or one-off read-on-submit forms.

### Component Internal Order

Always write components in this order:

1. Context reads (`useAuthContext`, `useThemeContext`)
2. State and refs (`useState`, `useRef`)
3. Derived values / memos (`useMemo`, computed variables)
4. Handlers (`handleSubmit`, `handleChange`)
5. Effects (`useEffect` — always last before return)
6. Return JSX

### Composition Over Configuration

Prefer composable slot-based APIs over prop-explosion configuration. Caller assembles structure; component stays extensible without API changes.

---

## Ch.3 — Composition Patterns

### Compound Components

Share implicit state between related components without prop drilling. Parent manages state via Context; sub-components consume it. Caller controls structure. Always create a `useXxxContext()` guard hook.

### HOC — When and When Not

- **Use HOC** for non-hook cross-cutting concerns (auth guard, analytics, feature flags)
- **Use custom hook** for UI logic (loading state, data fetching)
- **Always set `displayName`** on HOCs: `Component.displayName = \`withX(${WrappedComponent.name})\``

---

## Ch.4 — Hooks

### Rules of Hooks

- Only call hooks at the top level — never inside conditions, loops, or nested functions
- If you need a hook per list item, extract a component per item

### useRef — Two Uses

1. **DOM access**: `useRef<HTMLInputElement>(null)` — typed to the element
2. **Mutable value without re-render**: store previous values, timer IDs, etc.

Never use `useState` for values that must not trigger re-renders (e.g. previous value tracking).

### Stale Closure

Closures in effects capture the value at creation time. Solutions:
- Use **functional updates** (`setCount(c => c + 1)`) when you don't need to read current value
- Use **`useRef`** to read the latest value without re-running the effect

### Dependency Array Rules

- All reactive values used inside an effect must be in the deps array
- Never put objects or arrays directly in deps — they create new references every render → infinite loop
- Destructure to primitives, or use `useMemo` to stabilize the reference

### Custom Hook Extraction

Extract when:
- Multiple `useState`/`useEffect` pairs belong together
- The same logic appears in 2+ components

Return a discriminated union state (`{ status: 'loading' | 'success' | 'error' }`) instead of multiple booleans.

---

## Ch.5 — State Design

### Where to Put State

| State type | Where |
|-----------|-------|
| UI state for one component (open/closed, input) | `useState` in that component |
| Shared between 2–3 siblings | Lift to nearest common ancestor |
| Shared within a feature subtree | Context + `useReducer` |
| Cross-feature / app-wide | Root Context or dedicated store |

**Colocate aggressively** — state lifted too high causes unnecessary re-renders across the tree.

### Discriminated Union State — No Boolean Flags

Replace `isLoading + isError + isSuccess` booleans with a discriminated union:

```ts
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }
```

Impossible states become unrepresentable at the type level.

### Derive, Don't Sync

Never sync derived state via `useEffect` — it creates two sources of truth and causes double renders. Compute inline or with `useMemo`.

### useReducer for State Machines

Use `useReducer` when state transitions are interdependent or must be constrained (multi-step forms, complex UI state machines). Transitions become explicit and enforced.

---

## Ch.6 — Effects

`useEffect` synchronizes React with an **external system** (DOM, network, subscription, timer). It is NOT a lifecycle method.

### What NOT to Put in Effects

- **Derived state** → compute inline
- **Event responses** → call directly in the handler
- **Fetch on mount** → use a custom hook

### Always Return Cleanup

Every effect that starts a subscription, timer, or fetch must return a cleanup function. Use `AbortController` for fetch.

### One Effect, One Purpose

Split effects by concern — each can have independent deps and cleanup.

---

## Ch.7 — Performance

**Profile first, optimize second.** Most performance issues come from wrong component structure, not missing memoization.

### memo

Use `memo` only when:
- The component renders an expensive tree or large list
- The parent re-renders frequently for unrelated reasons

Don't use on trivial components — comparison cost exceeds render cost.

### useMemo

Use when:
- Computation is genuinely expensive (filter + sort + map on large arrays)
- Stabilizing object/array identity for Context value or memo'd children

Don't use for simple string concatenation or arithmetic.

### useCallback

Use when:
- The function is a dependency of `useEffect`
- The function is passed as a prop to a `memo`'d child

Don't use otherwise — it's pure overhead.

### Inline Objects and Functions Break Memo

Objects and functions created inline in JSX get new references every render, making `memo` on the child useless. Define objects at module level (`as const`) and wrap functions with `useCallback`.

---

## Ch.8 — Suspense & Error Boundaries

- Wrap async components in `<Suspense fallback={<Skeleton />}>`
- Nest Suspense boundaries for granular loading UI
- Always wrap Suspense with `<ErrorBoundary>` — use `react-error-boundary`
- Use `lazy()` for heavy components to code-split

### `use()` Hook — React 19

`use()` reads a Promise or Context inside render. Unlike hooks, it can be called inside conditionals.

**⚠️ CRITICAL:** The Promise passed to `use()` must be a **stable reference** — created outside the component or cached. A Promise created inside the component body creates a new Promise on every render → infinite suspend loop.

```tsx
const rulesPromise = fetchRules()  // module-level — stable
const RulesTable = () => {
  const rules = use(rulesPromise)  // suspends until resolved
  ...
}
```

---

## Ch.9 — React 19 Actions

### useActionState

Replaces the manual `isLoading + error + onSubmit` pattern for form mutations. Returns `[state, action, isPending]`. The action function receives `(prevState, formData)`.

### useOptimistic

Apply an optimistic update immediately, then reconcile with the server response. React automatically reverts the optimistic state if the server call fails.

### ref as Prop (React 19)

`forwardRef` is no longer needed. Pass `ref` as a regular prop:

```tsx
const Input = ({ label, ref, ...props }: InputProps & { ref?: React.Ref<HTMLInputElement> }) => (
  <label>{label}<input ref={ref} {...props} /></label>
)
```

---

## Ch.10 — Props & TypeScript

### Always Define a Named Interface

Always define `interface XxxProps` — not inline types. Named interfaces give better TypeScript error messages and are reusable.

### Event Handler Types

| Event | Type |
|-------|------|
| Input change | `React.ChangeEvent<HTMLInputElement>` |
| Textarea change | `React.ChangeEvent<HTMLTextAreaElement>` |
| Form submit | `React.FormEvent<HTMLFormElement>` |
| Key down | `React.KeyboardEvent<HTMLInputElement>` |
| Button click | `React.MouseEvent<HTMLButtonElement>` |

Never use `any` for event types.

### Discriminated Union Props

When props only make sense in certain combinations, use a discriminated union type. Impossible prop combinations become type errors.

### Generics for Reusable Components

Use generics (`<T,>`) for table, list, select, and other data-driven components so they work with any entity type without duplication.

---

## Ch.11 — JSX & Lists

### Conditionals

- `{count && <X />}` renders `"0"` when count is 0 — use `{count > 0 && <X />}`
- Avoid nested ternaries for 3+ branches — extract a `renderContent()` function instead

### Keys

- Always use stable unique IDs from the data — never array index, never `Math.random()`
- Use composite keys (`${group.id}-${rule.id}`) when items from multiple groups share IDs
- `key` goes on the outermost element returned from `.map()`

---

## Ch.12 — Context

### Context Triad Pattern

Every feature-level context uses three files:

1. **`xxxCtx.ts`** — `createContext` only, exports the context and its value interface
2. **`XxxProvider.tsx`** — all logic in a custom hook, Provider is thin; wrap in `memo`
3. **`useXxxContext.ts`** — always includes a null guard that throws with a clear message

### Split Context by Update Frequency

Never put fast-changing and slow-changing values in the same context. Split into separate contexts — components subscribe only to what they need.

### When NOT to Use Context

Don't use Context for state used only within a single component subtree. Colocate state or use composition instead.

---

## Ch.13 — Anti-Patterns

- **Prop drilling**: if a prop passes through 2+ components that don't use it, move to Context
- **Mutating state directly**: always create new references (`[...arr]`, `{ ...obj, field: value }`)
- **Inline objects/functions in JSX**: define outside render or use `useMemo`/`useCallback`

---

## Ch.14 — TypeScript

### interface vs type

- `interface` for object shapes — better error messages, supports declaration merging
- `type` for unions, intersections, computed types

### Never Use `any`

Use `unknown` and narrow with type guards. `any` disables the type checker entirely.

### `as const` for Literal Types

```ts
const STATUS_OPTIONS = ['active', 'inactive', 'draft'] as const
type Status = typeof STATUS_OPTIONS[number]
```

### Exhaustive Switch

Use the `never` trick in the `default` branch — TypeScript errors if a new variant is added without updating the switch.

### Data Structures

| Structure | Use when |
|-----------|---------|
| `{}` Object | Known keys, JSON serializable |
| `[]` Array | Ordered, indexed access |
| `Map<K,V>` | Dynamic keys, need `.size` |
| `Set<T>` | Unique values, O(1) `.has()` |
| `Record<K,V>` | Typed object with known string keys |
| `[A, B]` Tuple | Fixed-size mixed types (max 3 elements) |

### Pure Functions

Prefer pure functions for business logic — no side effects, same input → same output, trivially testable.

### `map`/`filter`/`reduce` Over `for` Loops

Declarative transforms communicate intent directly. Use `reduce` for aggregation.

---

## Ch.15 — Component Checklist

Before completing any component, verify:

| Check | Question |
|-------|----------|
| **SRP** | Does this component do exactly one thing? |
| **Props typed** | Is there an explicit named `interface Props`? |
| **No `any`** | Is the file free of `any` types? |
| **State shape** | Is state a discriminated union instead of boolean flags? |
| **Derive, don't sync** | Is derived state computed inline, not synced via `useEffect`? |
| **Deps correct** | Are all `useEffect`/`useCallback`/`useMemo` deps declared? |
| **Effects clean** | Does every effect with a subscription/timer/fetch return cleanup? |
| **Keys stable** | Are list keys from data IDs, not indices? |
| **Handlers named** | Do event handlers start with `handle`? (`handleChange`, `handleSubmit`) |
| **No inline objects** | Are objects/arrays passed as props defined outside render or via `useMemo`? |
| **All async states** | Does every async operation render loading, error, and empty states? |
| **React 19 opportunity** | Could `useActionState` or `useOptimistic` simplify this form/mutation? |
| **HOC displayName** | If you wrote an HOC, did you set `Component.displayName`? |

> 🔴 **Rule:** If ANY check fails — fix it before the task is complete.
