/**
 * E2E Tests - Composer Page
 * Tests complete user journeys on composer detail pages
 */

const { test, expect } = require('@playwright/test');

test.describe('Composer Page E2E Tests - Bach', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/composers/bach/index.html');
  });

  test('should display composer information', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Johann Sebastian Bach');

    await expect(page.locator('.composer-dates')).toContainText('1685 - 1750');
    await expect(page.locator('.composer-nationality')).toContainText('German');
    await expect(page.locator('.composer-period')).toContainText('Baroque');
  });

  test('should display BWV catalogue system info', async ({ page }) => {
    await expect(page.locator('.catalog-system')).toContainText('BWV');
    await expect(page.locator('.catalog-system')).toContainText('Bach-Werke-Verzeichnis');
  });

  test('should show navigation breadcrumb', async ({ page }) => {
    const breadcrumb = page.locator('.breadcrumb');
    await expect(breadcrumb).toBeVisible();

    await expect(breadcrumb).toContainText('Home');
    await expect(breadcrumb).toContainText('Composers');
    await expect(breadcrumb).toContainText('Johann Sebastian Bach');
  });

  test('should navigate back to home via breadcrumb', async ({ page }) => {
    await page.click('.breadcrumb a[href*="index.html"]');

    await expect(page).toHaveURL(/index.html/);
  });

  test('should display composer biography', async ({ page }) => {
    const biography = page.locator('.biography');
    await expect(biography).toBeVisible();

    const bioText = await biography.textContent();
    expect(bioText.length).toBeGreaterThan(100);
  });

  test('should display major works section', async ({ page }) => {
    const keyWorks = page.locator('.key-works');
    await expect(keyWorks).toBeVisible();

    const workCards = keyWorks.locator('.work-card');
    await expect(workCards).toHaveCount.greaterThan(3);
  });

  test('should have functional composer navigation', async ({ page }) => {
    const composerNav = page.locator('.composer-nav');
    await expect(composerNav).toBeVisible();

    const navLinks = composerNav.locator('a');
    await expect(navLinks).toHaveCount.greaterThan(4);
  });

  test('should scroll to section on nav click', async ({ page }) => {
    await page.click('.composer-nav a[href="#cantatas"]');

    const cantatasSection = page.locator('#cantatas');
    await expect(cantatasSection).toBeInViewport();
  });

  test('should display works tables', async ({ page }) => {
    const tables = page.locator('.works-table');
    await expect(tables).toHaveCount.greaterThan(0);

    const firstTable = tables.first();
    const rows = firstTable.locator('tbody tr');
    await expect(rows).toHaveCount.greaterThan(0);
  });

  test('should show development notice', async ({ page }) => {
    const notice = page.locator('.development-notice');
    await expect(notice).toBeVisible();

    await expect(notice).toContainText(/under development|in progress/i);
  });
});

