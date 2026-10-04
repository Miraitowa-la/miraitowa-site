import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import GithubSlugger from 'github-slugger';

const slash = (value) => value.replaceAll('\\', '/');
const plain = (node) => node.value ?? (node.children || []).map(plain).join('');
async function files(root, prefix = '') {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  const nested = await Promise.all(entries.filter((entry) => !entry.name.startsWith('.')).map((entry) => {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? files(root, name) : [name];
  }));
  return nested.flat().sort();
}

export async function buildNotes(root = path.resolve('content/notes')) {
  const allFiles = await files(root);
  const notes = [];
  for (const file of allFiles.filter((file) => file.endsWith('.md'))) {
    const { data, content } = matter(await readFile(path.join(root, file), 'utf8'));
    if (data.publish !== true || data.draft === true) continue;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug || '')) throw new Error(`${file}: 请设置唯一的英文 slug`);
    const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error(`${file}: date 应为 YYYY-MM-DD`);
    if (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.some((tag) => typeof tag !== 'string'))) throw new Error(`${file}: tags 应为文字数组`);
    notes.push({ file, slug: data.slug, title: String(data.title || path.basename(file, '.md')), description: String(data.description || ''), date,
      category: String(data.category || '技术笔记'), tags: data.tags || [], aliases: Array.isArray(data.aliases) ? data.aliases.filter((x) => typeof x === 'string') : [],
      url: `/blog/${data.slug}/`, content, links: [], headings: [], hasMermaid: false });
  }
  if (new Set(notes.map((note) => note.slug)).size !== notes.length) throw new Error('文章 slug 重复');
  const assets = new Map();
  const warnings = [];
  function resolve(target, from, wiki, pool, key) {
    let decoded;
    try { decoded = decodeURIComponent(slash(target)); } catch { return; }
    const relative = path.posix.normalize(path.posix.join(path.posix.dirname(from), decoded));
    const exact = pool.find((item) => key(item) === decoded) || pool.find((item) => key(item) === relative);
    if (exact) return exact;
    if (wiki && !decoded.includes('/')) {
      const matches = pool.filter((item) => path.posix.basename(key(item)) === decoded || (item.aliases || []).includes(decoded));
      if (matches.length === 1) return matches[0];
    }
  }
  const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
  const trees = new Map();
  for (const note of notes) {
    const tree = parser.parse(note.content);
    const slugger = new GithubSlugger();
    function headings(node) {
      if (node.type === 'heading') {
        const text = plain(node).replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1');
        const slug = slugger.slug(text);
        node.data = { hProperties: { id: slug } };
        note.headings.push({ text, slug, depth: node.depth });
      }
      node.children?.forEach(headings);
    }
    headings(tree);
    trees.set(note.slug, tree);
  }
  for (const note of notes) {
    const warn = (target) => warnings.push(`${note.file}: 无法解析公开链接或附件「${target}」`);
    function link(target, label, wiki) {
      if (/^(https?:|mailto:)/i.test(target)) return { type: 'link', url: target, children: [{ type: 'text', value: label }] };
      if (!wiki && target.startsWith('/') && !/\.md(?:#|$)/i.test(target)) {
        const dest = notes.find((n) => n.url === target.split('#')[0]);
        if (dest && dest !== note) note.links.push(dest.slug);
        return { type: 'link', url: target, children: [{ type: 'text', value: label }] };
      }
      const [name, ...parts] = target.split('#');
      let heading = parts.join('#');
      try { heading = decodeURIComponent(heading); } catch {}
      const dest = name ? resolve(name.replace(/\.md$/, ''), note.file, wiki, notes, (n) => n.file.replace(/\.md$/, '')) : note;
      const anchor = heading ? dest?.headings.find((h) => h.text === heading || h.slug === heading) : undefined;
      if (!dest || (heading && !anchor)) { warn(target); return { type: 'text', value: label }; }
      if (dest !== note) note.links.push(dest.slug);
      return { type: 'link', url: `${dest.url}${anchor ? `#${anchor.slug}` : ''}`, children: [{ type: 'text', value: label }] };
    }
    function image(target, alt, width) {
      if (/^https?:\/\//i.test(target)) return { type: 'image', url: target, alt };
      const file = resolve(target, note.file, true, allFiles.filter((f) => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(f)), (f) => f);
      if (!file) { warn(target); return { type: 'text', value: `[图片缺失：${alt || target}]` }; }
      const id = createHash('sha256').update(file).digest('hex').slice(0, 20) + path.extname(file).toLowerCase();
      assets.set(file, { file, id, absolute: path.join(root, file) });
      return { type: 'image', url: `/blog-assets/${id}`, alt: alt || path.basename(file), data: width && /^\d{1,4}$/.test(width) ? { hProperties: { width: Number(width) } } : undefined };
    }
    function walk(node, insideLink = false) {
      if (!node.children) return;
      if (node.type === 'blockquote') {
        const first = node.children[0]?.children?.[0];
        const marker = first?.type === 'text' && first.value.match(/^\[!([a-z]+)\][+-]?(?:[ \t]*([^\n]*))?\n?/i);
        if (marker) {
          first.value = first.value.slice(marker[0].length);
          node.data = { hName: 'aside', hProperties: { className: ['callout'] } };
          node.children.unshift({ type: 'paragraph', children: [{ type: 'strong', children: [{ type: 'text', value: marker[2] || marker[1] }] }] });
        }
      }
      node.children = node.children.flatMap((child) => {
        if (child.type === 'text' && !insideLink) {
          const result = []; let end = 0;
          for (const match of child.value.matchAll(/(!?)\[\[([^\]\n]+)\]\]/g)) {
            if (match.index > end) result.push({ type: 'text', value: child.value.slice(end, match.index) });
            const [target, label] = match[2].split('|');
            result.push(match[1] ? image(target.trim(), target.trim(), label?.trim()) : link(target.trim(), label?.trim() || target.trim(), true));
            end = match.index + match[0].length;
          }
          if (end === 0) return [child];
          if (end < child.value.length) result.push({ type: 'text', value: child.value.slice(end) });
          return result;
        }
        if (child.type === 'image') return [image(child.url, child.alt, undefined)];
        if (child.type === 'link' && !/^[a-z][a-z\d+.-]*:/i.test(child.url)) {
          const converted = link(child.url, plain(child), false);
          if (converted.type === 'link') converted.children = child.children;
          return [converted];
        }
        walk(child, insideLink || child.type === 'link'); return [child];
      });
    }
    const tree = trees.get(note.slug);
    walk(tree);
    note.links = [...new Set(note.links)];
    const renderer = unified().use(remarkRehype, { handlers: {
      code(state, node) {
        if (node.lang === 'mermaid') {
          note.hasMermaid = true;
          return { type: 'element', tagName: 'div', properties: { className: ['mermaid-block'] }, children: [
            { type: 'element', tagName: 'p', properties: { className: ['note-meta'], role: 'status' }, children: [{ type: 'text', value: '图表加载中…' }] },
            { type: 'element', tagName: 'details', properties: {}, children: [
              { type: 'element', tagName: 'summary', properties: {}, children: [{ type: 'text', value: '查看图表源码' }] },
              { type: 'element', tagName: 'pre', properties: { className: ['mermaid-source'] }, children: [{ type: 'text', value: node.value }] },
            ] },
          ] };
        }
        return { type: 'element', tagName: 'pre', properties: {}, children: [{ type: 'element', tagName: 'code', properties: node.lang ? { className: [`language-${node.lang}`] } : {}, children: [{ type: 'text', value: node.value }] }] };
      },
    } }).use(rehypeKatex).use(rehypeStringify);
    note.html = renderer.stringify(await renderer.run(tree));
  }
  notes.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  for (const note of notes) note.backlinks = notes.filter((other) => other.links.includes(note.slug)).map((n) => ({ slug: n.slug, title: n.title, url: n.url }));
  return { notes, assets: [...assets.values()], warnings };
}
let cached;
export function getNotes() {
  const load = () => buildNotes().then((result) => { result.warnings.forEach((warning) => console.warn(`[笔记] ${warning}`)); return result; });
  if (import.meta.env?.DEV) return load();
  cached ??= load();
  return cached;
}
