// Best score in browser storage. Storage can be unavailable (private mode), so never throw.
const KEY = 'zombie-road-best';

export function loadBest() {
  try {
    return parseInt(localStorage.getItem(KEY), 10) || 0;
  } catch (e) {
    return 0;
  }
}

export function saveBest(value) {
  try {
    localStorage.setItem(KEY, String(value));
  } catch (e) {
    // ignore
  }
}
