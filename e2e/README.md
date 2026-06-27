# E2E Tests Documentation

This directory contains end-to-end tests for VaultQuest using Playwright.

## Test Files

### `wallet-disconnect.spec.ts`
Tests wallet disconnection scenarios and verifies UI updates correctly when the wallet is disconnected.

**Test Coverage:**
- Dashboard updates after wallet disconnect
- Account page shows connect prompt after disconnect
- Activity page shows connect prompt when disconnected
- Vault detail page shows connect prompt when wallet disconnected
- Header wallet status updates on disconnect
- Disconnected state persists across navigation
- Reconnect guidance appears after disconnect
- Wallet address is removed from UI after disconnect
- Balance information is removed after disconnect
- Connect wallet button functionality after disconnect

### `core-flows.spec.ts`
Tests core user flows including landing page, dashboard, wallet connection, and account page functionality.

### `route-smoke.spec.ts`
Smoke tests for critical application routes.

## Helpers

### `helpers/wallet-mock.ts`
Provides utilities for mocking wallet connections in tests:

- `injectMockWallet(page, address?)` - Injects a mock Ethereum wallet into the page
- `simulateWalletDisconnect(page)` - Simulates wallet disconnection events

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode
npx playwright test --ui

# Run specific test file
npx playwright test e2e/wallet-disconnect.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Debug tests
npx playwright test --debug

# Run tests matching a specific name
npx playwright test -g "Dashboard shows connect wallet button"
```

## Test Structure

Tests follow these patterns:

1. **Setup**: Navigate to the page and optionally connect wallet
2. **Action**: Perform the action being tested (e.g., disconnect wallet)
3. **Assertion**: Verify the UI updated correctly

## Best Practices

- Use helper functions for common actions (connect/disconnect wallet)
- Use descriptive test names that explain what is being tested
- Use appropriate timeouts for async operations
- Verify both positive (element visible) and negative (element not visible) cases
- Test across different pages to ensure state consistency
- Clean up state between tests (Playwright does this automatically)

## Debugging Tips

- Use `await page.pause()` to pause execution and inspect the page
- Use `--headed` flag to see the browser
- Use `--debug` flag to step through tests
- Check screenshots in `test-results/` directory after test failures
- Use `page.screenshot()` to capture specific moments during test execution

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

See `.github/workflows/frontend.yml` for CI configuration.
