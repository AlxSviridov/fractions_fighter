import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { TASK_BANK } from '../../src/game/taskBank';

// Combat answers come only from the rendered question, never the generator or save.
// World puzzles are authored word problems; they are matched by their rendered
// prompt to the reviewed task bank, whose answers are independently
// oracle-checked in tests/taskBank.test.ts.
async function createHero(page: Page, name: string, avatar = 'The Mooncat') {
  await page.getByRole('button', { name: 'New game', exact: true }).click();
  await page.getByRole('button', { name: avatar, exact: true }).click();
  await page.getByLabel('Your hero’s name').fill(name);
  await page.getByRole('button', { name: 'Enter Haven', exact: true }).click();
  await expect(page.locator('.world')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('heading', { name: 'Haven', exact: true })).toBeVisible();
  await expect(page.locator('.ff-player')).toContainText(name);
}
const travelWards = new WeakMap<Page, number>();
async function handleTravelWard(page: Page) {
  // Walking resumes after a ward, so an object dialog may legitimately open next.
  await solve(page, page.getByRole('dialog', { name: /Raise your ward/ }));
  travelWards.set(page, (travelWards.get(page) ?? 0) + 1);
}
async function approach(page: Page, enemy: string) {
  await page
    .locator('.enemy-tracker')
    .getByRole('button', { name: new RegExp(`^${enemy}`) })
    .click();
  await waitForArrival(page, enemy);
}
async function waitForArrival(page: Page, enemy: string) {
  const arrival = page.locator('.combat-choice').getByRole('heading', { name: enemy, exact: true });
  const ward = page.getByRole('dialog', { name: /Raise your ward/ });
  // Enemies can legitimately attack during a walk, especially on software-rendered CI.
  for (let interruption = 0; interruption < 6; interruption++) {
    await expect(arrival.or(ward).first()).toBeVisible({ timeout: 30000 });
    if (await ward.isVisible()) {
      await handleTravelWard(page);
      continue;
    }
    await expect(arrival).toBeVisible();
    return;
  }
  throw new Error(`Could not reach ${enemy} after defending six travel attacks`);
}
async function cast(page: Page, action: 'Quick strike' | 'Power skill' | 'Ancient ritual') {
  const ward = page.getByRole('dialog', { name: /Raise your ward/ });
  for (let interruption = 0; interruption < 6; interruption++) {
    if (await ward.isVisible()) {
      await handleTravelWard(page);
      continue;
    }
    try {
      await page
        .locator('.combat-choice')
        .getByRole('button', { name: new RegExp(`^${action}`) })
        .click({ timeout: 10000 });
    } catch (error) {
      if (await ward.isVisible()) {
        await handleTravelWard(page);
        continue;
      }
      throw error;
    }
    await expect(page.getByRole('dialog')).toBeVisible();
    if (await ward.isVisible()) {
      await handleTravelWard(page);
      continue;
    }
    await expect(page.getByRole('dialog')).toHaveAccessibleName(new RegExp(action));
    return;
  }
  throw new Error(`Could not start ${action} after defending six attacks`);
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
async function solve(page: Page, closes = page.getByRole('dialog')) {
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
  await expect(closes).toHaveCount(0);
  await expect(page.locator('.impact-banner')).toHaveCount(0);
}
async function awaitDefence(page: Page, enemy: string) {
  await expect(page.locator('.enemy-warning')).toContainText(`${enemy} is preparing an attack!`, {
    timeout: 12000,
  });
  await expect(page.locator('.quick-encounter')).toContainText('Raise your ward', {
    timeout: 12000,
  });
  const breakdown = await page.locator('.defence-breakdown').innerText();
  const match = breakdown.match(/Attack (\d+).*Armour absorbs (\d+).*?(\d+) health at risk/);
  if (!match) throw new Error(`Could not read defence breakdown: ${breakdown}`);
  return { incoming: Number(match[1]), armour: Number(match[2]), damage: Number(match[3]) };
}

const ward = (page: Page) => page.getByRole('dialog', { name: /Raise your ward/ });
/** Wait for `ready` while defending any travel wards that interrupt the walk. */
async function arriveAt(page: Page, ready: () => Promise<boolean>, what: string) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (await ward(page).isVisible()) {
      await handleTravelWard(page);
      continue;
    }
    if (await ready()) return;
    await page.waitForTimeout(250);
  }
  throw new Error(`Never arrived at ${what}`);
}
/** Walk to a point of interest via the accessible journal list, then open it. */
async function visit(page: Page, objectName: string) {
  await page.getByRole('button', { name: 'Quests', exact: true }).click();
  await page
    .locator('.trail-guide')
    .getByRole('button', { name: new RegExp(`^${objectName}`) })
    .click();
  const dialog = page.getByRole('dialog', { name: objectName, exact: true });
  await arriveAt(page, () => dialog.isVisible(), objectName);
  return dialog;
}
async function followObjective(page: Page, name: string) {
  await page.getByRole('button', { name: 'Guide me there', exact: true }).click();
  const dialog = page.getByRole('dialog', { name, exact: true });
  const combat = page.locator('.combat-choice').getByRole('heading', { name, exact: true });
  await arriveAt(page, async () => (await dialog.isVisible()) || (await combat.isVisible()), name);
}
async function solvePuzzle(page: Page) {
  const prompt = (await page.locator('.math-prompt').innerText()).trim();
  const task = TASK_BANK.find((candidate) => candidate.prompt === prompt);
  if (!task) throw new Error(`Puzzle not in the reviewed task bank: ${prompt}`);
  await page.getByLabel(/^Your answer/).fill(String(task.answer));
  await page.getByLabel(/^Your answer/).press('Enter');
  await expect(page.locator('.rune-success')).toContainText('Solved!');
  await page.getByRole('button', { name: 'Back to the trail', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function defeatWithRituals(page: Page, enemy: string) {
  for (let round = 0; round < 4; round++) {
    await cast(page, 'Ancient ritual');
    await solve(page);
    if (await page.locator('.loot-notification').isVisible()) return;
    await arriveAt(
      page,
      () => page.locator('.combat-choice').getByRole('heading', { name: enemy }).isVisible(),
      enemy,
    );
  }
  throw new Error(`${enemy} survived four rituals`);
}

async function wrongQuickAnswer(page: Page) {
  const answer = await quickAnswer(page);
  return answer === '<' ? '>' : '<';
}

test('complete expedition, supported quick maths, equipment, quest reward and save transfer', async ({
  page,
}) => {
  // Eight areas, four gates and a boss: much longer than the old single clearing.
  test.setTimeout(720000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await createHero(page, 'Rune Tester');
  await page.getByRole('button', { name: 'Enter the wilds', exact: true }).click();
  await expect(page.locator('.region-banner')).toContainText('Waterfall Landing');
  await expect(page.locator('.trail-map')).toBeVisible();
  await expect(page.locator('.enemy-tracker').getByRole('button', { name: / HP$/ })).toHaveCount(3);
  await expect(page.locator('.ff-quest')).toContainText('Lower the rope bridge in Fern Hollow');
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
  await expect(page.locator('.upgrade-comparison')).toContainText('Total attack: 12 → 14');
  await page.getByRole('button', { name: 'Equip Tidefang', exact: true }).click();
  await expect(page.locator('.inventory-stats')).toContainText('14 Attack');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();

  // A free chest rewards the first detour.
  const chest = await visit(page, 'Mira’s Supply Chest');
  await chest.getByRole('button', { name: 'Open it' }).click();
  await expect(page.locator('.loot-notification')).toContainText('Explorer’s Hide Vest');
  await page.getByRole('button', { name: 'Equip now', exact: true }).click();

  // Critical path: winch → code lock → captain → three seals → guardian.
  await followObjective(page, 'Bridge Winch');
  await page.getByRole('button', { name: 'Solve the puzzle' }).click();
  await solvePuzzle(page);
  await expect(page.locator('.ff-quest')).toContainText('Crack the corsair code lock');
  await followObjective(page, 'Corsair Code Lock');
  await page.getByRole('button', { name: 'Solve the puzzle' }).click();
  await solvePuzzle(page);
  await expect(page.locator('.ff-quest')).toContainText('Defeat Captain Redsail');
  await followObjective(page, 'Captain Redsail');
  await defeatWithRituals(page, 'Captain Redsail');
  await page.getByRole('button', { name: 'Equip now', exact: true }).click();
  for (const seal of ['Seal of Shapes', 'Seal of Parts', 'Seal of Sharing']) {
    await followObjective(page, seal);
    await page.getByRole('button', { name: 'Solve the puzzle' }).click();
    await solvePuzzle(page);
  }
  await expect(page.locator('.ff-quest')).toContainText('Defeat the Shard Guardian');
  await followObjective(page, 'Shard Guardian');
  await defeatWithRituals(page, 'Shard Guardian');
  await expect(page.locator('.loot-notification')).toContainText('Compass of Unity');
  await page.getByRole('button', { name: 'Equip now', exact: true }).click();
  await expect(page.locator('.ff-quest')).toContainText('Return to Scout Mira');
  await expect(page.locator('.ff-quest')).toContainText('5 / 5 trail objectives');
  await page.screenshot({ path: 'test-results/sanctum-cleared.png' });
  const xpBefore = Number((await page.locator('.ff-player').innerText()).match(/(\d+) XP/)![1]);
  const goldBefore = Number((await page.locator('.ff-player').innerText()).match(/(\d+) gold/)![1]);
  await page.getByRole('button', { name: 'Return to Haven', exact: true }).click();
  await page.getByRole('button', { name: /Speak to Mira/ }).click();
  await page.getByRole('button', { name: 'Claim Mira’s reward', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Claim Mira’s reward', exact: true })).toHaveCount(
    0,
  );
  await expect(page.locator('.ff-player')).toContainText(`${xpBefore + 100} XP`);
  await expect(page.locator('.ff-player')).toContainText(`${goldBefore + 80} gold`);
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.screenshot({ path: 'test-results/expedition-complete.png' });
  await page.reload();
  await page.getByRole('button', { name: /Continue adventure/ }).click();
  await expect(page.getByRole('button', { name: 'Begin the next expedition' })).toBeVisible();
  await expect(page.locator('.ff-player')).toContainText(`${xpBefore + 100} XP`);
  await page.getByRole('button', { name: 'Main menu', exact: true }).click();
  await page.getByRole('button', { name: 'Learning journal', exact: true }).click();
  // Prowler, captain and guardian fell; every puzzle and ward counts as a question.
  await expect(page.locator('.report-summary strong').nth(2)).toHaveText('3');
  const fractions = page.locator('.topic-row').filter({ hasText: 'Fractions & comparisons' });
  await expect(fractions.locator(':scope > span').last()).not.toHaveText('0');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export this hero', exact: true }).click();
  const exported = await downloaded;
  expect(exported.suggestedFilename()).toBe('fractions-fighter-Rune-Tester.json');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.getByRole('button', { name: /Continue adventure/ }).click();
  await page.getByRole('button', { name: 'Begin the next expedition' }).click();
  await expect(page.locator('.zone-heading')).toContainText('EXPEDITION 2');
  // Story shortcuts persist: the bridge and stockade stay open on the next expedition.
  await expect(page.locator('.ff-quest')).toContainText('2 / 5 trail objectives');
  await expect(page.locator('.ff-quest')).toContainText('Defeat Captain Redsail');
  await page
    .getByLabel('Import save file', { exact: true })
    .setInputFiles((await exported.path())!);
  await expect(page.getByRole('heading', { name: 'Haven', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Begin the next expedition' })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Game navigation' })
    .getByRole('button', { name: 'Inventory', exact: true })
    .click();
  await expect(page.locator('.spatial-item').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('an expired quick rune causes no damage and remains solvable', async ({ page }) => {
  await page.goto('/');
  await createHero(page, 'Timer Tester');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page
    .locator('.difficulty-list')
    .getByRole('button', { name: /Explorer/ })
    .click();
  await page.getByRole('button', { name: 'Save & return' }).click();
  await page.getByRole('button', { name: 'Enter the wilds', exact: true }).click();
  await approach(page, 'Bramble Prowler');
  await cast(page, 'Quick strike');
  await expect(page.locator('.health-orb strong')).toHaveText('100');

  // Explorer quick runes use the actual visible 25-second timer; expiry relaxes ordinary strikes.
  await expect(page.locator('.rune-meta')).toContainText('25-second rune');
  await expect(page.locator('.rune-feedback')).toContainText('No damage taken', { timeout: 28000 });
  await expect(page.locator('.health-orb strong')).toHaveText('100');
  await solve(page);
});

test('a nearby enemy telegraphs, ward maths blocks or mitigates attacks, and longer maths is protected', async ({
  page,
}) => {
  await page.goto('/');
  await createHero(page, 'Ward Tester');
  await page.getByRole('button', { name: 'Enter the wilds', exact: true }).click();
  await approach(page, 'Bramble Prowler');

  // Wait for the ward straight away: under software WebGL a slow UI action here
  // can outlast the 8-second wind-up plus the whole ward timer.
  const blocked = await awaitDefence(page, 'Bramble Prowler');
  expect(blocked.incoming).toBeGreaterThan(blocked.armour);
  expect(blocked.damage).toBeGreaterThan(0);
  // Pause this ward's real-time clock (a player option) so a slow software-rendered
  // browser cannot let it expire between reading and answering; expiry has its own test.
  await page.getByRole('button', { name: 'Let me think', exact: true }).click();
  await expect(page.locator('.rune-meta')).toContainText('Take your time');
  await solve(page);
  await expect(page.locator('.health-orb strong')).toHaveText('100');
  await expect(page.getByRole('status')).toContainText('Attack blocked!');
  await page.getByLabel('Deselect target').click();

  const hit = await awaitDefence(page, 'Bramble Prowler');
  const beforeWrong = Number(await page.locator('.health-orb strong').innerText());
  await page
    .getByRole('button', { name: `Answer ${await wrongQuickAnswer(page)}`, exact: true })
    .click();
  await expect(page.locator('.quick-encounter')).toHaveCount(0);
  await expect(page.locator('.health-orb strong')).toHaveText(String(beforeWrong - hit.damage));
  await expect(page.getByRole('status')).toContainText(
    `Armour absorbed ${hit.armour} of ${hit.incoming}`,
  );

  await approach(page, 'Bramble Prowler');
  await cast(page, 'Power skill');
  await expect(page.locator('.rune-meta')).toContainText('Take your time');
  const healthBeforeFocus = await page.locator('.health-orb strong').innerText();
  // The enemy remains close for longer than its 8-second attack lead, but a focus task pauses threats.
  await page.waitForTimeout(9500);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.quick-encounter')).toHaveCount(0);
  await expect(page.locator('.health-orb strong')).toHaveText(healthBeforeFocus);
  await solve(page);

  // A prominent, labelled control is always available in the wilds after the protected task closes.
  await expect(page.getByRole('button', { name: 'Return to Haven', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Return to Haven', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Haven', exact: true })).toBeVisible();
  await expect(page.locator('.health-orb strong')).toHaveText('100');
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

test('character sheet unequips safely, restores gear and persists the result', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await createHero(page, 'Equipment Tester');
  await page.keyboard.press('i');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('World paused');
  await expect(page.locator('.inventory-stats')).toContainText('12 Attack');
  await expect(page.locator('.spatial-item')).toHaveCount(0);
  await page.getByRole('button', { name: 'Unequip Wayfarer blade', exact: true }).click();
  await expect(page.locator('.inventory-stats')).toContainText('10 Attack');
  await expect(page.locator('.spatial-item')).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Equip Wayfarer blade', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/character-sheet-1280.png' });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: /Continue adventure Equipment Tester/ }).click();
  await page.keyboard.press('i');
  await expect(page.locator('.inventory-stats')).toContainText('10 Attack');
  await expect(page.locator('.spatial-item')).toHaveCount(1);
  await page.getByRole('button', { name: 'Equip Wayfarer blade', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.inventory-stats')).toContainText('12 Attack');
  await expect(page.locator('.spatial-item')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Close dialog', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('a click-to-approach route survives an inventory thinking pause', async ({ page }) => {
  await page.goto('/');
  await createHero(page, 'Route Tester');
  await page.getByRole('button', { name: 'Enter the wilds', exact: true }).click();
  await page
    .locator('.enemy-tracker')
    .getByRole('button', { name: /^Thornback Boar/ })
    .click();
  await page.keyboard.press('i');
  await expect(page.getByRole('dialog')).toContainText('World paused');
  await page.keyboard.press('Escape');
  await waitForArrival(page, 'Thornback Boar');
  await expect(page.locator('.combat-choice h2')).toHaveText('Thornback Boar');
});

test('spatial pack supports keyboard, drag, stash retrieval and empty carried inventory', async ({
  page,
}) => {
  await page.goto('/');
  await createHero(page, 'Pack Tester');
  await page.keyboard.press('i');
  await page.getByRole('button', { name: 'Unequip Wayfarer blade', exact: true }).click();
  await page.getByRole('gridcell', { name: 'Pack cell 2, 1', exact: true }).press('Enter');
  await expect(page.locator('.spatial-item')).toHaveCSS('grid-column-start', '2');
  await expect(page.getByRole('tab', { name: /Backpack/ })).toContainText('3 / 40');
  await page.getByRole('button', { name: 'Store in Haven stash', exact: true }).click();
  await expect(page.locator('.stash-item')).toHaveCount(1);
  await page.getByRole('tab', { name: /Backpack/ }).click();
  await page.getByRole('gridcell', { name: 'Pack cell 6, 1', exact: true }).click();
  await expect(page.locator('.spatial-item')).toHaveCSS('grid-column-start', '6');
  await page
    .locator('.spatial-item')
    .dragTo(page.getByRole('gridcell', { name: 'Pack cell 9, 1', exact: true }));
  await expect(page.locator('.spatial-item')).toHaveCSS('grid-column-start', '9');
  await page.getByRole('gridcell', { name: 'Pack cell 10, 4', exact: true }).click();
  await expect(page.locator('.inventory-feedback')).toContainText('cannot fit');
  await expect(page.locator('.spatial-item')).toHaveCSS('grid-column-start', '9');
  await page.getByRole('button', { name: 'Store in Haven stash', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Enter the wilds', exact: true }).click();
  await page.keyboard.press('i');
  await expect(page.getByRole('tab', { name: /Haven stash/ })).toHaveCount(0);
  await expect(page.locator('.spatial-item')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toBeVisible();
});
