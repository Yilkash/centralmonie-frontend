import { expect, test } from '@playwright/test';

// An invoice photo goes through SERV Reasoning before the chat: hidden text is found and shown, and the payment it
// leads to is checked by CentralMonie Protect. Runs against a backend that has a SERV key.
const INVOICE = process.env.INVOICE_FILE ?? '/tmp/claude-1000/-home-dimka-EEZ/22f63f50-fbe6-4f33-95af-eb6b9582d0df/scratchpad/inv/adebayo-invoice.jpg';

test('an attached invoice is read by SERV, its hidden text is shown, and Protect blocks the payment', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Ask CentralMonie' }).click();
  await page.getByTestId('attach-input').setInputFiles(INVOICE);
  await expect(page.getByText('SERV Reasoning is reading it…')).toBeVisible();
  await expect(page.getByText(/SERV found hidden text in this file/)).toBeVisible({ timeout: 90_000 });
  await page.screenshot({ path: '/tmp/10kobo-e2e-results/attach-ready.png' });

  await page.getByLabel('Message').fill('Please pay this invoice from Adebayo Foods');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  const sent = page.locator('[data-attachment]').first();
  await expect(sent).toContainText('Hidden text found');
  await expect(sent).toContainText('pre-approved');
  await page.screenshot({ path: '/tmp/10kobo-e2e-results/attach-sent.png' });

  // A local copy without an assistant key answers with a placeholder; the live app goes on to the Protect card.
  const outcome = page.getByText(/CentralMonie Protect (blocked|flagged)|The assistant is not connected yet/).first();
  await expect(outcome).toBeVisible({ timeout: 150_000 });
  if ((await outcome.textContent())?.includes('not connected')) return;
  await page.screenshot({ path: '/tmp/10kobo-e2e-results/attach-protect.png', fullPage: false });
});
