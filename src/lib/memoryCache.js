const globalCaches = globalThis.__desaynerMemoryCaches ??= new Map();

export function createMemoryCache(name, { maxEntries = 250, ttlMs = 60_000 } = {}) {
  if (!globalCaches.has(name)) {
    globalCaches.set(name, new Map());
  }

  const store = globalCaches.get(name);

  function prune(now = Date.now()) {
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) store.delete(key);
    }

    while (store.size > maxEntries) {
      store.delete(store.keys().next().value);
    }
  }

  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return null;

      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
      }

      return entry.value;
    },
    set(key, value, ttl = ttlMs) {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttl,
      });
      prune();
    },
    delete(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}
