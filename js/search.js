export function searchSites(sites, query) {
  const q = query.trim().toLowerCase();
  if (!q) return sites;

  return sites.filter(site => {
    const searchable = [
      site.name || '',
      site.description || '',
      site.category || '',
      ...(site.tags || []),
      ...(site.languages || []),
      ...(site.regions || [])
    ].join(' ').toLowerCase();

    return q.split(/\s+/).every(term => searchable.includes(term));
  });
}
