# Test Suite Documentation

## Early Composers Musical Catalogue - Comprehensive Testing Guide

This document describes the complete test suite for the Early Composers Musical Catalogue project.

---

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Test Structure](#test-structure)
4. [Running Tests](#running-tests)
5. [Test Categories](#test-categories)
6. [Coverage Requirements](#coverage-requirements)
7. [Continuous Integration](#continuous-integration)
8. [Writing New Tests](#writing-new-tests)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The test suite provides comprehensive coverage of all application features:

- **Unit Tests**: Individual function testing
- **Integration Tests**: Feature workflow testing
- **E2E Tests**: Complete user journey testing
- **Data Validation**: JSON schema compliance
- **Performance Tests**: Load time and responsiveness
- **Accessibility Tests**: WCAG 2.1 AA compliance
- **Visual Tests**: UI rendering verification

**Total Test Files**: 12+
**Coverage Goal**: 90%+
**Test Framework**: Jest + Playwright

---

## Setup

### Prerequisites

- Node.js 16+ and npm
- All project dependencies installed

### Installation

```bash
# Install test dependencies
npm install

# Verify installation
npm run test -- --version
```

### Configuration

Test configurations are located in:
- `jest.config.js` - Jest unit/integration tests
- `playwright.config.js` - E2E tests
- `package.json` - Test scripts

---

## Test Structure

```
tests/
├── __mocks__/              # Mock files for imports
│   ├── styleMock.js        # CSS import mocks
│   └── fileMock.js         # File import mocks
├── setup.js                # Global test setup
├── unit/                   # Unit tests
│   ├── main.test.js
│   ├── composer-common.test.js
│   └── recordings.test.js
├── integration/            # Integration tests
│   ├── search-workflow.test.js
│   └── composer-page-workflow.test.js
├── e2e/                    # End-to-end tests
│   ├── homepage.spec.js
│   └── composer-page.spec.js
├── data/                   # Data validation tests
│   └── schema-validation.test.js
├── performance/            # Performance tests
│   └── page-load.test.js
├── accessibility/          # Accessibility tests
│   └── a11y.test.js
├── fixtures/               # Test data fixtures
│   ├── composer-data.fixture.js
│   └── recordings-data.fixture.js
└── README.md              # This file
```

---

## Running Tests

### All Tests

```bash
# Run all tests
npm test

# Run all tests with coverage
npm run test:coverage
```

### By Category

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests
npm run test:e2e

# Data validation
npm run test:data

# Performance tests
npm run test:performance

# Accessibility tests
npm run test:a11y
```

### Watch Mode

```bash
# Run tests in watch mode
npm run test:watch
```

### E2E Tests (Playwright)

```bash
# Run E2E tests headless
npm run test:e2e

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Run E2E tests with UI
npm run test:e2e:ui
```

### Specific Test Files

```bash
# Run specific test file
npm test -- tests/unit/main.test.js

# Run tests matching pattern
npm test -- --testNamePattern="search"
```

---

## Test Categories

### 1. Unit Tests

**Location**: `tests/unit/`

**Purpose**: Test individual JavaScript functions in isolation

**Files**:
- `main.test.js` - Homepage functionality
- `composer-common.test.js` - Composer page functions
- `recordings.test.js` - Recording database functions

**Coverage**:
- Pure functions
- Event handlers
- DOM manipulation
- Data transformations
- Utility functions

### 2. Integration Tests

**Location**: `tests/integration/`

**Purpose**: Test feature workflows and component interactions

**Files**:
- `search-workflow.test.js` - Complete search functionality
- `composer-page-workflow.test.js` - Composer page interactions

**Coverage**:
- Multi-step user flows
- Filter + search + pagination
- Modal interactions
- Navigation flows

### 3. End-to-End Tests

**Location**: `tests/e2e/`

**Purpose**: Test complete user journeys in real browser

**Files**:
- `homepage.spec.js` - Homepage user interactions
- `composer-page.spec.js` - Composer page journeys

**Coverage**:
- Page navigation
- Form submissions
- User interactions
- Cross-page workflows
- Responsive design

**Browsers Tested**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari

### 4. Data Validation Tests

**Location**: `tests/data/`

**Purpose**: Validate JSON data integrity and schema compliance

**Files**:
- `schema-validation.test.js` - JSON schema validation

**Coverage**:
- Schema compliance
- Required fields
- Data types
- Cross-reference integrity
- Value ranges
- Duplicate detection

### 5. Performance Tests

**Location**: `tests/performance/`

**Purpose**: Ensure acceptable load times and responsiveness

**Files**:
- `page-load.test.js` - Page load performance

**Coverage**:
- Page load times (< 3s)
- Data fetching (< 2s)
- Search operations (< 100ms)
- Rendering performance
- Animation smoothness
- Memory management

**Performance Benchmarks**:
- Homepage load: < 3 seconds
- Data fetch: < 2 seconds
- Filter operation: < 100ms
- Table rendering (50 rows): < 100ms

### 6. Accessibility Tests

**Location**: `tests/accessibility/`

**Purpose**: Ensure WCAG 2.1 AA compliance

**Files**:
- `a11y.test.js` - Accessibility compliance

**Coverage**:
- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Color contrast
- Form labels
- Alt text
- Focus indicators
- Screen reader compatibility

**Standards**: WCAG 2.1 Level AA

### 7. Visual/UI Tests

**Location**: `tests/visual/`

**Purpose**: Verify UI rendering across viewports

**Coverage**:
- Responsive breakpoints
- Component rendering
- Layout integrity
- Cross-browser compatibility

---

## Coverage Requirements

### Overall Coverage Goals

- **Statements**: 85%+
- **Branches**: 80%+
- **Functions**: 85%+
- **Lines**: 85%+

### Critical Paths

Critical user paths require **100% coverage**:
- Search functionality
- Work filtering
- Data loading
- Navigation

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML coverage report
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

---

## Continuous Integration

### GitHub Actions

Tests run automatically on:
- Every push to main
- Pull requests
- Scheduled nightly builds

### CI Configuration

Located in `.github/workflows/test.yml` (if configured)

### CI Commands

```bash
# Run all tests in CI mode
npm run test:all

# Generate coverage for CI
npm run test:coverage -- --ci
```

---

## Writing New Tests

### Unit Test Template

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  test('should perform expected behavior', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionToTest(input);

    // Assert
    expect(result).toBe('expected');
  });

  afterEach(() => {
    // Cleanup
  });
});
```

### E2E Test Template

```javascript
const { test, expect } = require('@playwright/test');

test('should complete user journey', async ({ page }) => {
  await page.goto('/');

  // Interact with page
  await page.click('button');

  // Assert result
  await expect(page.locator('h1')).toContainText('Expected');
});
```

### Best Practices

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **One Assertion**: Focus on single behavior per test
4. **Clean State**: Reset state between tests
5. **Mock External**: Mock fetch, timers, etc.
6. **Avoid Hardcoding**: Use fixtures and constants
7. **Test Edge Cases**: Include boundary conditions
8. **Async Handling**: Properly handle promises

---

## Troubleshooting

### Common Issues

#### Tests Failing Locally

```bash
# Clear Jest cache
npm test -- --clearCache

# Update snapshots
npm test -- -u
```

#### E2E Tests Timing Out

```bash
# Increase timeout in playwright.config.js
timeout: 60 * 1000  // 60 seconds
```

#### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

#### Port Already in Use (E2E)

```bash
# Kill process on port 8000
# macOS/Linux:
lsof -ti:8000 | xargs kill

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* npm test

# Run single test in debug mode
node --inspect-brk node_modules/.bin/jest tests/unit/main.test.js
```

### Playwright Debug

```bash
# Run with Playwright Inspector
npx playwright test --debug

# Show browser
npm run test:e2e:headed
```

---

## Test Data and Fixtures

Test fixtures are located in `tests/fixtures/`:

- `composer-data.fixture.js` - Mock composer data
- `recordings-data.fixture.js` - Mock recordings data

### Using Fixtures

```javascript
const { bachComplete } = require('../fixtures/composer-data.fixture');

test('should load Bach data', () => {
  const data = bachComplete;
  expect(data.composer.fullName).toBe('Johann Sebastian Bach');
});
```

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Ensure all tests pass
3. Maintain coverage above 85%
4. Add test documentation
5. Update this README if needed

---

## Contact

For questions or issues with the test suite, please open an issue on the project repository.

---

**Last Updated**: 2024
**Test Suite Version**: 1.0.0
