import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

test('图表随主题重新渲染，放大事件携带有完整尺寸的 SVG 下载文件', async () => {
  const source = await readFile(new URL('../src/components/MermaidDiagrams.astro', import.meta.url), 'utf8');
  const code = source.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/import mermaid from 'mermaid';/, '')
    .replaceAll('<HTMLElement>', '').replace(' as SVGSVGElement', '')
    .replaceAll("('.mermaid-block')!", "('.mermaid-block')")
    .replaceAll("('svg')!", "('svg')")
    .replaceAll("('[role=\"status\"]')!", "('[role=\"status\"]')")
    .replaceAll("('details')!", "('details')");
  const buttons = [], configurations = [], blobs = [], revoked = [], events = [];
  function element() {
    return {
      style: {}, attributes: {}, viewBox: { baseVal: { width: 744, height: 79 } },
      setAttribute(key, value) { this.attributes[key] = value; },
      querySelector: () => element(), cloneNode: () => element(), before() {}, append() {},
      replaceWith(next) { next.isConnected = true; },
      addEventListener(_, handler) { this.click = handler; },
    };
  }
  const block = element();
  let onTheme;
  const root = { dataset: { theme: 'light' } };
  runInNewContext(code, {
    document: {
      documentElement: root, fonts: { ready: Promise.resolve() },
      querySelectorAll: () => [{ textContent: 'flowchart LR\n A[文章阅读与双向链接]', closest: () => block }],
      createElement(tag) { const node = element(); if (tag === 'button') buttons.push(node); return node; },
      dispatchEvent(event) { events.push(event); },
    },
    mermaid: { initialize(config) { configurations.push(config); }, render: async () => ({ svg: '<svg/>' }) },
    getComputedStyle: () => ({ fontFamily: 'sans-serif', getPropertyValue: () => '#111820' }),
    MutationObserver: class { constructor(callback) { onTheme = callback; } observe() {} },
    XMLSerializer: class { serializeToString(node) { return JSON.stringify(node.attributes); } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    Blob, URL: { createObjectURL(blob) { blobs.push(blob); return `blob:${blobs.length}`; }, revokeObjectURL(url) { revoked.push(url); } },
  });
  await new Promise(setImmediate);
  assert.equal(configurations[0].theme, 'default');
  assert.equal(configurations[0].htmlLabels, false);
  buttons[0].click();
  assert.equal(events[0].type, 'article-image-preview');
  assert.equal(events[0].detail.filename, '流程图-1.svg');
  assert.deepEqual(JSON.parse(await blobs[0].text()), { xmlns: 'http://www.w3.org/2000/svg', width: '744', height: '79' });
  root.dataset.theme = 'dark'; await onTheme();
  assert.equal(configurations[1].theme, 'dark');
  assert.equal(configurations[1].darkMode, true);
  assert.deepEqual(revoked, ['blob:1']);
  buttons[1].click();
  assert.equal(events[1].detail.src, 'blob:2');
});
