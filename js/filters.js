export function filterSites(sites, filters) {
  return sites.filter(site => {
    if (filters.category && site.category !== filters.category) return false;
    if (filters.tag && !(site.tags || []).includes(filters.tag)) return false;
    if (filters.language && !(site.languages || []).includes(filters.language)) return false;
    if (filters.region && !(site.regions || []).includes(filters.region)) return false;
    if (filters.registration) {
      const reg = site.requiresRegistration;
      if (filters.registration === 'required' && reg !== true) return false;
      if (filters.registration === 'optional' && reg !== null) return false;
      if (filters.registration === 'none' && reg !== false) return false;
    }
    if (filters.status && site.status !== filters.status) return false;
    return true;
  });
}

export function sortSites(sites, sortOrder) {
  const sorted = [...sites];
  switch (sortOrder) {
    case 'az':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'za':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'recent':
      sorted.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
      break;
    case 'reviewed':
      sorted.sort((a, b) => new Date(b.lastReviewedAt || 0) - new Date(a.lastReviewedAt || 0));
      break;
  }
  return sorted;
}

export function paginate(sites, page, perPage = 24) {
  const start = (page - 1) * perPage;
  return sites.slice(start, start + perPage);
}

export function getTotalPages(total, perPage = 24) {
  return Math.max(1, Math.ceil(total / perPage));
}
