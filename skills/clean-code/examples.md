# Clean Code — Code Examples

> Reference file. Read this when you need to see a concrete code pattern for any principle in SKILL.md.

---

## Ch.2 — Meaningful Names

```ts
// ❌ Cryptic — what is d? days? data?
const d = 86400
const u = users.filter(x => x.a)

// ✅ Intention-revealing
const SECONDS_IN_DAY = 86400
const activeUsers = users.filter(user => user.isActive)
```

```ts
// ❌ Disinformation — it's not a List, but it's called List
const ruleList: Map<string, Rule> = new Map()

// ✅ Accurately describes the structure
const ruleMap: Map<string, Rule> = new Map()
const rules: Rule[] = []
```

```ts
// ❌ Not pronounceable
const genymdhms = new Date()

// ✅ Pronounceable and searchable
const generationTimestamp = new Date()
```

```ts
// ❌ Different words for the same concept
fetchUser() / getUser() / retrieveUser()

// ✅ One word per concept across the entire project
fetchUser() // always fetch, never get or retrieve
```

### Magic Numbers

```ts
// ❌ Magic numbers
if (password.length < 8) { throw new Error('Too short') }
setTimeout(refresh, 86400000)
if (status === 3) { ... }

// ✅ Named constants
const MIN_PASSWORD_LENGTH = 8
const ONE_DAY_MS = 86_400_000
const STATUS_ACTIVE = 3
if (password.length < MIN_PASSWORD_LENGTH) { throw new Error('Too short') }
setTimeout(refresh, ONE_DAY_MS)
```

---

## Ch.3 — Functions

```ts
// ❌ Violates SRP — fetches, transforms, AND renders
const UserCard = ({ userId }) => {
  const [user, setUser] = useState(null)
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => setUser({ ...data, fullName: `${data.first} ${data.last}` }))
  }, [userId])
  return <div>{user?.fullName}</div>
}

// ✅ SRP — each function does ONE thing
const formatUser = (data) => ({ ...data, fullName: `${data.first} ${data.last}` })
const useUser = (userId) => { /* fetch logic */ }
const UserCard = ({ userId }) => {
  const { user } = useUser(userId)
  return <div>{user?.fullName}</div>
}
```

```ts
// ❌ Deep nesting
function processRule(rule) {
  if (rule) {
    if (rule.isActive) {
      if (rule.conditions.length > 0) {
        return execute(rule)
      }
    }
  }
}

// ✅ Guard clauses — flat and readable
function processRule(rule) {
  if (!rule) { return }
  if (!rule.isActive) { return }
  if (rule.conditions.length === 0) { return }
  return execute(rule)
}
```

```ts
// ❌ Shorthand if without braces
if (!rule) return

// ✅ Always use braces
if (!rule) { return }
```

```ts
// ❌ Nested ternary
const label = isLoading ? 'Loading' : isError ? 'Error' : 'Done'

// ✅ if/else or early return
function getLabel() {
  if (isLoading) { return 'Loading' }
  if (isError) { return 'Error' }
  return 'Done'
}
```

---

## Ch.4 — Comments

```ts
// ❌ Redundant
// Increment counter by 1
counter++

// ❌ Misleading
// Returns user if found
function getUser(id: string): User | null { ... }

// ❌ Changelog in code
// 2024-01-15: Added null check (John)

// ❌ Commented-out code — delete it, git preserves it
// const oldValidation = validate(input)
```

```ts
// ✅ Intent — explains WHY, not HOW
// Timeout matches server-side session expiry to prevent token mismatch
const SESSION_TIMEOUT = 30_000

// ✅ Warning of consequence
// Don't sort in-place — consumers depend on original order
const sorted = [...items].sort(compareFn)

// ✅ TODO — for known tech debt
// TODO: Replace with real API when endpoint is verified
setItems(MOCK_DATA)
```

---

## Ch.5 — Formatting

```ts
// ❌ Caller is BELOW callee — you read bottom-up
function validateCondition(c: Condition) { ... }
function validateRule(rule: Rule) {
  rule.conditions.forEach(validateCondition)
}

// ✅ Caller is ABOVE callee — you read top-down
function validateRule(rule: Rule) {
  rule.conditions.forEach(validateCondition)
}
function validateCondition(c: Condition) { ... }
```

