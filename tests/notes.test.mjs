import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildNotes, searchRecords, downloadNote } from '../src/lib/notes.mjs';
import { createSearch } from '../src/lib/blog-search.mjs';

test('公开示例支持链接、目录、图片、公式和反向链接', async () => {
  const { notes, assets, warnings } = await buildNotes();
  assert.equal(notes.length, 3);
  assert.equal(warnings.length, 0);
  assert.equal(assets.length, 1);
  assert.match(assets[0].id, /^[a-f0-9]{20}\.svg$/);
  const guide = notes.find((n) => n.slug === 'knowledge-guide');
  assert.match(decodeURIComponent(guide.html), /href="\/blog\/spi-notes\/#时序图"/);
  assert.match(guide.html, /width="600"/);
  assert.match(guide.html, /class="callout"/);
  assert.ok(guide.backlinks.length === 2);
  assert.equal(notes.reduce((total, note) => total + note.links.length, 0), 6);
  const formulas = notes.find((n) => n.slug === 'diagrams-and-math');
  assert.match(formulas.html, /class="katex"/);
  assert.match(formulas.html, /mermaid-source/);
});

test('草稿、重名、代码中的双链和未引用附件不会进入公开引用关系', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'miraitowa-notes-'));
  try {
    const note = (slug, body, extra = '') => `---\nslug: ${slug}\ndate: 2026-10-04\npublish: true\n${extra}---\n${body}`;
    await mkdir(path.join(root, 'A')); await mkdir(path.join(root, 'B'));
    await writeFile(path.join(root, '首页.md'), note('home', '[[同名]] [[A/同名]] [[私密]] [[草稿]] `[[代码]]`\n\n```text\n[[代码块]]\n```\n\n![[不存在.png]]'));
    await writeFile(path.join(root, 'A/同名.md'), note('a', '内容'));
    await writeFile(path.join(root, 'B/同名.md'), note('b', '内容'));
    await writeFile(path.join(root, '私密.md'), '秘密');
    await writeFile(path.join(root, '草稿.md'), note('draft', '草稿', 'draft: true\n'));
    await writeFile(path.join(root, '私密.png'), 'unused');
    const result = await buildNotes(root);
    assert.equal(result.notes.length, 3);
    assert.equal(result.assets.length, 0);
    assert.deepEqual(result.notes.find((note) => note.slug === 'home').links, ['a']);
    assert.equal(result.warnings.length, 4);
    assert.ok(result.warnings.every((w) => !w.includes('代码')));
    await writeFile(path.join(root, '重复.md'), note('a', '重复地址'));
    await assert.rejects(buildNotes(root), /slug 重复/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('Obsidian 和 Markdown 图片语法共享可访问的 ASCII 附件地址', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'miraitowa-images-'));
  try {
    await writeFile(path.join(root, '图片.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    await writeFile(path.join(root, '文章.md'), '---\nslug: images\ndate: 2026-10-04\npublish: true\n---\n![[图片.svg]]\n\n![标准图片](图片.svg)');
    const result = await buildNotes(root);
    assert.equal(result.warnings.length, 0);
    assert.equal(result.assets.length, 1);
    const sources = [...result.notes[0].html.matchAll(/src="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(sources.length, 2);
    assert.equal(sources[0], sources[1]);
    assert.match(sources[0], /^\/blog-assets\/[a-f0-9]{20}\.svg$/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('全文搜索支持正文、错拼、多关键词，并优先匹配标签', async () => {
  const { notes } = await buildNotes();
  const records = searchRecords(notes);
  assert.ok(records.every((record) => !('file' in record) && !('html' in record)));
  const search = createSearch(records);
  assert.deepEqual(search('时钟'), ['spi-notes']);
  assert.equal(search('Obsidain')[0], 'knowledge-guide');
  assert.deepEqual(search('片选 设备手册'), ['spi-notes']);
  assert.deepEqual(search('zzzxq-nonexistent'), []);
  assert.equal(search('').length, 3);
});

test('notes 下支持多级目录，分类独立于目录结构', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'miraitowa-folders-'));
  try {
    await mkdir(path.join(root, '技术/嵌入式/ESP32'), { recursive: true });
    await writeFile(path.join(root, '技术/嵌入式/ESP32/通信.md'), '---\nslug: nested-note\ndate: 2026-10-04\npublish: true\ncategory: 自定义分类\n---\n深层目录内容');
    const { notes } = await buildNotes(root);
    assert.equal(notes.length, 1);
    assert.equal(notes[0].category, '自定义分类');
    assert.equal(notes[0].url, '/blog/nested-note/');
    assert.equal(notes[0].searchText, '深层目录内容');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('更新时间有效且不早于发布，Markdown 下载保留正文并仅导出公开字段', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'miraitowa-dates-'));
  try {
    const file = path.join(root, '文章.md');
    const source = (updated) => `---\nslug: updated-note\ndate: 2026-10-04\nupdated: ${updated}\npublish: true\ninternal: 不应导出\n---\n# 正文\n\n代码与 ![[缺失.png]]`;
    await writeFile(file, source('2026-10-05'));
    const { notes } = await buildNotes(root);
    assert.equal(notes[0].updated, '2026-10-05');
    const output = downloadNote(notes[0]);
    assert.ok(output.includes(notes[0].content.trim()));
    assert.match(output, /updated:.*2026-10-05/);
    assert.doesNotMatch(output, /internal|不应导出/);
    await writeFile(file, source('2026-10-03'));
    await assert.rejects(buildNotes(root), /不能早于/);
    await writeFile(file, source("'2026-02-30'"));
    await assert.rejects(buildNotes(root), /有效的/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
