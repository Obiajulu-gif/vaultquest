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

  test('Account page renders charts, filters transactions, and is accessible', async ({ page }) => {
    await page.goto('/app/account?mockConnected=true');
    
    // Check main elements
    await expect(page.locator('text=Your profile')).toBeVisible();
    await expect(page.locator('text=Deposit Allocation')).toBeVisible();
    await expect(page.locator('text=Savings Progression')).toBeVisible();
    await expect(page.locator('text=Past transactions')).toBeVisible();
    
    // Verify that the USDC button is present in the allocation card legend and click it
    const usdcBtn = page.locator('button:has-text("USDC")');
    await expect(usdcBtn).toBeVisible();
    await usdcBtn.click();
    
    // Verify that the clearable badge is displayed in the transaction table
    await expect(page.locator('text=Asset: USDC')).toBeVisible();
    
    // Click the clear filter button on the badge
    const clearBtn = page.locator('button[aria-label="Clear USDC filter"]');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    
    // Verify that the badge is removed
    await expect(page.locator('text=Asset: USDC')).not.toBeVisible();
    
    // Accessibility check using Axe
    await injectAxe(page);
    await checkA11y(page);
  });
});
