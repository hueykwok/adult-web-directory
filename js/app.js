import { loadSites, loadCategories, loadTags, getCategoryName, getTagName } from './data.js';
import { searchSites } from './search.js';
import { filterSites, sortSites, paginate, getTotalPages, countBy, definitionsInUse } from './filters.js';
import { getAgeConfirmed, setAgeConfirmed, getTheme, setTheme, getFavorites, toggleFavorite } from './storage.js';
import { debounce, escapeHtml, formatDate } from './utils.js';

const state = {
  sites: [],
  categories: [],
  tags: [],
  search: '',
  category: '',
  tag: '',
  language: '',
  region: '',
  registration: '',
  status: '',
  sort: 'az',
  page: 1,
  perPage: 24,
  favoritesOnly: false,
  favorites: []
};

let elements = {};

function initElements() {
  elements = {
    ageGate: document.getElementById('ageGate'),
    ageEnter: document.getElementById('ageEnter'),
    ageExit: document.getElementById('ageExit'),
    themeToggle: document.getElementById('themeToggle'),
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    categoryList: document.getElementById('categoryList'),
    filterTag: document.getElementById('filterTag'),
    filterLanguage: document.getElementById('filterLanguage'),
    filterRegion: document.getElementById('filterRegion'),
    filterRegistration: document.getElementById('filterRegistration'),
    filterStatus: document.getElementById('filterStatus'),
    sortOrder: document.getElementById('sortOrder'),
    resetFilters: document.getElementById('resetFilters'),
    resultCount: document.getElementById('resultCount'),
    resultsGrid: document.getElementById('resultsGrid'),
    emptyState: document.getElementById('emptyState'),
    pagination: document.getElementById('pagination'),
    favoritesToggle: document.getElementById('favoritesToggle')
  };
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  setTheme(theme);
}

function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

function handleAgeEnter() {
  setAgeConfirmed(true);
  elements.ageGate.hidden = true;
}

function handleAgeExit() {
  window.location.href = 'https://www.google.com';
}

function getCategoriesInUse() {
  return definitionsInUse(state.categories, state.sites, 'category');
}

function populateCategories() {
  const allBtn = document.createElement('button');
  allBtn.className = 'category-btn category-btn--active';
  allBtn.textContent = `All (${state.sites.length})`;
  allBtn.dataset.category = '';
  allBtn.setAttribute('role', 'tab');
  allBtn.setAttribute('aria-selected', 'true');
  elements.categoryList.appendChild(allBtn);

  getCategoriesInUse().forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'category-btn';
    btn.textContent = `${cat.name} (${cat.count})`;
    btn.dataset.category = cat.id;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    elements.categoryList.appendChild(btn);
  });
}

function populateFilterOptions() {
  const languages = new Set();
  const regions = new Set();
  state.sites.forEach(site => {
    (site.languages || []).forEach(l => languages.add(l));
    (site.regions || []).forEach(r => regions.add(r));
  });

  [...languages].sort().forEach(lang => {
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = lang.toUpperCase();
    elements.filterLanguage.appendChild(opt);
  });

  [...regions].sort().forEach(reg => {
    const opt = document.createElement('option');
    opt.value = reg;
    opt.textContent = reg.charAt(0).toUpperCase() + reg.slice(1);
    elements.filterRegion.appendChild(opt);
  });

  definitionsInUse(state.tags, state.sites, 'tags').forEach(tag => {
    const opt = document.createElement('option');
    opt.value = tag.id;
    opt.textContent = `${tag.name} (${tag.count})`;
    elements.filterTag.appendChild(opt);
  });
}

function getFilteredSites() {
  let result = state.sites;

  if (state.favoritesOnly) {
    result = result.filter(s => state.favorites.includes(s.id));
  }

  result = searchSites(result, state.search);
  result = filterSites(result, {
    category: state.category,
    tag: state.tag,
    language: state.language,
    region: state.region,
    registration: state.registration,
    status: state.status
  });
  result = sortSites(result, state.sort);

  return result;
}

