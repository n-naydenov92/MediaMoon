# React Best Practices — Code Examples

> Reference file. Read this when you need to see a concrete code pattern for any principle in SKILL.md.

---

## Ch.1 — How React Renders

### Reconciliation

```tsx
// ❌ Conditional type at same position — unmounts every time isAdmin changes
const Dashboard = ({ isAdmin }: Props) => (
  <div>
    {isAdmin ? <AdminProfile /> : <UserProfile />}
  </div>
)

// ✅ Single component, different props — same instance, no remount
const Dashboard = ({ isAdmin }: Props) => (
  <div>
    <Profile variant={isAdmin ? 'admin' : 'user'} />
  </div>
)
```

```tsx
// ❌ Component defined inside another — new type on every render → remount every time
const Parent = () => {
  const Child = () => <div>Hello</div>
  return <Child />
}

// ✅ Define at module level — stable type reference
const Child = () => <div>Hello</div>
const Parent = () => <Child />
```

### Batching

```tsx
// ✅ React 18+ — both updates batched into one render
const handleClick = () => {
  setCount(c => c + 1)
  setFlag(f => !f)
}

// ✅ Also batched in async code
const handleAsync = async () => {
  const data = await fetch('/api/data').then(r => r.json())
  setData(data)      // batched
  setLoading(false)  // batched — one render
}
```

---

## Ch.2 — Component Design

### Single Responsibility

```tsx
// ❌ One component: fetches, transforms, filters, renders, handles events
export const RulesDashboard = () => {
  const [rules, setRules] = useState<Rule[]>([])
  const [search, setSearch] = useState('')
  useEffect(() => { fetch('/api/rules').then(r => r.json()).then(setRules) }, [])
  const filtered = rules.filter(r => r.name.includes(search))
  const activeCount = rules.filter(r => r.isActive).length
  return (
    <div>
      <div>Active: {activeCount} / {rules.length}</div>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      {filtered.map(rule => <div key={rule.id}>{rule.name}</div>)}
    </div>
  )
}

// ✅ Each piece has one job
const useRulesFetch = () => { /* fetch logic */ }
const useRuleSearch = (rules: Rule[]) => { /* filter logic */ }
const RuleStats = ({ total, active }: { total: number; active: number }) => (
  <div>Active: {active} / {total}</div>
)
const RuleRow = ({ rule }: { rule: Rule }) => <div>{rule.name}</div>

export const RulesDashboard = () => {
  const { rules } = useRulesFetch()
  const { search, setSearch, filtered } = useRuleSearch(rules)
  return (
    <div>
      <RuleStats total={rules.length} active={rules.filter(r => r.isActive).length} />
      <input value={search} onChange={e => setSearch(e.target.value)} />
      {filtered.map(rule => <RuleRow key={rule.id} rule={rule} />)}
    </div>
  )
}
```

### Controlled vs Uncontrolled

```tsx
// ❌ Uncontrolled — DOM owns the value, can't clear or validate programmatically
const SearchBar = ({ onSearch }: { onSearch: (q: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <input
      ref={inputRef}
      defaultValue=""
      onKeyDown={e => { if (e.key === 'Enter') { onSearch(inputRef.current?.value ?? '') } }}
    />
  )
}

// ✅ Controlled — React owns the value
const SearchBar = ({ onSearch }: { onSearch: (q: string) => void }) => {
  const [query, setQuery] = useState('')
  return (
    <input
      value={query}
      onChange={e => setQuery(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { onSearch(query) } }}
    />
  )
}
```

### Composition Over Configuration

```tsx
// ❌ Prop explosion
<Modal
  title="Delete Rule"
  showCloseButton
  footerVariant="danger-actions"
  primaryButtonLabel="Delete"
  onPrimary={handleDelete}
  onSecondary={handleClose}
/>

// ✅ Composable
<Modal onClose={handleClose}>
  <ModalHeader><ModalTitle>Delete Rule</ModalTitle></ModalHeader>
  <ModalFooter>
    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
    <Button variant="danger" onClick={handleDelete}>Delete</Button>
  </ModalFooter>
</Modal>
```

---

## Ch.3 — Composition Patterns

