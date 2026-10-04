import Fuse from 'fuse.js';

export function createSearch(records) {
  const fuse = new Fuse(records, {
    includeScore: true, ignoreLocation: true, threshold: .3,
    keys: [{ name: 'title', weight: .4 }, { name: 'tags', weight: .3 }, { name: 'description', weight: .2 }, { name: 'body', weight: .1 }],
  });
  return (query) => {
    const terms = [...new Set(query.toLowerCase().trim().split(/\s+/).filter(Boolean))];
    if (!terms.length) return records.map((record) => record.slug);
    let scores;
    for (const term of terms) {
      // Very short queries need exact substrings to avoid noisy fuzzy matches.
      const hits = term.length <= 2
        ? records.filter((r) => [r.title, r.description, ...r.tags, r.body].some((text) => text.toLowerCase().includes(term))).map((item) => ({ item, score: 0 }))
        : fuse.search(term);
      const current = new Map(hits.map(({ item, score }) => [item.slug, score || 0]));
      scores = scores ? new Map([...scores].filter(([slug]) => current.has(slug)).map(([slug, score]) => [slug, score + current.get(slug)])) : current;
    }
    return [...scores].sort((a, b) => a[1] - b[1]).map(([slug]) => slug);
  };
}
