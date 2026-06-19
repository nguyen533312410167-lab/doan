const PREFIX = "finance_manager_";

export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  return value;
}

export function removeStorage(key) {
  localStorage.removeItem(`${PREFIX}${key}`);
}

export function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
