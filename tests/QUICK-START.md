# Quick Start Guide - Test Suite

## Getting Started in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

### 2. Run All Tests

```bash
npm test
```

### 3. View Coverage Report

```bash
npm run test:coverage
open coverage/index.html
```

---

## Common Commands

```bash
# Run specific test types
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e           # End-to-end tests
npm run test:a11y          # Accessibility tests

# Development
npm run test:watch         # Watch mode for rapid development

# E2E with browser visible
npm run test:e2e:headed    # See the tests run in browser
```

---

## Test File Locations

| Test Type | Location | Example |
|-----------|----------|---------|
| Unit | `tests/unit/` | `main.test.js` |
| Integration | `tests/integration/` | `search-workflow.test.js` |
| E2E | `tests/e2e/` | `homepage.spec.js` |
| Data | `tests/data/` | `schema-validation.test.js` |
| Performance | `tests/performance/` | `page-load.test.js` |
| Accessibility | `tests/accessibility/` | `a11y.test.js` |

---

## Running Single Test File

```bash
npm test -- tests/unit/main.test.js
```

---

## Debugging Tests

### Jest (Unit/Integration)

```bash
# Add debugger; statement in test
# Then run:
node --inspect-brk node_modules/.bin/jest tests/unit/main.test.js
```

### Playwright (E2E)

```bash
npx playwright test --debug
```

---

## Coverage Requirements

- **Overall**: 85%+
- **Critical Paths**: 100%

Check coverage:
```bash
npm run test:coverage
```

---

## Need Help?

1. See full documentation: `tests/README.md`
2. Check fixtures: `tests/fixtures/`
3. View examples in existing test files

---

## Project Structure

```
tests/
├── unit/              # Function tests
├── integration/       # Workflow tests
├── e2e/              # Browser tests
├── data/             # Schema validation
├── performance/      # Speed tests
├── accessibility/    # A11y tests
├── fixtures/         # Test data
└── README.md        # Full docs
```

---

## Before Committing

```bash
# Run all tests
npm run test:all

# Check coverage
npm run test:coverage

# Lint code
npm run lint
```

---

**Ready to write tests?** See `tests/README.md` for detailed guide!