```ts
// ❌ No vertical openness
const name = rule.name
const isValid = name.length > 0
const conditions = rule.conditions
const hasConditions = conditions.length > 0
return isValid && hasConditions

// ✅ Blank lines separate concepts
const name = rule.name
const isValid = name.length > 0

const conditions = rule.conditions
const hasConditions = conditions.length > 0

return isValid && hasConditions
```

---

## Ch.6 — Objects & Data Structures

```ts
// ❌ Hybrid — exposes both data AND behavior
class Rule {
  public conditions: Condition[]
  validate() { ... }
}

// ✅ Data structure — only data
interface RuleData { id: string; conditions: Condition[] }

// ✅ Object — only behavior
class RuleValidator {
  private rules: RuleData[]
  validate(rule: RuleData): boolean { ... }
}
```

### Law of Demeter

```ts
// ❌ Train wreck — 3 levels of access
const city = order.getCustomer().getAddress().getCity()

// ✅ Tell, don't ask
const city = order.getCustomerCity()
```

---

## Ch.7 — Error Handling

```ts
// ❌ Error code — silently ignored
function deleteRule(id: string): boolean {
  if (!id) return false
  return true
}

// ✅ Exception — cannot be ignored
function deleteRule(id: string): void {
  if (!id) throw new Error('Rule ID is required')
}
```

```ts
// ❌ Returns null — every caller must null-check
function findRule(id: string): Rule | null { ... }

// ✅ Empty collection instead of null for lists
function findRules(filter: Filter): Rule[] {
  return []
}

// ✅ Throw if you expect to always find the record
function getRuleOrThrow(id: string): Rule {
  const rule = db.find(id)
  if (!rule) throw new RuleNotFoundError(id)
  return rule
}
```

```ts
// ❌ Catch everything and continue
try {
  await saveRule(rule)
} catch {
  // silence...
}

// ✅ Catch only what you can handle
try {
  await saveRule(rule)
} catch (error) {
  if (error instanceof NetworkError) {
    notify.error('Connection failed, please retry')
  } else {
    throw error
  }
}
```

### Null Object Pattern

```ts
// ❌ Null — every caller must guard
function findUser(id: string): User | null { ... }
const user = findUser(id)
if (user) { renderProfile(user) }

// ✅ Null Object — caller never needs to check
const GUEST_USER: User = { id: '', name: 'Guest', permissions: [], isGuest: true }

function findUser(id: string): User {
  return db.find(id) ?? GUEST_USER
}
renderProfile(findUser(id))
```

---

## Ch.8 — Boundaries

```ts
// ❌ fetch() leaks directly into the hook
function useRules() {
  useEffect(() => {
    fetch('/api/rules').then(r => r.json()).then(setRules)
  }, [])
}

// ✅ Gateway wrapper — only it knows about fetch
class RuleGateway {
  fetch = (): Observable<Rule[]> => new Observable(observer => {
    fetch('/api/rules').then(r => r.json())
      .then(data => { observer.next(data); observer.complete() })
      .catch(err => observer.error(err))
  })
}
```

---

## Ch.9 — Unit Tests

```ts
// ❌ Checks 5 things — which one broke?
it('rule operations work', () => {
  expect(createRule(data)).toBeDefined()
  expect(updateRule(id, data)).toBeTruthy()
  expect(deleteRule(id)).toBe(true)
  expect(fetchRules()).toHaveLength(0)
  expect(validateRule({})).toBe(false)
})

// ✅ One concept per test
it('creates rule with valid data', () => {
  expect(createRule(validData)).toBeDefined()
})
it('rejects rule creation without name', () => {
  expect(() => createRule({ ...validData, name: '' })).toThrow()
})
```

---

## Ch.10 — Classes

```ts
// ❌ God class
class RuleManager {
  fetchRules() { ... }
  validateRule() { ... }
  formatForDisplay() { ... }
  saveToStorage() { ... }
}

// ✅ SRP
class RuleGateway   { fetch() { ... } }
class RuleValidator { validate() { ... } }
class RuleFormatter { format() { ... } }
```

