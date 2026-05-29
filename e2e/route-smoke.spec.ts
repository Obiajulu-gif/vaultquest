import { expect, test, type Page } from '@playwright/test';

type SmokeRoute = {
  name: string;
  path: string;
  expectedContent: RegExp;
  requiresDisconnectedWalletState?: boolean;
};

const publicRoutes: SmokeRoute[] = [
  {
    name: 'marketing landing page',
    path: '/',
    expectedContent: /VaultQuest|Launch DApp/i,
  },
];

const appRoutes: SmokeRoute[] = [
  {
    name: 'app dashboard',
    path: '/app',
    expectedContent: /Start Saving|Dashboard|VaultQuest/i,
    requiresDisconnectedWalletState: true,
  },
  {
    name: 'prizes index',
    path: '/app/prizes',
    expectedContent: /Prizes|Prize Pools|VaultQuest/i,
    requiresDisconnectedWalletState: true,
  },
  {
    name: 'vaults index',
    path: '/app/vaults',
    expectedContent: /Vaults|Manage Vaults|VaultQuest/i,
    requiresDisconnectedWalletState: true,
  },
];

const routeLevelCrashPatterns = [
  /Application error/i,
  /Unhandled Runtime Error/i,
  /This page could not be found/i,
  /404(?:\s|$)/i,
  /500(?:\s|$)/i,
];

async function mockDisconnectedWalletAndNetwork(page: Page) {
  await page.addInitScript(() => {
    const walletWindow = window as Window & {
      freighterApi?: {
        isAllowed: () => Promise<boolean>;
        isConnected: () => Promise<boolean>;
        getPublicKey: () => Promise<null>;
      };
    };

    window.localStorage.clear();
    window.sessionStorage.clear();

    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: undefined,
    });

    Object.defineProperty(walletWindow, 'freighterApi', {
      configurable: true,
      value: {
        isAllowed: async () => false,
        isConnected: async () => false,
        getPublicKey: async () => null,
      },
    });
  });

  await page.route(/\/api\//, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        account: null,
        actions: [],
        entries: [],
        pools: [],
        prizes: [],
        quests: [],
        walletConnected: false,
      }),
    });
  });
}

async function expectRouteToRender(page: Page, route: SmokeRoute) {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

  expect(
    response,
    `${route.name} (${route.path}) should return a document response`,
  ).not.toBeNull();
  expect(
    response?.status(),
    `${route.name} (${route.path}) should return a successful document response`,
  ).toBeLessThan(400);

  await expect(
    page.locator('body'),
    `${route.name} (${route.path}) should render a non-empty page body`,
  ).not.toBeEmpty();

  await expect(
    page.locator('body'),
    `${route.name} (${route.path}) should show route-specific content`,
  ).toContainText(route.expectedContent);

  for (const pattern of routeLevelCrashPatterns) {
    await expect(
      page.locator('body'),
      `${route.name} (${route.path}) should not show ${pattern.toString()}`,
    ).not.toContainText(pattern);
  }

  expect(
    pageErrors,
    `${route.name} (${route.path}) should not throw route-level runtime errors`,
  ).toEqual([]);
}

test.describe('route smoke tests', () => {
  for (const route of publicRoutes) {
    test(`${route.name} renders at ${route.path}`, async ({ page }) => {
      await expectRouteToRender(page, route);
    });
  }

  for (const route of appRoutes) {
    test(
      `${route.name} renders at ${route.path} with no wallet connected`,
      async ({ page }) => {
        await mockDisconnectedWalletAndNetwork(page);
        await expectRouteToRender(page, route);

        if (route.requiresDisconnectedWalletState) {
          await expect(
            page.locator('body'),
            `${route.name} (${route.path}) should expose a disconnected-wallet or app-start state`,
          ).toContainText(
            /Connect Wallet|wallet not connected|Start Saving|Manage Vaults|View All Prizes/i,
          );
        }
      },
    );
  }
});
