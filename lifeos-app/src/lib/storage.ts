// LifeOS — client cache backed by the project-local SQLite store.

type RecordItem = { id: string };
type CollectionSnapshot = Record<string, RecordItem[]>;
const collectionCache = new Map<string, RecordItem[]>();
const itemCache = new Map<string, RecordItem>();

export async function sendDataAction(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to save local data.");
  return result;
}

function getCollectionName(key: string): string {
  return key.replace(/^lifeos_/, "");
}

export class LocalStore<T extends RecordItem> {
  private key: string;
  private collection: string;

  constructor(key: string) {
    this.key = `lifeos_${key}`;
    this.collection = getCollectionName(this.key);
  }

  getAll(): T[] {
    return [...(collectionCache.get(this.key) || [])] as T[];
  }

  hydrate(items: T[]): void {
    collectionCache.set(this.key, [...items]);
  }

  getById(id: string): T | undefined {
    return this.getAll().find(item => item.id === id);
  }

  async create(item: T): Promise<T> {
    const result = await sendDataAction({ action: "create", collection: this.collection, item });
    const saved = result.item as T;
    collectionCache.set(this.key, [...this.getAll(), saved]);
    return saved;
  }

  async update(id: string, updates: Partial<T>): Promise<T | undefined> {
    if (!this.getById(id)) return undefined;
    const result = await sendDataAction({ action: "update", collection: this.collection, id, updates });
    const saved = result.item as T;
    collectionCache.set(this.key, this.getAll().map(item => item.id === id ? saved : item));
    return saved;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.getById(id)) return false;
    await sendDataAction({ action: "delete", collection: this.collection, id });
    collectionCache.set(this.key, this.getAll().filter(item => item.id !== id));
    return true;
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (!ids.length) return;
    await sendDataAction({ action: "delete-many", collection: this.collection, ids });
    const removed = new Set(ids);
    collectionCache.set(this.key, this.getAll().filter(item => !removed.has(item.id)));
  }

  async replaceAll(items: T[]): Promise<void> {
    await sendDataAction({ action: "replace", collection: this.collection, items });
    this.hydrate(items);
  }

  async clear(): Promise<void> {
    await sendDataAction({ action: "clear", collection: this.collection });
    this.hydrate([]);
  }

  count(): number {
    return this.getAll().length;
  }
}

export function hydrateCollections(snapshot: CollectionSnapshot): void {
  for (const [collection, items] of Object.entries(snapshot)) {
    collectionCache.set(`lifeos_${collection}`, items);
  }
  const profile = snapshot.profile?.[0];
  if (profile) itemCache.set("lifeos_profile", profile);
  else itemCache.delete("lifeos_profile");
}

export function resetClientCache(): void {
  collectionCache.clear();
  itemCache.clear();
}

export function getItem<T>(key: string): T | null {
  return (itemCache.get(`lifeos_${key}`) as T | undefined) || null;
}

export async function setItem<T extends RecordItem>(key: string, value: T): Promise<void> {
  const collection = getCollectionName(`lifeos_${key}`);
  const existing = itemCache.get(`lifeos_${key}`);
  const result = existing
    ? await sendDataAction({ action: "update", collection, id: existing.id, updates: value })
    : await sendDataAction({ action: "create", collection, item: value });
  const saved = result.item as T;
  itemCache.set(`lifeos_${key}`, saved);
  collectionCache.set(`lifeos_${key}`, [saved]);
}

export async function removeItem(key: string): Promise<void> {
  const item = itemCache.get(`lifeos_${key}`);
  if (item) await sendDataAction({ action: "delete", collection: getCollectionName(`lifeos_${key}`), id: item.id });
  itemCache.delete(`lifeos_${key}`);
  collectionCache.delete(`lifeos_${key}`);
}

const legacyKeys = ['profile', 'accounts', 'categories', 'transactions', 'habits', 'habit_logs', 'goals', 'tasks', 'tracking_entries'];

export function readLegacyData(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  const data: Record<string, unknown> = {};
  for (const key of legacyKeys) {
    const stored = localStorage.getItem(`lifeos_${key}`);
    if (stored !== null) data[key] = JSON.parse(stored) as unknown;
  }
  return data;
}

export function clearLegacyData(): void {
  if (typeof window === 'undefined') return;
  for (const key of legacyKeys) localStorage.removeItem(`lifeos_${key}`);
}
