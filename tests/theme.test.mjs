import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
const code = layout.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace('querySelector<HTMLButtonElement>', 'querySelector');
function setup({ supported = true, reduced = false } = {}) {
  const handlers = {}, attributes = {}, styles = new Map(), saved = new Map();
  const root = { dataset: { theme: 'light' }, style: { setProperty: (key, value) => styles.set(key, value), removeProperty: (key) => styles.delete(key) } };
  const toggle = { setAttribute: (key, value) => { attributes[key] = value; }, addEventListener: (key, fn) => { handlers[key] = fn; }, getBoundingClientRect: () => ({ left: 900, top: 20, width: 44, height: 44 }) };
  let finish, transitions = 0, onSystemChange;
  const document = { documentElement: root, querySelector: () => toggle };
  if (supported) document.startViewTransition = (update) => { transitions++; update(); return { finished: new Promise((resolve) => { finish = resolve; }) }; };
  runInNewContext(code, { document, innerWidth: 1000, innerHeight: 700, localStorage: { getItem: (key) => saved.get(key), setItem: (key, value) => saved.set(key, value) }, matchMedia: (query) => query.includes('reduced-motion') ? { matches: reduced } : { addEventListener: (_, fn) => { onSystemChange = fn; } } });
  return { root, styles, saved, attributes, click: () => handlers.click(), finish: () => finish(), transitions: () => transitions, systemChange: (matches) => onSystemChange({ matches }) };
}
test('主题从按钮中心扩散至最远角，阻止动画中重复点击并清理状态', async () => {
  const page = setup();
  const animation = page.click();
  assert.equal(page.root.dataset.theme, 'dark');
  assert.equal(page.styles.get('--theme-reveal-x'), '922px');
  assert.equal(page.styles.get('--theme-reveal-y'), '42px');
  assert.equal(page.styles.get('--theme-reveal-radius'), `${Math.hypot(922, 658)}px`);
  await page.click();
  assert.equal(page.transitions(), 1);
  page.finish(); await animation;
  assert.equal(page.root.dataset.themeTransition, undefined);
  assert.equal(page.styles.size, 0);
  const reverse = page.click();
  assert.equal(page.root.dataset.theme, 'light');
  page.finish(); await reverse;
  assert.equal(page.saved.get('miraitowa-theme'), 'light');
});
test('不支持动画或减少动态效果时直接切换，未手动选择时跟随系统', async () => {
  for (const options of [{ supported: false }, { reduced: true }]) {
    const page = setup(options);
    page.systemChange(true);
    assert.equal(page.root.dataset.theme, 'dark');
    await page.click();
    assert.equal(page.root.dataset.theme, 'light');
    assert.equal(page.transitions(), 0);
    page.systemChange(true);
    assert.equal(page.root.dataset.theme, 'light');
    assert.equal(page.attributes['aria-label'], '切换到深色主题');
  }
});
