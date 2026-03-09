# Testing

## Unit Tests

Tests are written with Vitest and live in the `tests/` directory.

**Run all tests:**
```
npm test
```

**Watch mode:**
```
npm run test:watch
```

**With coverage:**
```
npm run test:coverage
```

### Test Coverage

| Module | File | What's Tested |
|--------|------|---------------|
| TSR-G Matrix | `tsrg-matrix.test.ts` | Manual scores, algorithmic scoring, tier boundaries, helper functions |
| Security | `security.test.ts` | Input sanitization, character name validation, server name validation |
| Storage | `storage.test.ts` | Character CRUD, preferences, achievement cache, recent searches, storage info |

### Writing Tests

Tests follow the pattern:
```typescript
import { describe, it, expect } from 'vitest';
import { functionUnderTest } from '@/lib/module';

describe('functionUnderTest', () => {
  it('describes expected behavior', () => {
    expect(functionUnderTest(input)).toBe(expectedOutput);
  });
});
```

The test setup (`tests/setup.ts`) provides a localStorage mock for storage tests.

## QA Dashboard

Available at `/dev/tests` in development mode. This is an in-app tool for manual QA tracking.

**Features:**
- Add test cases grouped by feature area
- Mark each test as pass, fail, pending, or skipped
- Add notes to test cases
- View analytics event summary
- Data persisted in Supabase `qa_test_cases` table

The dashboard is not accessible in production builds.