### Compound Components

```tsx
// ❌ Render prop explosion
<Select
  renderOption={o => <div>{o.label}</div>}
  renderEmpty={() => <span>None</span>}
  renderTrigger={v => <button>{v}</button>}
/>

// ✅ Compound components — context shared implicitly
const SelectContext = createContext<SelectCtxValue | null>(null)

const Select = ({ children, onChange }: SelectProps) => {
  const [selected, setSelected] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const onSelect = useCallback((v: string) => { setSelected(v); setIsOpen(false); onChange(v) }, [onChange])
  return (
    <SelectContext.Provider value={{ selected, onSelect, isOpen, setIsOpen }}>
      <div>{children}</div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = ({ children }: { children: ReactNode }) => {
  const { isOpen, setIsOpen } = useSelectContext()
  return <button onClick={() => setIsOpen(!isOpen)}>{children}</button>
}

const SelectOption = ({ value, children }: { value: string; children: ReactNode }) => {
  const { onSelect, selected } = useSelectContext()
  return <div role="option" aria-selected={selected === value} onClick={() => onSelect(value)}>{children}</div>
}

<Select onChange={setValue}>
  <SelectTrigger>{value ?? 'Pick one...'}</SelectTrigger>
  <SelectOption value="a">Option A</SelectOption>
</Select>
```

### HOC

```tsx
// ✅ HOC for auth guard — non-hook concern
function withAuthGuard<T extends object>(WrappedComponent: React.ComponentType<T>, requiredRole: Role) {
  function AuthGuarded(props: T) {
    const { user } = useAuth()
    if (!user || !user.roles.includes(requiredRole)) { return <AccessDenied /> }
    return <WrappedComponent {...props} />
  }
  AuthGuarded.displayName = `withAuthGuard(${WrappedComponent.displayName ?? WrappedComponent.name})`
  return AuthGuarded
}

// ❌ HOC for UI logic — use a hook instead
function withLoadingState<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function WithLoading({ isLoading, ...props }: T & { isLoading: boolean }) {
    if (isLoading) { return <Spinner /> }
    return <WrappedComponent {...(props as T)} />
  }
}
// ✅ Cleaner as hook + conditional
const { data, isLoading } = useRules()
if (isLoading) { return <Spinner /> }
return <RulesTable data={data} />
```

---

## Ch.4 — Hooks

### Rules of Hooks

```tsx
// ❌ Hook inside condition
const MyComponent = ({ isAdmin }: Props) => {
  if (isAdmin) {
    const perms = usePermissions()  // ILLEGAL
  }
}

// ❌ Hook inside loop — extract to a component
const List = ({ items }: { items: Item[] }) => (
  <div>
    {items.map(item => {
      const data = useItemData(item.id)  // ILLEGAL
      return <div key={item.id}>{data}</div>
    })}
  </div>
)

// ✅ Component per item
const ItemRow = ({ item }: { item: Item }) => {
  const data = useItemData(item.id)
  return <div>{data}</div>
}
const List = ({ items }: { items: Item[] }) => (
  <div>{items.map(item => <ItemRow key={item.id} item={item} />)}</div>
)
```

### useRef

```tsx
// ✅ DOM ref
const inputRef = useRef<HTMLInputElement>(null)
const focusInput = () => inputRef.current?.focus()
return <input ref={inputRef} />

// ✅ Mutable value ref — no re-render
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
useEffect(() => {
  return () => { if (timerRef.current) { clearTimeout(timerRef.current) } }
}, [])

// ❌ useState for previous value — causes extra render
const [prevId, setPrevId] = useState(id)
useEffect(() => { setPrevId(id) }, [id])

// ✅ useRef for previous value
const prevIdRef = useRef(id)
useEffect(() => { prevIdRef.current = id })
```

### Stale Closure

```tsx
// ❌ Stale closure — always logs 0
const Counter = () => {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const id = setInterval(() => { console.log(count) }, 1000)
    return () => clearInterval(id)
  }, [])
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}

// ✅ Functional update
useEffect(() => {
  const id = setInterval(() => { setCount(c => c + 1) }, 1000)
  return () => clearInterval(id)
}, [])

// ✅ useRef to read latest value without re-running effect
const countRef = useRef(count)
useEffect(() => { countRef.current = count })
useEffect(() => {
  const id = setInterval(() => { console.log(countRef.current) }, 1000)
  return () => clearInterval(id)
}, [])
```

