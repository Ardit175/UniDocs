# UniDocs Unit Testing Summary

## Unit Test Coverage

All core logic that can be unit tested is covered:

### Backend
- **Services:**
  - MinIO service (upload, download, delete)
  - PDF service (certificate, transcript generation)
- **Middleware:**
  - Error handler
  - Rate limiter
- **Validation:**
  - Zod schemas (register, login, update, certificate, letter)

### Frontend
- **Components:**
  - Button
  - Card
  - Input
- **Context:**
  - AuthContext (login, register, logout, token handling)

## Libraries Used

### Backend
- `jest` — Test runner
- `ts-jest` — TypeScript support for Jest
- `@types/jest` — TypeScript types for Jest

### Frontend
- `vitest` — Test runner
- `@testing-library/react` — React component testing
- `@testing-library/jest-dom` — DOM matchers
- `@testing-library/user-event` — Simulate user interactions
- `jsdom` — Browser-like environment for tests

## Notes
- Route handlers and database logic require integration/E2E tests for full coverage.
- All unit-testable logic is covered and passing.
