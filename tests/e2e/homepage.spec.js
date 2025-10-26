/**
 * E2E Tests - Homepage
 * Tests complete user journeys on the main landing page
 */

const { test, expect } = require('@playwright/test');

test.describe('Homepage E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display page title and header', async ({ page }) => {
    await expect(page).toHaveTitle(/Early Composers Musical Catalogue/);

    const header = page.locator('h1');
    await expect(header).toContainText('Early Composers Musical Catalogue');
  });

  test('should display all tier 1 composers', async ({ page }) => {
    const composerCards = page.locator('.composer-card.tier-1');
    await expect(composerCards).toHaveCount(5);

    // Check specific composers
    await expect(page.locator('[data-composer="mozart"]')).toBeVisible();
    await expect(page.locator('[data-composer="bach"]')).toBeVisible();
    await expect(page.locator('[data-composer="handel"]')).toBeVisible();
  });

  test('should toggle tier 2 composers', async ({ page }) => {
    // Initially hidden
    const tier2Cards = page.locator('.composer-card.tier-2');
    await expect(tier2Cards.first()).toHaveClass(/hidden/);

    // Click show more
    await page.click('.btn-show-more');

    // Should be visible
    await expect(tier2Cards.first()).not.toHaveClass(/hidden/);

    // Button text should change
    const button = page.locator('.btn-show-more');
    await expect(button).toContainText('Show Less');
  });

  test('should display statistics section', async ({ page }) => {
    const statsSection = page.locator('.statistics-section');
    await expect(statsSection).toBeVisible();

    const statCards = statsSection.locator('.stat-card');
    await expect(statCards).toHaveCount(4);

    // Check stat labels
    await expect(page.locator('.stat-label').nth(0)).toContainText('Composers');
    await expect(page.locator('.stat-label').nth(1)).toContainText('Total Works');
    await expect(page.locator('.stat-label').nth(2)).toContainText('Recordings');
    await expect(page.locator('.stat-label').nth(3)).toContainText('Manuscripts');
  });

  test('should navigate to composer page when clicking explore button', async ({ page }) => {
    await page.click('[data-composer="bach"] .btn-explore');

    await expect(page).toHaveURL(/\/composers\/bach\/index.html/);

    await expect(page.locator('h1')).toContainText('Johann Sebastian Bach');
  });

  test('should display timeline section', async ({ page }) => {
    const timeline = page.locator('.timeline-section');
    await expect(timeline).toBeVisible();

    const lifespans = timeline.locator('.composer-lifespan');
    await expect(lifespans).toHaveCount(5);
  });

  test('should have functional navigation links', async ({ page }) => {
    const navLinks = page.locator('.main-nav a');
    await expect(navLinks).toHaveCount(5);

    // Click composers link
    await page.click('a[href="#composers"]');

    // Should scroll to composers section
    const composersSection = page.locator('#composers');
    await expect(composersSection).toBeInViewport();
  });

  test('should display footer with links', async ({ page }) => {
    const footer = page.locator('.main-footer');
    await expect(footer).toBeVisible();

    const footerLinks = footer.locator('a');
    await expect(footerLinks).toHaveCount.greaterThan(5);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const header = page.locator('.main-header');
    await expect(header).toBeVisible();

    const composerCards = page.locator('.composer-card');
    await expect(composerCards.first()).toBeVisible();
  });
});

test.describe('Quick Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should perform quick search', async ({ page }) => {
    const searchInput = page.locator('#quick-search');
    await searchInput.fill('Mozart Symphony');

    await page.click('.quick-search button');

    // Should redirect to search page
    await expect(page).toHaveURL(/search.html\?q=Mozart%20Symphony/);
  });

  test('should show warning for empty search', async ({ page }) => {
    const searchInput = page.locator('#quick-search');
    await searchInput.fill('');

    await page.click('.quick-search button');

    // Should show notification
    await expect(page.locator('.notification')).toBeVisible();
    await expect(page.locator('.notification')).toContainText(/enter a search term/i);
  });

  test('should trigger search on Enter key', async ({ page }) => {
    const searchInput = page.locator('#quick-search');
    await searchInput.fill('Bach Cantata');

    await searchInput.press('Enter');

    await expect(page).toHaveURL(/search.html/);
  });

  test('should show search suggestions on typing', async ({ page }) => {
    const searchInput = page.locator('#quick-search');
    await searchInput.fill('Moz');

    // Wait for suggestions to appear
    await page.waitForTimeout(400); // Debounce delay

    const suggestions = page.locator('#search-suggestions');
    await expect(suggestions).toBeVisible();
  });

  test('should select suggestion and navigate', async ({ page }) => {
    const searchInput = page.locator('#quick-search');
    await searchInput.fill('Mozart');

    await page.waitForTimeout(400);

    // Click first suggestion
    const firstSuggestion = page.locator('.suggestion-item').first();
    await firstSuggestion.click();

    // Should navigate based on suggestion type
    // (URL depends on whether it's a composer or work suggestion)
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    // Press Ctrl+K
    await page.keyboard.press('Control+k');

    const searchInput = page.locator('#quick-search');
    await expect(searchInput).toBeFocused();
  });
});

test.describe('Composer Card Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show composer preview modal on card click', async ({ page }) => {
    await page.click('[data-composer="mozart"]');

    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible();

    await expect(modal).toContainText('Wolfgang Amadeus Mozart');
    await expect(modal).toContainText('1756-1791');
  });

  test('should close modal on X button click', async ({ page }) => {
    await page.click('[data-composer="mozart"]');

    await page.click('.modal-close');

    const modal = page.locator('.modal-overlay');
    await expect(modal).not.toBeVisible();
  });

  test('should close modal on Escape key', async ({ page }) => {
    await page.click('[data-composer="mozart"]');

    await page.keyboard.press('Escape');

    const modal = page.locator('.modal-overlay');
    await expect(modal).not.toBeVisible();
  });

  test('should close modal on overlay click', async ({ page }) => {
    await page.click('[data-composer="mozart"]');

    // Click on overlay (outside modal content)
    await page.click('.modal-overlay');

    const modal = page.locator('.modal-overlay');
    await expect(modal).not.toBeVisible();
  });

  test('should navigate to composer page from modal', async ({ page }) => {
    await page.click('[data-composer="mozart"]');

    await page.click('.modal-overlay .btn-primary');

    await expect(page).toHaveURL(/\/composers\/mozart\/index.html/);
  });
});

test.describe('Statistics Animation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should animate statistics on scroll', async ({ page }) => {
    // Scroll to statistics section
    await page.locator('.statistics-section').scrollIntoViewIfNeeded();

    // Wait for animation
    await page.waitForTimeout(2000);

    // Check that numbers are displayed
    const composersStat = page.locator('.stat-number').nth(0);
    const statValue = await composersStat.textContent();

    expect(parseInt(statValue)).toBeGreaterThan(0);
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    const h2s = page.locator('h2');
    await expect(h2s).toHaveCount.greaterThan(0);
  });

  test('should have alt text for images', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.keyboard.press('Tab');

    // First focusable element should be focused
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused);
  });
});
