import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSites, validateCategories, validateTags, runValidation } from '../scripts/validate-data.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const categories = [
  { id: 'communities', name: 'Communities' },
  { id: 'live', name: 'Live Streaming' }
];

const tags = [
  { id: 'video', name: 'Video' },
  { id: 'chat', name: 'Chat' }
];

function makeSite(overrides = {}) {
  return {
    id: 'site-a',
    name: 'Site A',
    url: 'https://example.com/a',
    description: 'A site',
    category: 'live',
    tags: ['video'],
    languages: ['en'],
    regions: ['global'],
    requiresRegistration: null,
    featured: false,
    addedAt: '2026-09-01',
    lastReviewedAt: '2026-09-01',
    ...overrides
  };
}

test('validateSites accepts a valid site', () => {
  assert.doesNotThrow(() => validateSites([makeSite()], categories, tags));
});

test('validateSites accepts an empty array', () => {
  assert.doesNotThrow(() => validateSites([], categories, tags));
});

test('validateSites rejects duplicate ids', () => {
  const sites = [
    makeSite({ id: 'dup', url: 'https://example.com/1' }),
    makeSite({ id: 'dup', url: 'https://example.com/2' })
  ];
  assert.throws(() => validateSites(sites, categories, tags), /duplicate id "dup"/);
});

test('validateSites rejects duplicate urls', () => {
  const sites = [
    makeSite({ id: 'a', url: 'https://example.com/same' }),
    makeSite({ id: 'b', url: 'https://example.com/same' })
  ];
  assert.throws(() => validateSites(sites, categories, tags), /duplicate url/);
});

test('validateSites rejects non-HTTPS urls', () => {
  assert.throws(
    () => validateSites([makeSite({ url: 'http://example.com' })], categories, tags),
    /must use HTTPS/
  );
});

test('validateSites rejects unknown category', () => {
  assert.throws(
    () => validateSites([makeSite({ category: 'nonexistent' })], categories, tags),
    /category "nonexistent" does not exist/
  );
});

test('validateSites rejects unknown tag', () => {
  assert.throws(
    () => validateSites([makeSite({ tags: ['bogus'] })], categories, tags),
    /tag "bogus" does not exist/
  );
});

test('validateSites rejects missing required fields', () => {
  const site = makeSite();
  delete site.description;
  assert.throws(() => validateSites([site], categories, tags), /missing required field "description"/);
});

test('validateSites rejects malformed dates', () => {
  assert.throws(
    () => validateSites([makeSite({ addedAt: '01-09-2026' })], categories, tags),
    /addedAt must be in YYYY-MM-DD format/
  );
});

test('validateSites rejects invalid requiresRegistration', () => {
  assert.throws(
    () => validateSites([makeSite({ requiresRegistration: 'yes' })], categories, tags),
    /requiresRegistration must be null, true, or false/
  );
});

test('validateSites rejects non-boolean featured', () => {
  assert.throws(
    () => validateSites([makeSite({ featured: 'true' })], categories, tags),
    /featured must be a boolean/
  );
});

test('validateSites rejects a non-array payload', () => {
  assert.throws(() => validateSites({}, categories, tags), /must be an array/);
});

test('validateCategories rejects duplicate ids', () => {
  assert.throws(
    () => validateCategories([{ id: 'x', name: 'X' }, { id: 'x', name: 'X again' }]),
    /duplicate id "x"/
  );
});

test('validateTags rejects duplicate ids', () => {
  assert.throws(
    () => validateTags([{ id: 't', name: 'T' }, { id: 't', name: 'T again' }]),
    /duplicate id "t"/
  );
});

test('validateCategories rejects missing name', () => {
  assert.throws(() => validateCategories([{ id: 'x' }]), /missing or invalid "name"/);
});

test('runValidation passes on the real project data', () => {
  const result = runValidation(rootDir);
  assert.ok(result.sites > 0, 'sites.json should not be empty');
  assert.ok(result.categories > 0);
  assert.ok(result.tags > 0);
});
