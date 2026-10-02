import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

test('sites.json is valid JSON array', () => {
  const sites = loadJson(join(rootDir, 'data/sites.json'));
  assert.ok(Array.isArray(sites));
});

test('categories.json is valid JSON array', () => {
  const categories = loadJson(join(rootDir, 'data/categories.json'));
  assert.ok(Array.isArray(categories));
  assert.ok(categories.length > 0);
});

test('tags.json is valid JSON array', () => {
  const tags = loadJson(join(rootDir, 'data/tags.json'));
  assert.ok(Array.isArray(tags));
  assert.ok(tags.length > 0);
});

test('all site IDs are unique', () => {
  const sites = loadJson(join(rootDir, 'data/sites.json'));
  const ids = sites.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('all site URLs are unique', () => {
  const sites = loadJson(join(rootDir, 'data/sites.json'));
  const urls = sites.map(s => s.url);
  assert.equal(new Set(urls).size, urls.length);
});

test('all site URLs use HTTPS', () => {
  const sites = loadJson(join(rootDir, 'data/sites.json'));
  for (const site of sites) {
    assert.ok(site.url.startsWith('https://'), `URL must be HTTPS: ${site.url}`);
  }
});

test('all site categories exist in categories.json', () => {
  const sites = loadJson(join(rootDir, 'data/sites.json'));
  const categories = loadJson(join(rootDir, 'data/categories.json'));
  const categoryIds = new Set(categories.map(c => c.id));
  for (const site of sites) {
    assert.ok(categoryIds.has(site.category), `Category "${site.category}" not found`);
  }
});

test('all site tags exist in tags.json', () => {
  const sites = loadJson(join(rootDir, 'data/sites.json'));
  const tags = loadJson(join(rootDir, 'data/tags.json'));
  const tagIds = new Set(tags.map(t => t.id));
  for (const site of sites) {
    for (const tag of site.tags) {
      assert.ok(tagIds.has(tag), `Tag "${tag}" not found`);
    }
  }
});

test('all dates are in YYYY-MM-DD format', () => {
  const sites = loadJson(join(rootDir, 'data/sites.json'));
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  for (const site of sites) {
    if (site.addedAt) assert.ok(dateRegex.test(site.addedAt), `Invalid addedAt: ${site.addedAt}`);
    if (site.lastReviewedAt) assert.ok(dateRegex.test(site.lastReviewedAt), `Invalid lastReviewedAt: ${site.lastReviewedAt}`);
  }
});

test('all required fields are present', () => {
  const sites = loadJson(join(rootDir, 'data/sites.json'));
  const required = ['id', 'name', 'url', 'description', 'category', 'tags', 'languages', 'regions', 'requiresRegistration', 'featured', 'addedAt', 'lastReviewedAt'];
  for (const site of sites) {
    for (const field of required) {
      assert.ok(field in site, `Missing field "${field}" in site ${site.id}`);
    }
  }
});

test('requiresRegistration is null, true, or false', () => {
  const sites = loadJson(join(rootDir, 'data/sites.json'));
  for (const site of sites) {
    assert.ok(
      site.requiresRegistration === null || site.requiresRegistration === true || site.requiresRegistration === false,
      `Invalid requiresRegistration in site ${site.id}`
    );
  }
});

test('featured is boolean', () => {
  const sites = loadJson(join(rootDir, 'data/sites.json'));
  for (const site of sites) {
    assert.equal(typeof site.featured, 'boolean', `featured must be boolean in site ${site.id}`);
  }
});