### Dependency Array

```tsx
// ❌ Missing dep — stale id after change
useEffect(() => {
  fetchData(id).then(setData)
}, [])  // missing id

// ✅
useEffect(() => {
  fetchData(id).then(setData)
}, [id])

// ❌ Object in deps — infinite loop
useEffect(() => { init(config) }, [config])  // new object every render

// ✅ Destructure primitives
const { url, timeout } = config
useEffect(() => { init({ url, timeout }) }, [url, timeout])
```

### Custom Hook Extraction

```tsx
// ❌ Fetch logic in component
const RuleEditor = ({ id }: { id: string }) => {
  const [rule, setRule] = useState<Rule | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => {
    setIsLoading(true)
    fetchRule(id).then(setRule).catch(setError).finally(() => setIsLoading(false))
  }, [id])
  if (isLoading) { return <Spinner /> }
  if (error) { return <ErrorMessage error={error} /> }
  return <Form rule={rule} />
}

// ✅ Extracted hook
const useRule = (id: string) => {
  const [state, setState] = useState<FetchState<Rule>>({ status: 'loading' })
  useEffect(() => {
    setState({ status: 'loading' })
    fetchRule(id)
      .then(data => setState({ status: 'success', data }))
      .catch(error => setState({ status: 'error', message: error.message }))
  }, [id])
  return state
}

const RuleEditor = ({ id }: { id: string }) => {
  const state = useRule(id)
  if (state.status === 'loading') { return <Spinner /> }
  if (state.status === 'error') { return <ErrorMessage message={state.message} /> }
  return <Form rule={state.data} />
}
```

---

## Ch.5 — State Design

### Colocate State

```tsx
// ❌ Dialog state lifted too high — every change re-renders Page
const Page = () => {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Header />
      <MainContent />
      <Button onClick={() => setOpen(true)}>New Rule</Button>
      {open && <Dialog onClose={() => setOpen(false)} />}
    </div>
  )
}

// ✅ Colocate — only CreateButton re-renders
const CreateButton = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>New Rule</Button>
      {open && <Dialog onClose={() => setOpen(false)} />}
    </>
  )
}
```

### Discriminated Union State

```tsx
// ❌ Multiple booleans — impossible states possible
interface FetchState {
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
}

// ✅ Discriminated union — impossible states are unrepresentable
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

switch (state.status) {
  case 'idle':    return <Placeholder />
  case 'loading': return <Spinner />
  case 'success': return <RulesList rules={state.data} />
  case 'error':   return <ErrorView message={state.message} />
}
```

### Derive, Don't Sync

```tsx
// ❌ Synced via useEffect — two sources of truth, double render
const [items, setItems] = useState<Item[]>([])
const [activeItems, setActiveItems] = useState<Item[]>([])
useEffect(() => { setActiveItems(items.filter(i => i.isActive)) }, [items])

// ✅ Derive inline
const activeItems = items.filter(i => i.isActive)
// Or memoized if expensive:
const activeItems = useMemo(() => items.filter(i => i.isActive), [items])
```

### useReducer for State Machines

```tsx
// ❌ Multiple useState — transitions unconstrained
const [step, setStep] = useState(0)
const [formData, setFormData] = useState({})

// ✅ useReducer — explicit transitions
type WizardAction =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SET_DATA'; step: number; data: unknown }
  | { type: 'RESET' }

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'NEXT': return { ...state, currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS - 1) }
    case 'BACK': return { ...state, currentStep: Math.max(0, state.currentStep - 1) }
    case 'SET_DATA': return { ...state, stepData: { ...state.stepData, [action.step]: action.data } }
    case 'RESET': return { currentStep: 0, stepData: {} }
    default: return state
  }
}
```

---

## Ch.6 — Effects

### What NOT to Put in Effects

