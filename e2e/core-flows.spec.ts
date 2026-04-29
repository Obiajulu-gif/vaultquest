import { test, expect } from '@playwright/test';
import { checkA11y, injectAxe } from 'axe-playwright';

test.describe('Core Page Flows', () => {
  test('Landing page renders and is accessible', async ({ page }) => {
    await page.goto('/');
    
    // Check main elements
    await expect(page.locator('text=VaultQuest')).toBeVisible();
    await expect(page.locator('text=Launch DApp')).toBeVisible();
    
    // Accessibility check
    await injectAxe(page);
    await checkA11y(page);
  });

  test('App Dashboard responsive layout', async ({ page, isMobile }) => {
    await page.goto('/app');
    
    if (isMobile) {
      // Check mobile menu exists
      await expect(page.locator('button[aria-label="Toggle menu"]')).toBeVisible();
    } else {
      // Check desktop links exist
      await expect(page.locator('nav >> text=Prizes')).toBeVisible();
    }
  });

  test('Wallet connection state placeholders', async ({ page }) => {
    await page.goto('/app');
    
    const startSavingBtn = page.locator('text=Start Saving');
    await expect(startSavingBtn).toBeVisible();
    
    await startSavingBtn.click();
    
    // Should show prizes/vault buttons after click (based on current placeholder logic)
    await expect(page.locator('text=View All Prizes')).toBeVisible();
    await expect(page.locator('text=Manage Vaults')).toBeVisible();
  });
});
