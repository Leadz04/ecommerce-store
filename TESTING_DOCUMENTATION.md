# 🧪 Testing Documentation

Complete testing guide for the E-Commerce Store with Shopify-like features.

## 📋 Table of Contents

1. [Test Structure](#test-structure)
2. [Running Tests](#running-tests)
3. [Test Coverage](#test-coverage)
4. [Writing Tests](#writing-tests)
5. [Test Results Dashboard](#test-results-dashboard)
6. [Continuous Integration](#continuous-integration)

---

## 🗂️ Test Structure

```
__tests__/
├── api/                      # API endpoint tests
│   ├── discounts.test.ts     # Discount API tests
│   ├── gift-cards.test.ts    # Gift card API tests
│   ├── loyalty.test.ts       # Loyalty program tests
│   ├── flash-sales.test.ts   # Flash sale tests
│   └── bundles.test.ts       # Product bundle tests
├── components/               # React component tests
│   └── ProductCard.test.tsx  # ProductCard component tests
├── models/                   # Database model tests
│   └── Discount.test.ts      # Discount model tests
└── hooks/                    # Custom hooks tests
    └── useRealtime.test.ts   # Real-time hook tests
```

---

## 🚀 Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Watch Mode (Auto-rerun on changes)

```bash
npm run test:watch
```

### Run Specific Test File

```bash
npm test -- discounts.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="should create"
```

### CI Mode (for automated testing)

```bash
npm run test:ci
```

---

## 📊 Test Coverage

### Coverage Thresholds

The project maintains these minimum coverage requirements:

- **Lines**: 70%
- **Statements**: 70%
- **Functions**: 70%
- **Branches**: 70%

### Current Coverage (Example)

| Metric      | Coverage | Status |
|-------------|----------|--------|
| Lines       | 91%      | ✅ Pass |
| Statements  | 89%      | ✅ Pass |
| Functions   | 93%      | ✅ Pass |
| Branches    | 86%      | ✅ Pass |

### View Coverage Report

After running `npm run test:coverage`, open:

```bash
coverage/lcov-report/index.html
```

This shows:
- Line-by-line coverage
- Uncovered code paths
- Coverage by file/directory

---

## ✍️ Writing Tests

### 1. API Endpoint Tests

```typescript
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/your-endpoint/route';
import YourModel from '@/models/YourModel';
import connectDB from '@/lib/mongodb';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/YourModel');

describe('Your API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful request', async () => {
    // Setup mocks
    (connectDB as jest.Mock).mockResolvedValue(null);
    (YourModel.create as jest.Mock).mockResolvedValue({ id: '123' });

    // Create request
    const request = {
      json: async () => ({ data: 'test' }),
    } as NextRequest;

    // Call API
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(201);
    expect(data.id).toBe('123');
  });

  it('should handle errors', async () => {
    (connectDB as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const request = {
      json: async () => ({}),
    } as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
```

### 2. Component Tests

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import YourComponent from '@/components/YourComponent';

// Mock dependencies
jest.mock('@/store/yourStore');

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent prop="value" />);
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    const mockHandler = jest.fn();
    render(<YourComponent onClick={mockHandler} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

### 3. Model Tests

```typescript
import YourModel from '@/models/YourModel';

jest.mock('mongoose');

describe('YourModel', () => {
  it('should validate data correctly', () => {
    const data = { field: 'value' };
    const instance = {
      ...data,
      customMethod: YourModel.schema.methods.customMethod,
    };

    const result = instance.customMethod();
    expect(result).toBe(expected);
  });
});
```

### 4. Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useYourHook } from '@/hooks/useYourHook';

describe('useYourHook', () => {
  it('should return expected value', () => {
    const { result } = renderHook(() => useYourHook());
    
    expect(result.current.value).toBe(expected);
  });

  it('should update on change', async () => {
    const { result } = renderHook(() => useYourHook());
    
    result.current.update('new value');
    
    await waitFor(() => {
      expect(result.current.value).toBe('new value');
    });
  });
});
```

---

## 🎯 Test Results Dashboard

### Accessing the Dashboard

```
http://localhost:3000/admin/test-results
```

### Features

1. **Overall Statistics**
   - Total tests count
   - Pass/fail rates
   - Test duration
   - Coverage percentage

2. **Test Suites**
   - Individual suite results
   - Test-by-test breakdown
   - Coverage per suite
   - Execution time

3. **Code Coverage**
   - Lines coverage
   - Statements coverage
   - Functions coverage
   - Branches coverage

4. **Visual Indicators**
   - ✅ Green badges for passed tests
   - ❌ Red badges for failed tests
   - ⚠️ Yellow badges for low coverage
   - Progress bars for coverage metrics

### Running Tests from Dashboard

Click the **"Run All Tests"** button to execute the test suite and see real-time results.

---

## 🔄 Continuous Integration

### GitHub Actions Setup

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci --legacy-peer-deps
      
    - name: Run tests with coverage
      run: npm run test:ci
      
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
```

---

## 📈 Best Practices

### 1. **Test Naming**

```typescript
// ✅ Good
it('should create discount when valid data provided')

// ❌ Bad
it('test1')
```

### 2. **Arrange-Act-Assert Pattern**

```typescript
it('should calculate discount correctly', () => {
  // Arrange
  const discount = { type: 'percentage', value: 20 };
  
  // Act
  const result = discount.calculateDiscount(100);
  
  // Assert
  expect(result).toBe(20);
});
```

### 3. **Mock External Dependencies**

Always mock:
- Database connections
- API calls
- Third-party services
- File system operations

### 4. **Test Edge Cases**

```typescript
// Test normal case
it('should work with valid input')

// Test edge cases
it('should handle empty input')
it('should handle null values')
it('should handle maximum values')
it('should handle errors gracefully')
```

### 5. **Keep Tests Independent**

Each test should:
- Run in isolation
- Not depend on other tests
- Clean up after itself
- Have its own setup

---

## 🐛 Debugging Tests

### Run Single Test

```bash
npm test -- --testNamePattern="your test name"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Verbose Output

```bash
npm test -- --verbose
```

---

## 📊 Coverage Reports

### HTML Report

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Terminal Report

```bash
npm run test:coverage
```

Shows:
```
----------------|---------|----------|---------|---------|
File            | % Stmts | % Branch | % Funcs | % Lines |
----------------|---------|----------|---------|---------|
All files       |   89.45 |    86.21 |   93.18 |   91.23 |
 api/           |   92.15 |    88.45 |   95.12 |   93.45 |
  discounts.ts  |   94.23 |    90.12 |   96.34 |   95.12 |
 components/    |   88.45 |    85.23 |   91.45 |   89.78 |
  ProductCard   |   94.56 |    92.34 |   96.78 |   95.23 |
----------------|---------|----------|---------|---------|
```

---

## 🎓 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://testingjavascript.com/)

---

## 📝 Test Checklist

Before committing code, ensure:

- [ ] All tests pass
- [ ] New features have tests
- [ ] Coverage meets thresholds (70%)
- [ ] No console errors in tests
- [ ] Tests are independent
- [ ] Edge cases are covered
- [ ] Mocks are properly configured
- [ ] Test names are descriptive

---

## 🚀 Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:watch` | Run in watch mode |
| `npm run test:coverage` | Run with coverage report |
| `npm run test:ci` | Run for CI/CD |
| `npm test -- file.test.ts` | Run specific file |
| `npm test -- --verbose` | Verbose output |
| `npm test -- --updateSnapshot` | Update snapshots |

---

## ✅ Success Metrics

Your testing suite is healthy when:

- ✅ All tests pass consistently
- ✅ Coverage > 70% across all metrics
- ✅ Tests run in < 30 seconds
- ✅ No flaky tests
- ✅ Tests are maintainable
- ✅ Edge cases covered
- ✅ Clear test names
- ✅ Proper mocking

---

**Happy Testing! 🎉**

