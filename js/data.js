import { getBasePath } from './utils.js';

let cachedSites = null;
let cachedCategories = null;
let cachedTags = null;

async function fetchJson(path) {
  const base = getBasePath();
  const response = await fetch(`${base}${path}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return response.json();
}

export async function loadSites() {
  if (!cachedSites) {
    cachedSites = await fetchJson('/data/sites.json');
  }
  return cachedSites;
}

export async function loadCategories() {
  if (!cachedCategories) {
    cachedCategories = await fetchJson('/data/categories.json');
  }
  return cachedCategories;
}

export async function loadTags() {
  if (!cachedTags) {
    cachedTags = await fetchJson('/data/tags.json');
  }
  return cachedTags;
}

export function getCategoryName(categories, id) {
  const cat = categories.find(c => c.id === id);
  return cat ? cat.name : id;
}

export function getTagName(tags, id) {
  const tag = tags.find(t => t.id === id);
  return tag ? tag.name : id;
}
