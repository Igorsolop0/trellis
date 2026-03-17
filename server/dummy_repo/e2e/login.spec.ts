import { test, expect } from '@playwright/test';

test('User can login with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'topsecret');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
});