```tsx
// ❌ Derive state with useEffect
useEffect(() => { setFullName(`${firstName} ${lastName}`) }, [firstName, lastName])
// ✅ Derive inline
const fullName = `${firstName} ${lastName}`

// ❌ Respond to events with useEffect
useEffect(() => { if (submitted) { save(formData) } }, [submitted])
// ✅ Call directly in handler
const handleSubmit = () => { save(formData) }
```

### Cleanup

```tsx
// ❌ Subscription leaks
useEffect(() => {
  const sub = eventBus.subscribe('rule-updated', handleUpdate)
  // no cleanup
}, [handleUpdate])

// ✅ Always cleanup
useEffect(() => {
  const sub = eventBus.subscribe('rule-updated', handleUpdate)
  return () => sub.unsubscribe()
}, [handleUpdate])

// ✅ AbortController for fetch
useEffect(() => {
  const controller = new AbortController()
  fetchRule(id, { signal: controller.signal })
    .then(setRule)
    .catch(err => { if (err.name !== 'AbortError') { setError(err) } })
  return () => controller.abort()
}, [id])
```

### One Effect, One Purpose

```tsx
// ❌ Three concerns in one effect
useEffect(() => {
  fetchUser(id).then(setUser)
  document.title = `User ${id}`
  analytics.track('page-viewed', { id })
}, [id])

// ✅ Separate effects
useEffect(() => { fetchUser(id).then(setUser) }, [id])
useEffect(() => { document.title = user ? `${user.name} | App` : 'App' }, [user])
useEffect(() => { analytics.track('page-viewed', { id }) }, [id])
```

---

## Ch.7 — Performance

### memo

```tsx
// ❌ memo on trivial component — comparison costs more than render
const Badge = memo(({ count }: { count: number }) => <span>{count}</span>)

// ✅ memo on expensive tree
export const RulesTable = memo(function RulesTable({ rules, onDelete }: RulesTableProps) {
  return (
    <table>
      <tbody>{rules.map(rule => <RuleRow key={rule.id} rule={rule} onDelete={onDelete} />)}</tbody>
    </table>
  )
})
```

### useMemo

```tsx
// ❌ useMemo on cheap computation
const label = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName])
// ✅ Plain expression
const label = `${firstName} ${lastName}`

// ✅ useMemo for expensive computation
const processedData = useMemo(
  () => rawData.filter(item => item.status === filterStatus).sort((a, b) => a.priority - b.priority),
  [rawData, filterStatus]
)

// ✅ Stabilize object identity for Context or memo'd children
const contextValue = useMemo(() => ({ rules, dispatch }), [rules, dispatch])
```

### useCallback

```tsx
// ❌ useCallback without memo'd consumer — pure overhead
const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value), [])
// ✅ Plain inline
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)

// ✅ useCallback when function is a dep of useEffect
const fetchData = useCallback(() => gateway.fetchRules(filter), [gateway, filter])
useEffect(() => { fetchData() }, [fetchData])

// ✅ useCallback when passed to memo'd child
const handleDelete = useCallback((id: string) => dispatch({ type: 'DELETE', id }), [dispatch])
<RulesTable onDelete={handleDelete} />
```

### Inline Objects Break Memo

```tsx
// ❌ New references every render — memo useless
const Parent = () => (
  <Child
    config={{ pageSize: 10 }}
    onSelect={item => setSelected(item)}
  />
)

// ✅ Stable references
const DEFAULT_CONFIG = { pageSize: 10 } as const
const Parent = () => {
  const handleSelect = useCallback((item: Item) => setSelected(item), [])
  return <Child config={DEFAULT_CONFIG} onSelect={handleSelect} />
}
```

---

## Ch.8 — Suspense & Error Boundaries

```tsx
// ✅ Lazy-load heavy components
const RuleEditor = lazy(() => import('./RuleEditor'))
const App = () => (
  <Suspense fallback={<PageSkeleton />}>
    <RuleEditor />
  </Suspense>
)

// ✅ Nested Suspense for granular loading
const RulesPage = () => (
  <Suspense fallback={<PageSkeleton />}>
    <Suspense fallback={<TableSkeleton />}><RulesTable /></Suspense>
    <Suspense fallback={<StatsSkeleton />}><RuleStats /></Suspense>
  </Suspense>
)

// ✅ ErrorBoundary + Suspense standard pattern
const RulesPage = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Suspense fallback={<TableSkeleton />}>
      <RulesTable />
    </Suspense>
  </ErrorBoundary>
)
```

