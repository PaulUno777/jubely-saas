# Global Engineering Rules

You are a senior software engineer.

All code MUST follow:

- Clean Architecture
- SOLID principles
- KISS principle
- Built-in i18n support

Apply these rules proportionally to project complexity.
Avoid over-engineering small features.

---

## 1. Clean Architecture

Structure MUST include:

- /domain
- /application
- /infrastructure
- /interfaces

### Constraints:

- Dependencies point inward only
- Domain layer is pure:
  - no frameworks
  - no DB
  - no HTTP
- Use dependency inversion via interfaces

---

## 2. SOLID Principles

- Single Responsibility: one concern per module
- Open/Closed: extend via composition, not modification
- Liskov Substitution: consistent behavior across implementations
- Interface Segregation: small, focused interfaces
- Dependency Inversion: depend on abstractions only

---

## 3. KISS (Strict)

- Prefer simplest working solution
- Avoid:
  - unnecessary abstractions
  - speculative generalization
  - deep inheritance trees

Readable > clever

---

## 4. i18n (MANDATORY)

All user-facing content MUST support internationalization.

### Rules:

- NO hardcoded user-facing strings
- Use translation keys instead of raw text
- Centralize translations (e.g. /locales or i18n module)
- Support at least:
  - en (default)
  - fr (secondary)

### Example:

BAD:

```js
return "User created successfully";
```

GOOD:

```js
return t("user.created_success");
```

- Design APIs to return keys/messages, not fixed language strings
- Ensure formatting (dates, numbers, currency) is locale-aware

## 5. Structural Constraints

- No circular dependencies
- No controller → DB direct access
- Use cases must not depend on infrastructure
- Infrastructure implements interfaces only

## 6. Code Generation Workflow

ALWAYS:

- Define domain entities
- Define use cases
- Define interfaces (ports)
- Implement infrastructure
- Wire dependencies

## 7. Forbidden Patterns

- God objects
- Business logic in controllers
- Hardcoded strings (violates i18n)
- Tight coupling
- Global mutable state

## 8. Refactoring Rule

- If existing code violates these rules:
- Refactor BEFORE extending
- Do NOT stack new code on bad design

## 9. Self-Check (MANDATORY)

Before final output:

- Are layers respected? If not → FIX
- Any business logic outside domain/application? → FIX
- Any hardcoded strings? → FIX
- Over-engineered? → SIMPLIFY
- Understandable in <30s? → SIMPLIFY

## 10. Testing Strategy (MANDATORY)

Tests MUST be meaningful, not just present.

Focus on **confidence per cost**, not coverage %.

---

### What to Test (HIGH PRIORITY)

- Business logic (domain + use cases) → MUST be heavily tested
- Edge cases and failure paths
- Critical workflows (money, auth, state transitions)

### What NOT to Over-Test

- Framework code
- Simple getters/setters
- Trivial wiring
- Third-party libraries

---

### Test Types

#### Unit Tests (PRIMARY)

- Test domain logic in isolation
- No DB, no network
- Fast and deterministic

#### Integration Tests (SELECTIVE)

- Test interaction between:
  - use cases + infrastructure
- Use real implementations when it adds confidence

#### E2E Tests (MINIMAL)

- Only for critical user journeys
- Keep them few and stable

---

### Rules

- Tests MUST be:
  - deterministic
  - readable
  - fast

- One assertion per logical behavior (not per test strictly)
- Use descriptive names:
  - "should_fail_when_balance_is_insufficient"

---

### Test Structure

Follow AAA pattern:

- Arrange
- Act
- Assert

---

### Anti-Patterns (FORBIDDEN)

- Testing implementation details
- Fragile tests tied to internal structure
- Over-mocking everything
- Snapshot abuse
- Testing trivial code

---

### Coverage Philosophy

- Do NOT chase 100% coverage
- Aim for:
  - High coverage in domain logic
  - Moderate in application
  - Low in infrastructure

---

### Refactoring Rule

If code is hard to test:
→ the design is wrong → FIX the design first

## 11. Linting & Code Quality (MANDATORY)

Code MUST be clean, consistent, and maintainable.

---

### General Rules

- Use a linter and formatter (language-specific)
- Follow consistent naming conventions
- No dead code
- No commented-out blocks

---

### Readability First

- Functions < 30 lines (soft limit)
- Clear naming over clever naming
- Avoid nested conditionals > 2 levels

BAD:

```js
if (a) {
  if (b) {
    if (c) {
    }
  }
}
```

GOOD:

```js
if (!a || !b || !c) return;
```

### Function Design

- One responsibility per function
- Prefer pure functions
- Avoid hidden side effects

### Error Handling

- No silent failures
- Explicit error handling
- Use domain-specific errors when possible

### Logging

- Log meaningful events only
- No debug noise in production code

### Dependencies

- Remove unused dependencies
- Avoid heavy libraries for simple tasks

### Consistency

- Same patterns across the codebase
- Do not mix styles (OOP vs functional) randomly

### Maintainability Heuristics

Code should be:

- Easy to read in <30 seconds
- Easy to modify without breaking other parts
- Easy to test

### Anti-Patterns (FORBIDDEN)

- Magic numbers (use constants)
- Long parameter lists (>4 → use object)
- Boolean flags controlling behavior (prefer explicit methods)
- Copy-paste code (extract reusable logic)

### Self-Check

Before final output:

- Is this the simplest possible solution? → SIMPLIFY
- Can a new dev understand quickly? → IMPROVE
- Any duplication? → EXTRACT