function renderResults() {
  const filtered = getFilteredSites();
  const totalPages = getTotalPages(filtered.length, state.perPage);
  if (state.page > totalPages) state.page = totalPages;

  const pageItems = paginate(filtered, state.page, state.perPage);

  elements.resultCount.textContent = `${filtered.length} website${filtered.length !== 1 ? 's' : ''} found`;

  if (pageItems.length === 0) {
    elements.resultsGrid.innerHTML = '';
    elements.emptyState.hidden = false;
    elements.pagination.innerHTML = '';
    return;
  }

  elements.emptyState.hidden = true;
  elements.resultsGrid.innerHTML = pageItems.map(site => renderSiteCard(site)).join('');

  renderPagination(totalPages);
}

function renderSiteCard(site) {
  const isFav = state.favorites.includes(site.id);
  const status = site.status || 'unknown';
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return `
    <article class="site-card" data-id="${escapeHtml(site.id)}">
      <div class="site-card__header">
        <h3 class="site-card__name">${escapeHtml(site.name)}</h3>
        <span class="site-card__status site-card__status--${status}">
          <span aria-hidden="true">&#9679;</span> ${statusLabel}
        </span>
      </div>
      <p class="site-card__description">${escapeHtml(site.description || '')}</p>
      <div class="site-card__meta">
        <span class="site-card__tag">${escapeHtml(getCategoryName(state.categories, site.category))}</span>
        ${(site.tags || []).map(t => `<span class="site-card__tag">${escapeHtml(getTagName(state.tags, t))}</span>`).join('')}
        ${(site.languages || []).map(l => `<span class="site-card__tag">${escapeHtml(l.toUpperCase())}</span>`).join('')}
      </div>
      <div class="site-card__footer">
        <span>Reviewed: ${formatDate(site.lastReviewedAt)}</span>
        <div class="site-card__actions">
          <button class="site-card__fav ${isFav ? 'site-card__fav--active' : ''}" data-fav="${escapeHtml(site.id)}" aria-label="${isFav ? 'Remove from' : 'Add to'} favorites">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <a href="${escapeHtml(site.url)}" target="_blank" rel="noopener noreferrer nofollow" class="site-card__visit">
            Visit
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderPagination(totalPages) {
  if (totalPages <= 1) {
    elements.pagination.innerHTML = '';
    return;
  }

  let html = `<button class="pagination__btn" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''} aria-label="Previous page">Previous</button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination__btn ${i === state.page ? 'pagination__btn--active' : ''}" data-page="${i}" aria-label="Page ${i}" ${i === state.page ? 'aria-current="page"' : ''}>${i}</button>`;
  }

  html += `<button class="pagination__btn" data-page="${state.page + 1}" ${state.page === totalPages ? 'disabled' : ''} aria-label="Next page">Next</button>`;

  elements.pagination.innerHTML = html;
}

function syncUrlParams() {
  const params = new URLSearchParams();
  if (state.search) params.set('search', state.search);
  if (state.category) params.set('category', state.category);
  if (state.tag) params.set('tag', state.tag);
  if (state.language) params.set('language', state.language);
  if (state.region) params.set('region', state.region);
  if (state.registration) params.set('registration', state.registration);
  if (state.status) params.set('status', state.status);
  if (state.sort !== 'az') params.set('sort', state.sort);
  if (state.page > 1) params.set('page', state.page);

  const url = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
  window.history.replaceState({}, '', url);
}

function loadUrlParams() {
  const params = new URLSearchParams(window.location.search);
  state.search = params.get('search') || '';
  state.category = params.get('category') || '';
  state.tag = params.get('tag') || '';
  state.language = params.get('language') || '';
  state.region = params.get('region') || '';
  state.registration = params.get('registration') || '';
  state.status = params.get('status') || '';
  state.sort = params.get('sort') || 'az';
  state.page = parseInt(params.get('page'), 10) || 1;

  elements.searchInput.value = state.search;
  elements.filterTag.value = state.tag;
  elements.filterLanguage.value = state.language;
  elements.filterRegion.value = state.region;
  elements.filterRegistration.value = state.registration;
  elements.filterStatus.value = state.status;
  elements.sortOrder.value = state.sort;
}

