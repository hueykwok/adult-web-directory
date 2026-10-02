import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const CONCURRENCY = 5;
const TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 3;

function readGitProxy() {
  for (const key of ['https.proxy', 'http.proxy']) {
    try {
      const out = execFileSync('git', ['config', '--get', key], {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();
      if (out) return out;
    } catch { /* not configured */ }
  }
  return null;
}

function applyProxyFromEnvironment() {
  if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) return null;
  const proxy = readGitProxy();
  if (!proxy) return null;
  return proxy;
}

function reexecWithProxy(proxy) {
  if (process.env.AWD_PROXY_REEXEC === '1') return;
  const result = spawnSync(process.execPath, process.argv.slice(1), {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      HTTPS_PROXY: proxy,
      HTTP_PROXY: proxy,
      NODE_USE_ENV_PROXY: '1',
      AWD_PROXY_REEXEC: '1'
    }
  });
  process.exit(result.status === null ? 1 : result.status);
}

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fd00:/i,
  /^fe80:/i
];

function isPrivateIp(hostname) {
  return PRIVATE_IP_PATTERNS.some(pattern => pattern.test(hostname));
}

function validateUrl(url) {
  if (!url.startsWith('https://')) {
    return { valid: false, reason: 'Not HTTPS' };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'Invalid URL' };
  }

  if (isPrivateIp(parsed.hostname)) {
    return { valid: false, reason: 'Private IP blocked' };
  }

  if (parsed.hostname === 'localhost' || parsed.hostname.endsWith('.local') || parsed.hostname.endsWith('.internal')) {
    return { valid: false, reason: 'Local hostname blocked' };
  }

  return { valid: true, parsed };
}

async function checkLink(url, redirectCount = 0) {
  const validation = validateUrl(url);
  if (!validation.valid) {
    return { url, status: 'unknown', reason: validation.reason, responseTime: 0 };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual',
      headers: {
        'User-Agent': 'AdultWebDirectory-LinkChecker/1.0'
      }
    });

    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location && redirectCount < MAX_REDIRECTS) {
        const redirectUrl = new URL(location, url).toString();
        return checkLink(redirectUrl, redirectCount + 1);
      }
      return { url, status: 'unknown', reason: 'Too many redirects', responseTime };
    }

    if (response.status >= 200 && response.status < 300) {
      return { url, status: 'online', responseTime };
    }

    if (response.status === 403 || response.status === 429) {
      return { url, status: 'blocked', reason: `HTTP ${response.status}`, responseTime };
    }

    if (response.status >= 400) {
      return { url, status: 'offline', reason: `HTTP ${response.status}`, responseTime };
    }

    return { url, status: 'unknown', reason: `Unexpected status ${response.status}`, responseTime };
  } catch (err) {
    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;

    if (err.name === 'AbortError') {
      return { url, status: 'unknown', reason: 'Timeout', responseTime };
    }

    return { url, status: 'offline', reason: err.message, responseTime };
  }
}

async function runWithConcurrency(items, limit, fn) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const promise = fn(item).then(result => {
      executing.delete(promise);
      return result;
    });
    results.push(promise);
    executing.add(promise);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

function classifyStatus(result) {
  if (result.status === 'online') return 'online';
  if (result.status === 'blocked') return 'blocked';
  if (result.status === 'offline') return 'offline';
  return 'unknown';
}

async function main() {
  const proxy = applyProxyFromEnvironment();
  if (proxy) reexecWithProxy(proxy);
  const sitesPath = join(rootDir, 'data/sites.json');
  const reportDir = join(rootDir, 'reports');

  let sites;
  try {
    sites = JSON.parse(readFileSync(sitesPath, 'utf-8'));
  } catch (err) {
    console.error(`Failed to read sites.json: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(sites) || sites.length === 0) {
    console.log('No sites to check.');
    return;
  }

  console.log(`Checking ${sites.length} links...`);

  const results = await runWithConcurrency(sites, CONCURRENCY, site => checkLink(site.url));

  const summary = {
    checkedAt: new Date().toISOString(),
    total: results.length,
    online: 0,
    offline: 0,
    blocked: 0,
    unknown: 0,
    results: results.map(r => ({
      url: r.url,
      status: classifyStatus(r),
      reason: r.reason || null,
      responseTime: r.responseTime
    }))
  };

  for (const r of results) {
    const status = classifyStatus(r);
    summary[status]++;
  }

  mkdirSync(reportDir, { recursive: true });
  const reportPath = join(reportDir, 'link-check-report.json');
  writeFileSync(reportPath, JSON.stringify(summary, null, 2));

  console.log(`Link check complete:`);
  console.log(`  Online:  ${summary.online}`);
  console.log(`  Offline: ${summary.offline}`);
  console.log(`  Blocked: ${summary.blocked}`);
  console.log(`  Unknown: ${summary.unknown}`);
  console.log(`Report saved to: ${reportPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
