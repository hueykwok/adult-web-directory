import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { countBy, definitionsInUse, filterSites, sortSites, paginate, getTotalPages } from '../js/filters.js';
import { searchSites } from '../js/search.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const loadJson = p => JSON.parse(readFileSync(join(rootDir, p), 'utf-8'));

const sites = [
  { id: 'a', name: 'Alpha', category: 'free-tube-sites', tags: ['video', 'free'], languages: ['en'], regions: ['global'], description: 'first', addedAt: '2026-01-01', lastReviewedAt: '2026-01-01', requiresRegistration: false },
  { id: 'b', name: 'Bravo', category: 'free-tube-sites', tags: ['video', 'hd'], languages: ['en', 'es'], regions: ['global'], description: 'second', addedAt: '2026-03-01', lastReviewedAt: '2026-02-01', requiresRegistration: true },
  { id: 'c', name: 'Charlie', category: 'premium-sites', tags: ['video', 'premium'], languages: ['de'], regions: ['eu'], description: 'third', addedAt: '2026-02-01', lastReviewedAt: '2026-03-01', requiresRegistration: true }
];

test('countBy counts scalar field values', () => {
  const counts = countBy(sites, 'category');
  assert.equal(counts.get('free-tube-sites'), 2);
  assert.equal(counts.get('premium-sites'), 1);
});

test('countBy counts array field values', () => {
  const counts = countBy(sites, 'tags');
  assert.equal(counts.get('video'), 3);
  assert.equal(counts.get('free'), 1);
  assert.equal(counts.get('hd'), 1);
});

test('countBy ignores empty values', () => {
  const counts = countBy([{ category: '' }, { category: 'x' }], 'category');
  assert.equal(counts.has(''), false);
  assert.equal(counts.get('x'), 1);
});

test('definitionsInUse drops definitions with no sites', () => {
  const defs = [
    { id: 'free-tube-sites', name: 'Free Tube Sites' },
    { id: 'amateur', name: 'Amateur' },
    { id: 'premium-sites', name: 'Premium Porn Sites' }
  ];
  const result = definitionsInUse(defs, sites, 'category');
  assert.equal(result.length, 2);
  assert.equal(result.some(d => d.id === 'amateur'), false);
});

test('definitionsInUse sorts by count descending', () => {
  const defs = [
    { id: 'premium-sites', name: 'Premium' },
    { id: 'free-tube-sites', name: 'Free' }
  ];
  const result = definitionsInUse(defs, sites, 'category');
  assert.equal(result[0].id, 'free-tube-sites');
  assert.equal(result[0].count, 2);
});

test('definitionsInUse attaches counts for array fields', () => {
  const defs = [
    { id: 'video', name: 'Video' },
    { id: 'unused', name: 'Unused' }
  ];
  const result = definitionsInUse(defs, sites, 'tags');
  assert.equal(result.length, 1);
  assert.equal(result[0].count, 3);
});

test('real categories.json: every category in use is rendered', () => {
  const realSites = loadJson('data/sites.json');
  const defs = loadJson('data/categories.json');
  const inUse = definitionsInUse(defs, realSites, 'category');
  const total = inUse.reduce((sum, d) => sum + d.count, 0);
  assert.equal(total, realSites.length);
});

test('real tags.json: every tag in use is rendered', () => {
  const realSites = loadJson('data/sites.json');
  const defs = loadJson('data/tags.json');
  const inUse = definitionsInUse(defs, realSites, 'tags');
  inUse.forEach(t => assert.ok(t.count > 0));
});

test('filterSites by category', () => {
  assert.equal(filterSites(sites, { category: 'premium-sites' }).length, 1);
  assert.equal(filterSites(sites, { category: 'nope' }).length, 0);
});

test('filterSites combines category and tag', () => {
  assert.equal(filterSites(sites, { category: 'free-tube-sites', tag: 'hd' }).length, 1);
});

test('filterSites by registration', () => {
  assert.equal(filterSites(sites, { registration: 'required' }).length, 2);
  assert.equal(filterSites(sites, { registration: 'none' }).length, 1);
  assert.equal(filterSites(sites, { registration: 'optional' }).length, 0);
});

test('sortSites A-Z and Z-A', () => {
  assert.deepEqual(sortSites(sites, 'az').map(s => s.name), ['Alpha', 'Bravo', 'Charlie']);
  assert.deepEqual(sortSites(sites, 'za').map(s => s.name), ['Charlie', 'Bravo', 'Alpha']);
});

test('sortSites by recently added', () => {
  assert.deepEqual(sortSites(sites, 'recent').map(s => s.name), ['Bravo', 'Charlie', 'Alpha']);
});

test('sortSites by recently reviewed', () => {
  assert.deepEqual(sortSites(sites, 'reviewed').map(s => s.name), ['Charlie', 'Bravo', 'Alpha']);
});

test('paginate slices correctly', () => {
  assert.deepEqual(paginate(sites, 1, 2).map(s => s.id), ['a', 'b']);
  assert.deepEqual(paginate(sites, 2, 2).map(s => s.id), ['c']);
});

test('getTotalPages rounds up and never returns zero', () => {
  assert.equal(getTotalPages(22, 24), 1);
  assert.equal(getTotalPages(25, 24), 2);
  assert.equal(getTotalPages(0, 24), 1);
});

test('search and filter compose', () => {
  const found = searchSites(sites, 'video');
  const filtered = filterSites(found, { category: 'free-tube-sites' });
  assert.equal(filtered.length, 2);
});
