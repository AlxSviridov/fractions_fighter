import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Answers come only from the rendered question, never the generator or save.
async function createHero(page: Page, name: string, avatar = 'The Mooncat') {
  await page.getByRole('button', { name: 'New game', exact: true }).click();
  await page.getByRole('button', { name: avatar, exact: true }).click();
  await page.getByLabel('Your hero’s name').fill(name);
  await page.getByRole('button', { name: 'Enter Haven', exact: true }).click();
  await expect(page.locator('.world')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('heading', { name: 'Haven', exact: true })).toBeVisible();
  await expect(page.locator('.ff-player')).toContainText(name);
}
async function approach(page: Page, enemy: string) {
  await page
    .locator('.enemy-tracker')
    .getByRole('button', { name: new RegExp(`^${enemy}`) })
    .click();
  await expect(page.locator('.combat-choice h2')).toHaveText(enemy, { timeout: 30000 });
}
async function cast(page: Page, action: 'Quick strike' | 'Power skill' | 'Ancient ritual') {
  await page
    .locator('.combat-choice')
    .getByRole('button', { name: new RegExp(`^${action}`) })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
async function quickAnswer(page: Page) {
  const [left, right] = await page.locator('.rune-fall-card > span').allTextContents();
  function rational(value: string): [number, number] {
    if (value.endsWith('%')) return [Number(value.slice(0, -1)), 100];
    const [n, d] = value.split('/').map(Number);
    return [n, d];
  }
  const [a, b] = rational(left),
    [c, d] = rational(right);
  return a * d < c * b ? '<' : a * d > c * b ? '>' : '=';
}
async function solve(page: Page) {
  if (await page.locator('.rune-fall-card').count()) {
    await page
      .getByRole('button', { name: `Answer ${await quickAnswer(page)}`, exact: true })
      .click();
  } else {
    const prompt = await page.locator('.math-prompt').innerText();
    const numbers = prompt.match(/\d+/g)!.map(Number);
    let answer: number;
    if (prompt.includes('×')) answer = numbers[0] * numbers[1];
    else if (prompt.includes('÷')) answer = numbers[0] / numbers[1];
    else if (prompt.includes('%')) answer = (numbers[0] * numbers[1]) / 100;
    else if (prompt.includes('area')) answer = numbers[0] * numbers[1];
    else if (prompt.includes('perimeter')) answer = 2 * (numbers[0] + numbers[1]);
    else throw new Error(`No independent answer strategy for ${prompt}`);
    await expect(page.getByLabel(/^Your answer/)).toBeFocused();
    await page.getByLabel(/^Your answer/).fill(String(answer));
    await page.getByLabel(/^Your answer/).press('Enter');
  }
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.impact-banner')).toHaveCount(0);
}

test('complete expedition, supported quick maths, equipment, quest reward and save transfer', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await createHero(page, 'Rune Tester');
  await page.getByRole('button', { name: 'Enter the wilds', exact: true }).click();
  await expect(page.locator('.enemy-tracker').getByRole('button', { name: / HP$/ })).toHaveCount(5);
  await approach(page, 'Bramble Prowler');
  await cast(page, 'Quick strike');
  const answer = await quickAnswer(page);
  await page
    .getByRole('button', { name: `Answer ${answer === '<' ? '>' : '<'}`, exact: true })
    .click();
  await expect(page.locator('.rune-feedback')).toContainText('Try again');
  await expect(page.locator('.health-orb strong')).not.toHaveText('100');
  await page.getByRole('button', { name: /Show a hint/ }).click();
  await expect(page.locator('.hint-box')).toBeVisible();
  await solve(page);
  await cast(page, 'Power skill');
  await solve(page);
  await expect(page.locator('.loot-notification')).toContainText('Tidefang');
  await expect(page.locator('.loot-notification')).toContainText('Attack 12 → 14');
  await page.getByRole('button', { name: 'Inspect', exact: true }).click();
  await expect(page.locator('.upgrade-comparison')).toHaveText('Total attack: 12 → 14');
  await page.getByRole('button', { name: 'Equip Tidefang', exact: true }).click();
  await expect(page.locator('.inventory-stats')).toContainText('14 Attack');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  for (const enemy of ['Canopy Raider', 'Thornback Boar', 'Corsair Lookout', 'Shard Guardian']) {
    await approach(page, enemy);
    await cast(page, 'Ancient ritual');
    await solve(page);
    await expect(page.locator('.loot-notification')).toBeVisible();
    await page.getByRole('button', { name: 'Equip now', exact: true }).click();
    await expect(
      page.locator('.enemy-tracker').getByRole('button', { name: `${enemy} CLEARED`, exact: true }),
    ).toBeDisabled();
  }
  await expect(page.locator('.ff-quest')).toContainText('5 / 5 threats overcome');
  await page.getByRole('button', { name: 'Return to Haven', exact: true }).click();
  await page.getByRole('button', { name: /Speak to Mira/ }).click();
  await page.getByRole('button', { name: 'Claim Mira’s reward', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Claim Mira’s reward', exact: true })).toHaveCount(
    0,
  );
  await expect(page.locator('.ff-player')).toContainText('360 XP');
  await expect(page.locator('.ff-player')).toContainText('197 gold');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.screenshot({ path: 'test-results/expedition-complete.png' });
  await page.reload();
  await page.getByRole('button', { name: /Continue adventure/ }).click();
  await expect(page.getByRole('button', { name: 'Begin the next expedition' })).toBeVisible();
  await expect(page.locator('.ff-player')).toContainText('360 XP');
  await page.getByRole('button', { name: 'Main menu', exact: true }).click();
  await page.getByRole('button', { name: 'Learning journal', exact: true }).click();
  await expect(page.locator('.report-summary strong')).toHaveText(['6', '5', '5']);
  const fractions = page.locator('.topic-row').filter({ hasText: 'Fractions & comparisons' });
  await expect(fractions).toContainText('0%');
  await expect(fractions.locator(':scope > span').last()).toHaveText('1');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export this hero', exact: true }).click();
  const exported = await downloaded;
  expect(exported.suggestedFilename()).toBe('fractions-fighter-Rune-Tester.json');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.getByRole('button', { name: /Continue adventure/ }).click();
  await page.getByRole('button', { name: 'Begin the next expedition' }).click();
  await expect(page.locator('.zone-heading')).toContainText('EXPEDITION 2');
  await expect(page.locator('.ff-quest')).toContainText('0 / 5 threats overcome');
  await page
    .getByLabel('Import save file', { exact: true })
    .setInputFiles((await exported.path())!);
  await expect(page.getByRole('heading', { name: 'Haven', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Begin the next expedition' })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Game navigation' })
    .getByRole('button', { name: 'Inventory', exact: true })
    .click();
  await expect(page.locator('.pack-item')).toHaveCount(6);
  expect(errors).toEqual([]);
});

test('separate heroes, settings persistence, keyboard controls, import rejection and compact layout', async ({
  page,
}) => {
  await page.goto('/');
  await createHero(page, 'First Hero', 'The Starforged');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page
    .locator('.difficulty-list')
    .getByRole('button', { name: /Pathfinder/ })
    .click();
  await page.getByLabel(/Reduced motion/).check();
  await page.getByLabel(/Falling quick runes/).uncheck();
  await page.getByRole('button', { name: 'Save & return' }).press('Tab');
  await expect(page.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('main')).toHaveClass(/reduced-motion/);
  await page.keyboard.press('i');
  await expect(page.getByRole('dialog')).toContainText('Every treasure tells a story.');
  await page.keyboard.press('Escape');
  await page.keyboard.press('j');
  await expect(page.getByRole('dialog')).toContainText('The Broken Compass');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Main menu', exact: true }).click();
  await createHero(page, 'Second Hero', 'The Stormkin');
  await page.getByRole('button', { name: 'Main menu', exact: true }).click();
  await page.getByRole('button', { name: /Load game/ }).click();
  await expect(page.locator('.saved-hero-list > button')).toHaveCount(2);
  await page
    .locator('.saved-hero-list')
    .getByRole('button', { name: /First Hero/ })
    .click();
  await expect(page.locator('.ff-player')).toContainText('First Hero');
  await page.reload();
  await page.getByRole('button', { name: /Continue adventure First Hero/ }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(
    page.locator('.difficulty-list').getByRole('button', { name: /Pathfinder/ }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel(/Reduced motion/)).toBeChecked();
  await expect(page.getByLabel(/Falling quick runes/)).not.toBeChecked();
  await page.keyboard.press('Escape');
  await page.getByLabel('Import save file', { exact: true }).setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole('alert')).toContainText('not a supported Fractions Fighter save');
  await page.getByRole('button', { name: 'Dismiss storage message' }).click();
  await expect(page.locator('.ff-player')).toContainText('First Hero');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Close dialog' })).toBeInViewport();
  await page.screenshot({ path: 'test-results/compact-settings.png' });
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