```ts
// ❌ Low cohesion
class RuleService {
  private gateway: RuleGateway
  formatDate(date: Date) { return date.toISOString() }  // doesn't use gateway
  parseCSV(text: string) { return text.split(',') }      // doesn't use gateway
  fetchRules() { return this.gateway.fetch() }
}

// ✅ High cohesion
class RuleService {
  private gateway: RuleGateway
  fetchRules() { return this.gateway.fetch() }
  deleteRule(id: string) { return this.gateway.delete(id) }
}
```

```ts
// OCP — open for extension, closed for modification
// ❌ Adding a new type requires modifying existing class
class Notifier {
  notify(type: string, msg: string) {
    if (type === 'email') { /* ... */ }
    if (type === 'slack') { /* ... */ }
  }
}

// ✅ Adding a new type = new class, not modification
interface Notifier { notify(msg: string): void }
class EmailNotifier implements Notifier { notify(msg) { ... } }
class SlackNotifier implements Notifier { notify(msg) { ... } }
```

```ts
// DIP — depend on abstraction, not concretion
// ❌ Tight coupling
class RuleService {
  private gateway = new RuleGateway()
}

// ✅ Depend on interface
class RuleService {
  constructor(private gateway: IRuleGateway) {}
}
```

---

## Ch.11 — Systems

```ts
// ❌ Class creates its own dependencies
class RuleService {
  private gateway = new RuleGateway()
  private validator = new RuleValidator()
}

// ✅ Dependency Injection
class RuleService {
  constructor(
    private gateway: IRuleGateway,
    private validator: IRuleValidator
  ) {}
}
const service = new RuleService(mockGateway, mockValidator)
```

---

## Ch.12 — Emergence

```ts
// ❌ Violates intention + duplication
function proc(d: any[], f: any) {
  const r = []
  for (let i = 0; i < d.length; i++) {
    if (f(d[i])) r.push(d[i])
  }
  return r
}

// ✅ All 4 rules satisfied
function filterRules(rules: Rule[], predicate: (rule: Rule) => boolean): Rule[] {
  return rules.filter(predicate)
}
```

---

## Ch.13 — Concurrency

```ts
// ❌ IO and business logic mixed
async function processRules() {
  const response = await fetch('/api/rules')
  const rules = await response.json()
  const active = rules.filter(r => r.isActive)
  const sorted = active.sort((a, b) => a.p - b.p)
  await Promise.all(sorted.map(r => send(r)))
}

// ✅ Separated
async function fetchRules(): Promise<Rule[]> {
  return fetch('/api/rules').then(r => r.json())
}

function getActiveByPriority(rules: Rule[]): Rule[] {
  return rules.filter(r => r.isActive).sort((a, b) => a.p - b.p)
}

async function sendRule(rule: Rule): Promise<void> {
  await send(rule)
}
```

---

## Code Smells — Examples

```ts
// ❌ Feature Envy
class Order {
  calculateDiscount(customer: Customer) {
    if (customer.loyaltyYears > 5 && customer.totalSpend > 1000) { return 0.2 }
    return 0
  }
}

// ✅ Move to the class it envies
class Customer {
  getDiscount(): number {
    if (this.loyaltyYears > 5 && this.totalSpend > 1000) { return 0.2 }
    return 0
  }
}
```

```ts
// ❌ Data Clumps
function createRule(name: string, description: string, priority: number) { ... }
function updateRule(id: string, name: string, description: string, priority: number) { ... }

// ✅ Extract into an object
interface RuleFormData { name: string; description: string; priority: number }
function createRule(data: RuleFormData) { ... }
function updateRule(id: string, data: RuleFormData) { ... }
```

```ts
// ❌ Primitive Obsession
function processRule(status: string) {
  if (status === 'active') { ... }
}

// ✅ Typed value
type RuleStatus = 'active' | 'inactive' | 'draft'
function processRule(status: RuleStatus) { ... }
```

```ts
// ❌ Switch smell
function getIcon(type: string) {
  switch (type) {
    case 'warning': return WarningIcon
    case 'error': return ErrorIcon
    case 'info': return InfoIcon
  }
}

// ✅ Lookup map
const ICON_MAP: Record<AlertType, Icon> = {
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
}
const getIcon = (type: AlertType) => ICON_MAP[type]
```
