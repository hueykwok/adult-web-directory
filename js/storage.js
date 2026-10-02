const KEYS = {
  AGE_CONFIRMED: 'awd_age_confirmed',
  THEME: 'awd_theme',
  FAVORITES: 'awd_favorites'
};

export function getAgeConfirmed() {
  try {
    return sessionStorage.getItem(KEYS.AGE_CONFIRMED) === 'true';
  } catch {
    return false;
  }
}

export function setAgeConfirmed(value) {
  try {
    sessionStorage.setItem(KEYS.AGE_CONFIRMED, value ? 'true' : 'false');
  } catch { /* ignore */ }
}

export function getTheme() {
  try {
    return localStorage.getItem(KEYS.THEME) || 'dark';
  } catch {
    return 'dark';
  }
}

export function setTheme(theme) {
  try {
    localStorage.setItem(KEYS.THEME, theme);
  } catch { /* ignore */ }
}

export function getFavorites() {
  try {
    const data = localStorage.getItem(KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setFavorites(favorites) {
  try {
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
  } catch { /* ignore */ }
}

export function toggleFavorite(id) {
  const favorites = getFavorites();
  const index = favorites.indexOf(id);
  if (index === -1) {
    favorites.push(id);
  } else {
    favorites.splice(index, 1);
  }
  setFavorites(favorites);
  return index === -1;
}
