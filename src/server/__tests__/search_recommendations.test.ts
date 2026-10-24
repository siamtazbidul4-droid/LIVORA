import { describe, it, expect } from 'vitest';

// Test search term expansion logic
const BANGLA_SYNONYMS: Record<string, string[]> = {
  'বই': ['book', 'publications', 'rich', 'motivational', 'বই'],
  'মোটিভেশনাল': ['motivational', 'inspire', 'mind', 'book', 'rich'],
  'মোটিভেশনাল বই': ['motivational', 'book', 'think and grow rich', 'publications'],
  'সোফা': ['sofa', 'seating', 'avela', 'couch'],
  'চেয়ার': ['chair', 'accent', 'seating', 'nova'],
  'টেবিল': ['table', 'dining', 'lume', 'desk'],
  'বাতি': ['lamp', 'lighting', 'light', 'orbi', 'astra'],
};

function expandSearchTerms(term: string): string[] {
  const normalized = term.trim().toLowerCase();
  const tokens = normalized.split(/\s+/);
  const searchSet = new Set<string>([normalized, ...tokens]);

  if (BANGLA_SYNONYMS[normalized]) {
    BANGLA_SYNONYMS[normalized].forEach((s) => searchSet.add(s));
  }

  tokens.forEach((token) => {
    if (BANGLA_SYNONYMS[token]) {
      BANGLA_SYNONYMS[token].forEach((s) => searchSet.add(s));
    }
  });

  return Array.from(searchSet);
}

describe('Phase 6 — Product Search Engine & Bilingual Expansion', () => {
  it('expands exact Bangla query "মোটিভেশনাল বই" to English equivalents', () => {
    const expanded = expandSearchTerms('মোটিভেশনাল বই');
    expect(expanded).toContain('book');
    expect(expanded).toContain('motivational');
    expect(expanded).toContain('think and grow rich');
  });

  it('expands single Bangla token "সোফা" to "sofa" and "couch"', () => {
    const expanded = expandSearchTerms('সোফা');
    expect(expanded).toContain('sofa');
    expect(expanded).toContain('couch');
    expect(expanded).toContain('seating');
  });

  it('handles English query "lamp" preserving terms', () => {
    const expanded = expandSearchTerms('lamp');
    expect(expanded).toContain('lamp');
  });
});

describe('Phase 7 — Personalized Recommendation Scoring & Diversity Policy', () => {
  const EVENT_WEIGHTS: Record<string, number> = {
    detail_view: 1,
    click: 2,
    search_click: 3,
    wishlist_add: 4,
    add_to_cart: 5,
    review: 4,
    purchase: 8,
  };

  it('applies time decay with 7-day half-life correctly', () => {
    const nowMs = 1700000000000;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    const baseWeight = EVENT_WEIGHTS['purchase']; // 8
    const weightNow = baseWeight * Math.pow(0.5, 0 / sevenDaysMs);
    const weight7Days = baseWeight * Math.pow(0.5, sevenDaysMs / sevenDaysMs);
    const weight14Days = baseWeight * Math.pow(0.5, fourteenDaysMs / sevenDaysMs);

    expect(weightNow).toBe(8);
    expect(weight7Days).toBe(4);
    expect(weight14Days).toBe(2);
  });

  it('enforces category diversity policy cap (max 50% from dominant category)', () => {
    const limit = 6;
    const maxPerCategory = Math.max(2, Math.floor(limit * 0.5)); // 3

    const scoredMockProducts = [
      { id: '1', name: 'Book 1', category: 'books', score: 100 },
      { id: '2', name: 'Book 2', category: 'books', score: 95 },
      { id: '3', name: 'Book 3', category: 'books', score: 90 },
      { id: '4', name: 'Book 4', category: 'books', score: 85 }, // Exceeds cap
      { id: '5', name: 'Sofa 1', category: 'furniture', score: 80 },
      { id: '6', name: 'Lamp 1', category: 'lighting', score: 75 },
      { id: '7', name: 'Vase 1', category: 'decor', score: 70 },
    ];

    const categoryCounts: Record<string, number> = {};
    const results: any[] = [];
    const deferred: any[] = [];

    for (const item of scoredMockProducts) {
      const count = categoryCounts[item.category] || 0;
      if (count < maxPerCategory) {
        results.push(item);
        categoryCounts[item.category] = count + 1;
      } else {
        deferred.push(item);
      }
      if (results.length >= limit) break;
    }

    // Fill remaining if needed
    for (const item of deferred) {
      if (results.length < limit && !results.some((r) => r.id === item.id)) {
        results.push(item);
      }
    }

    const booksInResults = results.filter((r) => r.category === 'books');
    expect(booksInResults.length).toBeLessThanOrEqual(maxPerCategory);
    expect(results.some((r) => r.category === 'furniture')).toBe(true);
    expect(results.some((r) => r.category === 'lighting')).toBe(true);
  });
});