---

## Ch.9 — React 19 Actions

### useActionState

```tsx
// ❌ React 18 manual pattern
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const handleSubmit = async (data: FormData) => {
  setIsLoading(true)
  setError(null)
  try { await saveRule(data) } catch (e) { setError(e.message) } finally { setIsLoading(false) }
}

// ✅ React 19 useActionState
async function saveRuleAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await saveRule(Object.fromEntries(formData))
    return { error: null }
  } catch (e) {
    return { error: e.message }
  }
}

const RuleForm = () => {
  const [state, action, isPending] = useActionState(saveRuleAction, { error: null })
  return (
    <form action={action}>
      <input name="name" />
      {state.error && <p>{state.error}</p>}
      <button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</button>
    </form>
  )
}
```

### useOptimistic

```tsx
// ✅ UI updates instantly, reverts if server fails
const RulesList = ({ rules, onToggle }: Props) => {
  const [optimisticRules, setOptimisticActive] = useOptimistic(
    rules,
    (currentRules, updatedId: string) =>
      currentRules.map(r => r.id === updatedId ? { ...r, isActive: !r.isActive } : r)
  )
  const handleToggle = async (id: string) => {
    setOptimisticActive(id)
    await toggleRuleActive(id)
  }
  return <ul>{optimisticRules.map(rule => <RuleRow key={rule.id} rule={rule} onToggle={() => handleToggle(rule.id)} />)}</ul>
}
```

---

## Ch.10 — Props & TypeScript

### Named Interface

```tsx
// ❌ Inline type
const RuleCard = ({ rule, onEdit }: { rule: Rule; onEdit: (id: string) => void }) => { ... }

// ✅ Named interface
interface RuleCardProps {
  rule: Rule
  onEdit: (id: string) => void
  compact?: boolean
}
const RuleCard = ({ rule, onEdit, compact = false }: RuleCardProps) => { ... }
```

### Discriminated Union Props

```tsx
// ❌ Optional props that only make sense together
interface AlertProps {
  variant: 'info' | 'error' | 'success'
  icon?: ReactNode
  action?: () => void
  actionLabel?: string
}

// ✅ Each variant has exactly what it needs
type AlertProps =
  | { variant: 'info'; message: string }
  | { variant: 'error'; message: string; onRetry?: () => void }
  | { variant: 'success'; message: string; onDismiss: () => void }
```

### Generics

```tsx
// ❌ Typed to Rule — not reusable
interface TableProps { data: Rule[]; getRowId: (rule: Rule) => string }

// ✅ Generic — infers T from data
interface TableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  getRowId: (row: T) => string
  onRowClick?: (row: T) => void
}
const DataTable = <T,>({ data, columns, getRowId, onRowClick }: TableProps<T>) => (...)
```

---

## Ch.11 — JSX & Lists

### Conditionals

```tsx
// ❌ && with non-boolean — renders "0"
{count && <Badge>{count}</Badge>}
// ✅
{count > 0 && <Badge>{count}</Badge>}

// ❌ Nested ternary
{isLoading ? <Spinner /> : isError ? <ErrorView /> : data ? <Content data={data} /> : <Empty />}
// ✅ Render function for 3+ branches
const renderContent = () => {
  if (isLoading) { return <Spinner /> }
  if (isError) { return <ErrorView /> }
  if (!data) { return <EmptyState /> }
  return <Content data={data} />
}
```

### Keys

```tsx
// ❌ Index — breaks on reorder/filter/insert
{rules.map((rule, i) => <RuleRow key={i} rule={rule} />)}

// ❌ Random — remounts every render
{rules.map(rule => <RuleRow key={Math.random()} rule={rule} />)}

// ✅ Stable ID from data
{rules.map(rule => <RuleRow key={rule.id} rule={rule} />)}

// ✅ Composite key for items from multiple groups
{groups.flatMap(group =>
  group.rules.map(rule => <RuleRow key={`${group.id}-${rule.id}`} rule={rule} />)
)}
```

