# VaultQuest Testing Guide

This document outlines the testing infrastructure and how to contribute tests.

## Testing Stack

- **Vitest**: Unit and Integration tests for components and hooks.
- **React Testing Library**: UI testing utilities.
- **Playwright**: E2E, Responsive, and Accessibility testing.
- **Axe Core**: Automated accessibility audits.

## Running Tests

### Unit & Integration (Vitest)

```bash
npm test
```

To run in watch mode:
```bash
npm run test:watch
```

### E2E & Quality Gates (Playwright)

Make sure the dev server is running (or it will be started automatically):

```bash
npx playwright test
```

To see the test results UI:
```bash
npx playwright test --ui
```

## Mocking Wallet States

We use `wagmi` mocks in `tests/mocks/wagmi.ts`. You can override these in individual tests to simulate different states:

```typescript
import { mockWagmiHooks } from '@/tests/mocks/wagmi';

it('shows error state', () => {
  mockWagmiHooks.useAccount.mockReturnValue({ status: 'error', message: 'Failed to connect' });
  render(<MyComponent />);
  // ...
});
```

## Accessibility (A11y)

E2E tests include automated `axe-core` checks. Ensure all new pages or major UI changes are covered by a Playwright test with `checkA11y`.

## Responsive Design

Playwright is configured to run tests across multiple viewports (Chromium, Webkit, Mobile Chrome, Mobile Safari). Use `isMobile` flag in Playwright tests to handle breakpoint-specific logic.
