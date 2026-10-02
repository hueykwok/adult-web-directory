import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchSites } from '../js/search.js';

const mockSites = [
  { id: '1', name: 'Example Community', description: 'A friendly community', category: 'communities', tags: ['forum', 'chat'], languages: ['en'], regions: ['global'] },
  { id: '2', name: 'Creator Hub', description: 'Platform for creators', category: 'creator-platforms', tags: ['video', 'photos'], languages: ['en', 'es'], regions: ['us', 'eu'] },
  { id: '3', name: 'Live Stream Site', description: 'Watch live streams', category: 'live', tags: ['video', 'chat'], languages: ['ja'], regions: ['jp'] }
];

test('searchSites returns all sites for empty query', () => {
  const result = searchSites(mockSites, '');
  assert.equal(result.length, 3);
});

test('searchSites is case insensitive', () => {
  const result = searchSites(mockSites, 'EXAMPLE');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, '1');
});

test('searchSites trims whitespace', () => {
  const result = searchSites(mockSites, '  community  ');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, '1');
});

test('searchSites supports partial match', () => {
  const result = searchSites(mockSites, 'comm');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, '1');
});

test('searchSites searches tags', () => {
  const result = searchSites(mockSites, 'forum');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, '1');
});

test('searchSites searches languages', () => {
  const result = searchSites(mockSites, 'spanish');
  assert.equal(result.length, 0);
});

test('searchSites searches regions', () => {
  const result = searchSites(mockSites, 'japan');
  assert.equal(result.length, 0);
});

test('searchSites with multiple terms requires all to match', () => {
  const result = searchSites(mockSites, 'creator video');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, '2');
});

test('searchSites returns empty array for no match', () => {
  const result = searchSites(mockSites, 'nonexistent');
  assert.equal(result.length, 0);
});