function updateCategoryButtons() {
  const buttons = elements.categoryList.querySelectorAll('.category-btn');
  const hasMatch = Array.from(buttons).some(btn => btn.dataset.category === state.category);
  if (!hasMatch) state.category = '';
  buttons.forEach(btn => {
    const isActive = btn.dataset.category === state.category;
    btn.classList.toggle('category-btn--active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function bindEvents() {
  elements.ageEnter.addEventListener('click', handleAgeEnter);
  elements.ageExit.addEventListener('click', handleAgeExit);
  elements.themeToggle.addEventListener('click', toggleTheme);

  elements.searchInput.addEventListener('input', debounce(e => {
    state.search = e.target.value;
    state.page = 1;
    updateCategoryButtons();
    renderResults();
    syncUrlParams();
  }, 200));

  elements.clearSearch.addEventListener('click', () => {
    state.search = '';
    elements.searchInput.value = '';
    state.page = 1;
    renderResults();
    syncUrlParams();
  });

  elements.categoryList.addEventListener('click', e => {
    const btn = e.target.closest('.category-btn');
    if (!btn) return;
    state.category = btn.dataset.category;
    state.page = 1;
    updateCategoryButtons();
    renderResults();
    syncUrlParams();
  });

  elements.filterTag.addEventListener('change', e => {
    state.tag = e.target.value;
    state.page = 1;
    renderResults();
    syncUrlParams();
  });

  elements.filterLanguage.addEventListener('change', e => {
    state.language = e.target.value;
    state.page = 1;
    renderResults();
    syncUrlParams();
  });

  elements.filterRegion.addEventListener('change', e => {
    state.region = e.target.value;
    state.page = 1;
    renderResults();
    syncUrlParams();
  });

  elements.filterRegistration.addEventListener('change', e => {
    state.registration = e.target.value;
    state.page = 1;
    renderResults();
    syncUrlParams();
  });

  elements.filterStatus.addEventListener('change', e => {
    state.status = e.target.value;
    state.page = 1;
    renderResults();
    syncUrlParams();
  });

  elements.sortOrder.addEventListener('change', e => {
    state.sort = e.target.value;
    state.page = 1;
    renderResults();
    syncUrlParams();
  });

  elements.resetFilters.addEventListener('click', () => {
    state.search = '';
    state.category = '';
    state.tag = '';
    state.language = '';
    state.region = '';
    state.registration = '';
    state.status = '';
    state.sort = 'az';
    state.page = 1;
    state.favoritesOnly = false;

    elements.searchInput.value = '';
    elements.filterTag.value = '';
    elements.filterLanguage.value = '';
    elements.filterRegion.value = '';
    elements.filterRegistration.value = '';
    elements.filterStatus.value = '';
    elements.sortOrder.value = 'az';
    elements.favoritesToggle.setAttribute('aria-pressed', 'false');

    updateCategoryButtons();
    renderResults();
    syncUrlParams();
  });

  elements.favoritesToggle.addEventListener('click', () => {
    state.favoritesOnly = !state.favoritesOnly;
    state.page = 1;
    elements.favoritesToggle.setAttribute('aria-pressed', state.favoritesOnly ? 'true' : 'false');
    renderResults();
  });

  elements.pagination.addEventListener('click', e => {
    const btn = e.target.closest('.pagination__btn');
    if (!btn || btn.disabled) return;
    state.page = parseInt(btn.dataset.page, 10);
    renderResults();
    syncUrlParams();
  });

  elements.resultsGrid.addEventListener('click', e => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      const id = favBtn.dataset.fav;
      toggleFavorite(id);
      state.favorites = getFavorites();
      renderResults();
    }
  });
}

async function init() {
  initElements();

  const theme = getTheme();
  applyTheme(theme);

  if (!getAgeConfirmed()) {
    elements.ageGate.hidden = false;
  } else {
    elements.ageGate.hidden = true;
  }

  state.favorites = getFavorites();

  try {
    [state.sites, state.categories, state.tags] = await Promise.all([
      loadSites(),
      loadCategories(),
      loadTags()
    ]);
  } catch (err) {
    elements.resultsGrid.innerHTML = '<p style="color: var(--danger)">Failed to load data. Please try again later.</p>';
    return;
  }

  loadUrlParams();
  populateCategories();
  populateFilterOptions();

  if (state.tag && !elements.filterTag.querySelector(`option[value="${state.tag}"]`)) {
    state.tag = '';
    elements.filterTag.value = '';
  }

  updateCategoryButtons();
  bindEvents();
  renderResults();
}

init();
