import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
// Browser tests use visible text and user controls. Math answers are calculated
// independently from the displayed problem, not read from internal game state.
async function start(page: Page) {
  await page.goto('/');
  await expect(page.locator('.world')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Begin your adventure' }).click();
  await page.getByLabel('What should the map call you?').fill('Test explorer');
  await page.getByRole('button', { name: 'Long', exact: true }).click();
  await page.getByRole('button', { name: 'Fern outfit', exact: true }).click();
  await page.getByRole('button', { name: 'Step into the wilds' }).click();
}
async function visit(page: Page, landmark: string) {
  await page.getByRole('button', { name: `Map: The ${landmark}`, exact: true }).click();
  const interact = page.locator('.interact');
  await expect(page.locator('.dock-copy strong')).toHaveText(`The ${landmark}`, { timeout: 30000 });
  await expect(interact).toBeEnabled();
  await interact.click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
async function solveVisible(page: Page) {
  const choiceButtons = page.getByRole('button', { name: /^Choose / });
  if (await choiceButtons.count()) {
    const labels = await choiceButtons.evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute('aria-label')!.replace('Choose ', '')),
    );
    const values = labels.map((v) =>
      v.includes('/')
        ? Number(v.split('/')[0]) / Number(v.split('/')[1])
        : Number(v.replace('%', '')) / 100,
    );
    await page
      .getByRole('button', { name: `Choose ${labels[values[0] > values[1] ? 0 : 1]}`, exact: true })
      .click();
  } else {
    const prompt = await page.locator('.math-prompt').innerText(),
      numbers = prompt.match(/\d+/g)!.map(Number);
    let answer: number;
    if (prompt.includes('×')) answer = numbers[0] * numbers[1];
    else if (prompt.includes('÷')) answer = numbers[0] / numbers[1];
    else if (prompt.includes('%')) answer = (numbers[0] * numbers[1]) / 100;
    else answer = prompt.includes('area') ? numbers[0] * numbers[1] : 2 * (numbers[0] + numbers[1]);
    await page.getByLabel(/^Your answer/).fill(String(answer));
    await page.getByRole('button', { name: 'Cast the magic' }).click();
  }
  await expect(page.getByText('Beautifully done, Test explorer.')).toBeVisible();
}
test('complete expedition with hints/retries, save reload, rewards, parent metrics and new seed', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page);
  await visit(page, 'Tide Waystone');
  await page.getByRole('button', { name: /A little help/ }).click();
  await expect(page.getByText('A little guidance', { exact: true })).toBeVisible();
  // Close/reopen preserves hint evidence.
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.locator('.interact').click();
  await expect(page.getByText('A little guidance', { exact: true })).toBeVisible();
  await solveVisible(page);
  await page.getByRole('button', { name: 'Return to the wilds' }).click();
  await visit(page, 'Ember Ward');
  await page.getByLabel('Your answer', { exact: true }).fill('999999');
  await page.getByRole('button', { name: 'Cast the magic' }).click();
  await expect(page.getByText(/Not quite yet/)).toBeVisible();
  await solveVisible(page);
  await page.getByRole('button', { name: 'Return to the wilds' }).click();
  await visit(page, 'Root Shrine');
  await solveVisible(page);
  await page.getByRole('button', { name: 'Return to the wilds' }).click();
  await visit(page, 'Sunken Cache');
  await solveVisible(page);
  await page.getByRole('button', { name: 'Return to the wilds' }).click();
  await page.reload();
  await expect(page.locator('.quest-seals small')).toHaveText('3 / 3');
  await expect(page.locator('.player-card strong')).toHaveText('Test explorer');
  await visit(page, 'Jade Guardian');
  for (let stage = 0; stage < 3; stage++) {
    await solveVisible(page);
    await page
      .getByRole('button', { name: stage === 2 ? 'Discover your reward' : 'Face the next ward' })
      .click();
  }
  await expect(page.getByRole('heading', { name: 'The jungle remembers you.' })).toBeVisible();
  await page.screenshot({ path: 'test-results/expedition-complete.png' });
  await page.getByRole('button', { name: 'See what you learned' }).click();
  await expect(page.locator('.report-summary').getByText('7', { exact: true })).toBeVisible();
  await expect(page.locator('.report-summary').getByText('435', { exact: true })).toBeVisible();
  await expect(
    page.locator('.topic-row').filter({ hasText: 'Fractions & comparisons' }),
  ).toContainText('0%');
  await expect(page.locator('.topic-row').filter({ hasText: 'Multiplication' })).toContainText(
    '50%',
  );
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export progress' }).click();
  const exported = await download;
  expect(exported.suggestedFilename()).toContain('Test-explorer');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Customise explorer' }).click();
  await expect(page.getByRole('button', { name: 'Jade keeper outfit', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Jade keeper outfit', exact: true }).click();
  await page.getByRole('button', { name: 'Save your explorer' }).click();
  await page.getByRole('button', { name: 'See your discovery' }).click();
  await page.getByRole('button', { name: 'Follow a new map' }).click();
  await expect(page.locator('.region-title')).toContainText('Expedition 02');
  await expect(page.locator('.quest-seals small')).toHaveText('0 / 3');
  await expect(page.locator('.player-card')).toContainText('Level 3');
  await page.getByRole('button', { name: 'For parents' }).click();
  await page.getByLabel('Import progress file').setInputFiles((await exported.path())!);
  await expect(page.locator('.region-title')).toContainText('Expedition 01');
  await expect(page.locator('.report-summary').getByText('435', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test('settings, keyboard movement, import rejection, mobile layout and dialog focus', async ({
  page,
}) => {
  await start(page);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: /Pathfinder Larger numbers/ }).click();
  await page.getByLabel('Reduced motion').check();
  await page.getByRole('button', { name: 'Back to the adventure' }).click();
  await expect(page.locator('.region-title')).toContainText('Pathfinder');
  await expect(page.locator('main')).toHaveClass(/reduced-motion/);
  // Focus world, then check that the map marker actually moves with keyboard input.
  const marker = page.locator('.minimap svg > circle').last();
  const before = await marker.getAttribute('cy');
  await page.getByTestId('world-canvas').focus();
  await page.keyboard.down('w');
  await page.waitForTimeout(500);
  await page.keyboard.up('w');
  await expect(marker).not.toHaveAttribute('cy', before!);
  await page.getByRole('button', { name: 'For parents' }).click();
  await page
    .getByLabel('Import progress file')
    .setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"version":99}'),
    });
  await expect(page.getByRole('alert')).toContainText('not a supported Verdant save');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.touch-controls')).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeInViewport();
  await page.screenshot({ path: 'test-results/mobile-settings.png' });
  await page.getByRole('button', { name: 'Back to the adventure' }).press('Tab');
  await expect(page.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});
