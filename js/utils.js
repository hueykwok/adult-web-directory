export function debounce(fn, delay = 200) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function getBasePath() {
  const path = window.location.pathname;
  const parts = path.split('/');
  if (parts[parts.length - 1] === 'index.html' || parts[parts.length - 1] === '') {
    return parts.slice(0, -1).join('/') || '';
  }
  return path;
}
