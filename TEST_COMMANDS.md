# 🧪 Test Commands Quick Reference

## Basic Commands

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Watch Mode (Auto-rerun on file changes)
```bash
npm run test:watch
```

### CI Mode (for automated pipelines)
```bash
npm run test:ci
```

---

## Specific Test Commands

### Run Specific Test File
```bash
npm test -- discounts.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should create"
```

### Run Tests in Specific Directory
```bash
npm test -- __tests__/api/
```

---

## Advanced Options

### Verbose Output
```bash
npm test -- --verbose
```

### Silent Mode (only show failures)
```bash
npm test -- --silent
```

### Run Only Changed Tests
```bash
npm test -- --onlyChanged
```

### Update Snapshots
```bash
npm test -- --updateSnapshot
```

### Run Tests Sequentially (not in parallel)
```bash
npm test -- --runInBand
```

### Maximum Workers (for parallel execution)
```bash
npm test -- --maxWorkers=4
```

---

## Coverage Commands

### Generate HTML Coverage Report
```bash
npm run test:coverage
```

Then open: `coverage/lcov-report/index.html`

### Coverage for Specific Files
```bash
npm test -- --coverage --collectCoverageFrom="src/app/api/discounts/**/*.ts"
```

### Coverage Summary Only
```bash
npm test -- --coverage --coverageReporters=text-summary
```

---

## Debugging Commands

### Debug Single Test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand your-test-file.test.ts
```

### Debug with VS Code
1. Set breakpoint in test file
2. Press F5 (or Run > Start Debugging)
3. Select "Jest Debug" configuration

### Show All Tests Without Running
```bash
npm test -- --listTests
```

### Clear Jest Cache
```bash
npm test -- --clearCache
```

---

## Test by Category

### API Tests Only
```bash
npm test -- __tests__/api/
```

### Component Tests Only
```bash
npm test -- __tests__/components/
```

### Model Tests Only
```bash
npm test -- __tests__/models/
```

### Hook Tests Only
```bash
npm test -- __tests__/hooks/
```

---

## CI/CD Commands

### Pre-commit Hook
```bash
npm test -- --bail --findRelatedTests
```

### GitHub Actions
```bash
npm run test:ci
```

### With Environment Variables
```bash
NODE_ENV=test npm test
```

---

## Performance Commands

### Find Slow Tests
```bash
npm test -- --verbose --testTimeout=1000
```

### Profile Test Execution
```bash
npm test -- --logHeapUsage
```

### Test Performance Monitoring
```bash
npm test -- --detectOpenHandles
```

---

## Output Options

### JSON Output
```bash
npm test -- --json --outputFile=test-results.json
```

### JUnit XML Output (for CI tools)
```bash
npm test -- --reporters=jest-junit
```

### Custom Reporter
```bash
npm test -- --reporters=default --reporters=jest-html-reporter
```

---

## Watch Mode Commands

Once in watch mode, press:

- `p` - Filter by file name pattern
- `t` - Filter by test name pattern
- `a` - Run all tests
- `f` - Run only failed tests
- `o` - Run only tests related to changed files
- `q` - Quit watch mode
- `Enter` - Trigger test run

---

## Coverage Threshold Commands

### Check Specific Threshold
```bash
npm test -- --coverage --coverageThreshold='{"global":{"lines":80}}'
```

### Per-File Threshold
```bash
npm test -- --coverage --coverageThreshold='{"./src/app/api/": {"lines": 90}}'
```

---

## Troubleshooting Commands

### If Tests are Failing

1. **Clear cache and retry:**
```bash
npm test -- --clearCache
npm test
```

2. **Run tests sequentially:**
```bash
npm test -- --runInBand
```

3. **Check for open handles:**
```bash
npm test -- --detectOpenHandles
```

4. **Force exit after tests:**
```bash
npm test -- --forceExit
```

---

## View Test Results Dashboard

```
http://localhost:3000/admin/test-results
```

Features:
- ✅ Pass/fail statistics
- 📊 Coverage metrics
- 📈 Visual progress bars
- 🎯 Test-by-test breakdown
- 🔄 Run tests button

---

## Example Workflow

### During Development
```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Watch tests
npm run test:watch
```

### Before Commit
```bash
# Run all tests with coverage
npm run test:coverage

# Check for linting errors
npm run lint
```

### Before Push
```bash
# Run full test suite
npm run test:ci
```

---

## Quick Tips

1. **Use watch mode** during development for instant feedback
2. **Run coverage regularly** to ensure high code quality
3. **Name tests descriptively** for easy debugging
4. **Keep tests fast** - mock external dependencies
5. **Test edge cases** not just happy paths
6. **Update snapshots** when UI changes are intentional

---

## Coverage Interpretation

### Coverage Percentage Guide

- **90-100%**: Excellent ✨
- **80-89%**: Good ✅
- **70-79%**: Acceptable ⚠️
- **Below 70%**: Needs improvement ❌

### What Each Metric Means

- **Lines**: Percentage of code lines executed
- **Statements**: Percentage of statements executed
- **Functions**: Percentage of functions called
- **Branches**: Percentage of code branches taken (if/else, switch)

---

## Common Issues & Solutions

### Issue: Tests timing out
```bash
npm test -- --testTimeout=10000
```

### Issue: Out of memory
```bash
NODE_OPTIONS=--max_old_space_size=4096 npm test
```

### Issue: Port already in use
```bash
# Kill process on port
npx kill-port 3000
npm test
```

---

**Need Help?** Check `TESTING_DOCUMENTATION.md` for detailed guides!