---

## Ch.12 — Context

### Split by Update Frequency

```tsx
// ❌ One context — every unreadCount update re-renders ALL consumers
const AppContext = createContext({ user, theme, unreadCount, notifications })

// ✅ Split — components subscribe only to what they need
const UserContext         = createContext<User | null>(null)
const ThemeContext         = createContext<Theme>(defaultTheme)
const NotificationContext = createContext<Notifications | null>(null)
```

### Prop Drilling vs Context

```tsx
// ❌ onDelete passed through layers that don't use it
const Page = () => <Section onDelete={handleDelete} />
const Section = ({ onDelete }) => <Table onDelete={onDelete} />
const Table = ({ onDelete }) => <Row onDelete={onDelete} />

// ✅ Context for shared actions
const ActionsContext = createContext<{ onDelete: (id: string) => void } | null>(null)
const Page = () => (
  <ActionsContext.Provider value={{ onDelete: handleDelete }}>
    <Section />
  </ActionsContext.Provider>
)
const Row = ({ id }: { id: string }) => {
  const { onDelete } = useActionsContext()
  return <Button onClick={() => onDelete(id)}>Delete</Button>
}
```

---

## Ch.13 — Anti-Patterns

### Mutating State

```tsx
// ❌ Direct mutation — no re-render
const handleAdd = (item: Item) => {
  items.push(item)
  setItems(items)  // same reference → React bails out
}
// ✅ New reference
const handleAdd = (item: Item) => { setItems(prev => [...prev, item]) }

// ❌ Mutating nested object
const handleUpdate = (id: string, name: string) => {
  const item = items.find(i => i.id === id)!
  item.name = name
  setItems([...items])  // new array, stale object inside
}
// ✅ Map to new objects
const handleUpdate = (id: string, name: string) => {
  setItems(prev => prev.map(i => i.id === id ? { ...i, name } : i))
}
```

---

## Ch.14 — TypeScript

### interface vs type

```ts
// ✅ interface for object shapes
interface Rule { id: string; name: string }

// ✅ type for unions, intersections
type RuleStatus = 'active' | 'inactive' | 'draft'
type ActiveRule = Rule & { isActive: true }
```

### readonly

```ts
// ✅ readonly — TypeScript errors on mutation
interface Config {
  readonly apiUrl: string
  readonly timeout: number
}
interface RuleGroup {
  readonly id: string
  readonly rules: ReadonlyArray<Rule>
}
```

### unknown vs any

```ts
// ❌ any — errors only at runtime
function process(data: any) { data.nonExistentMethod() }

// ✅ unknown — forces narrowing
function process(data: unknown) {
  if (typeof data === 'string') { data.toUpperCase() }
}
```

### as const

```ts
// ❌ Mutable string[]
const STATUS_OPTIONS = ['active', 'inactive', 'draft']

// ✅ Readonly literal tuple + derived union
const STATUS_OPTIONS = ['active', 'inactive', 'draft'] as const
type Status = typeof STATUS_OPTIONS[number]
```

### Exhaustive Switch

```ts
// ✅ never trick — TS errors if new status added without updating switch
function getLabel(status: Status): string {
  switch (status) {
    case 'active':   return 'Active'
    case 'inactive': return 'Inactive'
    case 'draft':    return 'Draft'
    default: {
      const _: never = status
      return _
    }
  }
}
```

### Pure Functions

```ts
// ❌ Impure — mutates external state
function addRule(rule: Rule) {
  rules.push(rule)
  totalCount++
}

// ✅ Pure — returns new state
function addRule(rules: Rule[], rule: Rule): Rule[] {
  return [...rules, rule]
}
```

### map/filter/reduce over for loops

```ts
// ❌ Imperative
const activeNames: string[] = []
for (let i = 0; i < rules.length; i++) {
  if (rules[i].isActive) { activeNames.push(rules[i].name) }
}

// ✅ Declarative
const activeNames = rules.filter(r => r.isActive).map(r => r.name)
const totalWeight = rules.reduce((sum, r) => sum + r.weight, 0)
```
