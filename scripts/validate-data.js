import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const REQUIRED_FIELDS = ['id', 'name', 'url', 'description', 'category', 'tags', 'languages', 'regions', 'requiresRegistration', 'featured', 'addedAt', 'lastReviewedAt'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function loadJson(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    fail(`Failed to parse ${filePath}: ${err.message}`);
  }
}

function validateSites(sites, categories, tags) {
  if (!Array.isArray(sites)) {
    fail('sites.json must be an array');
  }

  const categoryIds = new Set(categories.map(c => c.id));
  const tagIds = new Set(tags.map(t => t.id));
  const seenIds = new Set();
  const seenUrls = new Set();

  sites.forEach((site, index) => {
    const prefix = `sites[${index}]`;

    for (const field of REQUIRED_FIELDS) {
      if (!(field in site)) {
        fail(`${prefix}: missing required field "${field}"`);
      }
    }

    if (seen.id && seenIds.has(site.id)) {
      fail(`${prefix}: duplicate id "${site.id}"`);
    }
    seenIds.add(site.id);

    if (site.url && seenUrls.has(site.url)) {
      fail(`${prefix}: duplicate url "${site.url}"`);
    }
    seenUrls.add(site.url);

    if (!site.url.startsWith('https://')) {
      fail(`${prefix}: url must use HTTPS "${site.url}"`);
    }

    try {
      new URL(site.url);
    } catch {
      fail(`${prefix}: invalid URL "${site.url}"`);
    }

    if (!categoryIds.has(site.category)) {
      fail(`${prefix}: category "${site.category}" does not exist in categories.json`);
    }

    for (const tag of site.tags) {
      if (!tagIds.has(tag)) {
        fail(`${prefix}: tag "${tag}" does not exist in tags.json`);
      }
    }

    for (const field of ['addedAt', 'lastReviewedAt']) {
      if (site[field] && !DATE_REGEX.test(site[field])) {
        fail(`${prefix}: ${field} must be in YYYY-MM-DD format, got "${site[field]}"`);
      }
    }

    if (site.requiresRegistration !== null && site.requiresRegistration !== true && site.requiresRegistration !== false) {
      fail(`${prefix}: requiresRegistration must be null, true, or false`);
    }

    if (typeof site.featured !== 'boolean') {
      fail(`${prefix}: featured must be a boolean`);
    }
  });
}

function validateCategories(categories) {
  if (!Array.isArray(categories)) {
    fail('categories.json must be an array');
  }

  const seenIds = new Set();
  categories.forEach((cat, index) => {
    if (!cat.id || typeof cat.id !== 'string') {
      fail(`categories[${index}]: missing or invalid "id"`);
    }
    if (!cat.name || typeof cat.name !== 'string') {
      fail(`categories[${index}]: missing or invalid "name"`);
    }
    if (seenIds.has(cat.id)) {
      fail(`categories[${index}]: duplicate id "${cat.id}"`);
    }
    seenIds.add(cat.id);
  });
}

function validateTags(tags) {
  if (!Array.isArray(tags)) {
    fail('tags.json must be an array');
  }

  const seenIds = new Set();
  tags.forEach((tag, index) => {
    if (!tag.id || typeof tag.id !== 'string') {
      fail(`tags[${index}]: missing or invalid "id"`);
    }
    if (!tag.name || typeof tag.name !== 'string') {
      fail(`tags[${index}]: missing or invalid "name"`);
    }
    if (seenIds.has(tag.id)) {
      fail(`tags[${index}]: duplicate id "${tag.id}"`);
    }
    seenIds.add(tag.id);
  });
}

const sites = loadJson(join(rootDir, 'data/sites.json'));
const categories = loadJson(join(rootDir, 'data/categories.json'));
const tags = loadJson(join(rootDir, 'data/tags.json'));

validateCategories(categories);
validateTags(tags);
validateSites(sites, categories, tags);

console.log(`Validation passed: ${sites.length} sites, ${categories.length} categories, ${tags.length} tags`);