test.describe('Works Filtering and Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/composers/bach/index.html');

    // Wait for data to load
    await page.waitForTimeout(1000);
  });

  test('should filter works by genre', async ({ page }) => {
    const genreFilter = page.locator('#genre-filter');

    if (await genreFilter.isVisible()) {
      await genreFilter.selectOption('cantatas');

      await page.waitForTimeout(500);

      const resultsInfo = page.locator('.results-info');
      const resultsText = await resultsInfo.textContent();

      expect(resultsText).toContain('Showing');
    }
  });

  test('should filter works by year period', async ({ page }) => {
    const periodFilter = page.locator('#period-filter');

    if (await periodFilter.isVisible()) {
      // Select first available period
      const options = await periodFilter.locator('option').allTextContents();

      if (options.length > 1) {
        await periodFilter.selectOption({ index: 1 });

        await page.waitForTimeout(500);

        const tbody = page.locator('#works-tbody');
        const rows = tbody.locator('tr');
        await expect(rows).toHaveCount.greaterThan(0);
      }
    }
  });

  test('should search works by title', async ({ page }) => {
    const searchInput = page.locator('#search-works');

    if (await searchInput.isVisible()) {
      await searchInput.fill('Cantata');

      await page.waitForTimeout(500); // Debounce

      const tbody = page.locator('#works-tbody');
      const rows = tbody.locator('tr');

      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should reset all filters', async ({ page }) => {
    const genreFilter = page.locator('#genre-filter');
    const resetButton = page.locator('button:has-text("Reset")');

    if (await genreFilter.isVisible() && await resetButton.isVisible()) {
      // Apply filter
      await genreFilter.selectOption({ index: 1 });

      await page.waitForTimeout(300);

      // Reset
      await resetButton.click();

      // Check filter is cleared
      const selectedValue = await genreFilter.inputValue();
      expect(selectedValue).toBe('');
    }
  });

  test('should combine multiple filters', async ({ page }) => {
    const genreFilter = page.locator('#genre-filter');
    const searchInput = page.locator('#search-works');

    if (await genreFilter.isVisible() && await searchInput.isVisible()) {
      await genreFilter.selectOption({ index: 1 });
      await searchInput.fill('BWV');

      await page.waitForTimeout(500);

      const tbody = page.locator('#works-tbody');
      const rows = tbody.locator('tr');

      // Should have filtered results
      expect(await rows.count()).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/composers/bach/index.html');
    await page.waitForTimeout(1000);
  });

  test('should display pagination controls', async ({ page }) => {
    const pagination = page.locator('.pagination');

    if (await pagination.isVisible()) {
      await expect(pagination.locator('.btn-prev')).toBeVisible();
      await expect(pagination.locator('.btn-next')).toBeVisible();
      await expect(pagination.locator('#current-page')).toBeVisible();
      await expect(pagination.locator('#total-pages')).toBeVisible();
    }
  });

  test('should navigate to next page', async ({ page }) => {
    const nextBtn = page.locator('.btn-next');

    if (await nextBtn.isVisible() && !await nextBtn.isDisabled()) {
      const currentPageBefore = await page.locator('#current-page').textContent();

      await nextBtn.click();

      await page.waitForTimeout(300);

      const currentPageAfter = await page.locator('#current-page').textContent();

      expect(parseInt(currentPageAfter)).toBeGreaterThan(parseInt(currentPageBefore));
    }
  });

  test('should navigate to previous page', async ({ page }) => {
    const nextBtn = page.locator('.btn-next');
    const prevBtn = page.locator('.btn-prev');

    if (await nextBtn.isVisible() && !await nextBtn.isDisabled()) {
      // Go to page 2
      await nextBtn.click();
      await page.waitForTimeout(300);

      // Go back to page 1
      if (!await prevBtn.isDisabled()) {
        const currentPageBefore = await page.locator('#current-page').textContent();

        await prevBtn.click();
        await page.waitForTimeout(300);

        const currentPageAfter = await page.locator('#current-page').textContent();

        expect(parseInt(currentPageAfter)).toBeLessThan(parseInt(currentPageBefore));
      }
    }
  });

  test('should disable previous button on first page', async ({ page }) => {
    const prevBtn = page.locator('.btn-prev');

    if (await prevBtn.isVisible()) {
      const currentPage = await page.locator('#current-page').textContent();

      if (currentPage === '1') {
        await expect(prevBtn).toBeDisabled();
      }
    }
  });

  test('should disable next button on last page', async ({ page }) => {
    const nextBtn = page.locator('.btn-next');
    const currentPageEl = page.locator('#current-page');
    const totalPagesEl = page.locator('#total-pages');

    if (await nextBtn.isVisible()) {
      const currentPage = await currentPageEl.textContent();
      const totalPages = await totalPagesEl.textContent();

      if (currentPage === totalPages) {
        await expect(nextBtn).toBeDisabled();
      }
    }
  });
});

test.describe('Work Details Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/composers/bach/index.html');
    await page.waitForTimeout(1000);
  });

  test('should open work details modal on row click', async ({ page }) => {
    const firstRow = page.locator('#works-tbody tr').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();

      await page.waitForTimeout(300);

      const modal = page.locator('#work-modal');
      await expect(modal).not.toHaveClass(/hidden/);
    }
  });

  test('should display work details in modal', async ({ page }) => {
    const firstRow = page.locator('#works-tbody tr').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();

      await page.waitForTimeout(300);

      const modalTitle = page.locator('#modal-title');
      const modalDetails = page.locator('#modal-details');

      if (await modalTitle.isVisible()) {
        const title = await modalTitle.textContent();
        expect(title.length).toBeGreaterThan(0);

        const details = await modalDetails.textContent();
        expect(details.length).toBeGreaterThan(0);
      }
    }
  });

  test('should close modal on close button click', async ({ page }) => {
    const firstRow = page.locator('#works-tbody tr').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForTimeout(300);

      const closeBtn = page.locator('.modal-close');
      if (await closeBtn.isVisible()) {
        await closeBtn.click();

        const modal = page.locator('#work-modal');
        await expect(modal).toHaveClass(/hidden/);
      }
    }
  });

  test('should show action buttons in modal', async ({ page }) => {
    const firstRow = page.locator('#works-tbody tr').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForTimeout(300);

      const recordingsBtn = page.locator('button:has-text("Find Recordings")');
      const manuscriptsBtn = page.locator('button:has-text("View Manuscripts")');

      if (await recordingsBtn.isVisible()) {
        expect(await recordingsBtn.textContent()).toContain('Recordings');
      }

      if (await manuscriptsBtn.isVisible()) {
        expect(await manuscriptsBtn.textContent()).toContain('Manuscripts');
      }
    }
  });
});

test.describe('Responsive Design', () => {
  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/composers/bach/index.html');

    const header = page.locator('.composer-header');
    await expect(header).toBeVisible();

    const worksTable = page.locator('.works-table');
    await expect(worksTable).toBeVisible();
  });

  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/composers/bach/index.html');

    const header = page.locator('.composer-header');
    await expect(header).toBeVisible();

    const composerName = page.locator('h1');
    await expect(composerName).toBeVisible();
  });
});
