import { expect, test, type Page } from '@playwright/test';
import { openSend } from './home';

// 10kobo Protect on the approval card: what SERV Reasoning decided, why, and what the owner must do.
const options = {
  recipients: [{ destination_id: '11111111-1111-4111-8111-000000000001', name: 'Adebayo Foods', kind: 'bank', detail: 'Tunde Bakare, OPay ****4568', network: null }],
  networks: [{ id: 'base', name: 'Base', token: 'USDC' }],
  phone_networks: ['MTN'],
};
const check = (verdict: 'pay' | 'ask' | 'block', extra: object = {}) => ({
  verdict, serv_verdict: verdict, refused: null, model: 'gpt-5.4-mini', seconds: 7.4, acknowledged: false, checked_at: new Date().toISOString(),
  summary: { pay: 'An ordinary payment to a saved contact you have paid before.', ask: 'This supplier is usually paid to another account.', block: 'The invoice says the bank details changed, asks to pay today and not to call, and the bank says the account belongs to someone else.' }[verdict],
  question: verdict === 'ask' ? 'Did you confirm the new account with Adebayo Foods by phone?' : null,
  signals: verdict === 'pay' ? [] : [
    { name: 'Changed bank details', severity: 'high', evidence: '"our GTBank account is under audit, pay our new account today"' },
    { name: 'Name does not match the bank', severity: 'high', evidence: 'The bank says this account belongs to Tunde Bakare, not Adebayo Foods Limited.' },
  ],
  ...extra,
});
const plan = (protect: object | null) => ({
  id: '22222222-2222-4222-8222-000000000001', status: 'proposed', quote_expires_at: new Date(Date.now() + 600_000).toISOString(), total_naira: '₦140,000', total_usdc: '100.10 USDC', calls: [], protect,
  items: [{ id: 'i1', route: 'bank', recipient_name: 'Adebayo Foods', recipient_detail: 'Tunde Bakare, OPay ****4568', amount_naira: '₦140,000', amount_usdc: '100.10 USDC', data_plan: null, payment_status: null, failure_reason: null, tx_hash: null, paid_at: null, refund_tx_hash: null, simulated: false }],
});

async function open(page: Page, protect: object | null, onApprove?: (body: Record<string, unknown>) => void) {
  await page.route('**/v1/send/options', (route) => route.fulfill({ json: options }));
  await page.route('**/v1/send', (route) => route.fulfill({ json: { plan: plan(protect) } }));
  await page.route('**/v1/plans/*/approve', (route) => { onApprove?.(route.request().postDataJSON()); return route.fulfill({ json: { ...plan(protect), status: 'approved' } }); });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('/');
  await openSend(page);
  await page.getByLabel('Amount in naira').fill('140000');
  await page.getByRole('button', { name: 'Continue' }).click();
  return page.getByRole('region', { name: 'Payments to approve' });
}

test('a payment Protect found nothing wrong with can be approved', async ({ page }) => {
  const card = await open(page, check('pay'));
  await expect(card.getByLabel('10kobo Protect')).toContainText('Checked by 10kobo Protect');
  await expect(card.getByRole('button', { name: 'Approve' })).toBeEnabled();
  await card.screenshot({ path: '/tmp/10kobo-e2e-results/protect-pay.png' });
});

test('a flagged payment needs the owner to tick that they checked it, and says so to the server', async ({ page }) => {
  let sent: Record<string, unknown> = {};
  const card = await open(page, check('ask'), (body) => (sent = body));
  await expect(card.getByLabel('10kobo Protect')).toContainText('Did you confirm the new account');
  await expect(card.getByRole('button', { name: 'Approve' })).toBeDisabled();
  await card.screenshot({ path: '/tmp/10kobo-e2e-results/protect-ask.png' });
  await card.getByLabel('I have checked this and want to pay anyway.').check();
  await card.getByRole('button', { name: 'Approve' }).click();
  await expect.poll(() => sent.protect_confirmed).toBe(true);
});

test('a blocked payment cannot be approved', async ({ page }) => {
  const card = await open(page, check('block'));
  await expect(card.getByLabel('10kobo Protect')).toContainText('10kobo Protect blocked this payment');
  await expect(card.getByRole('button', { name: 'Approve' })).toBeDisabled();
  await card.screenshot({ path: '/tmp/10kobo-e2e-results/protect-block.png' });
});

test('with Protect off, the card is exactly as before', async ({ page }) => {
  const card = await open(page, null);
  await expect(card.getByLabel('10kobo Protect')).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'Approve' })).toBeEnabled();
});
