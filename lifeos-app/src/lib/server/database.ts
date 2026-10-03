import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

type SqlValue = string | number | bigint | null | Uint8Array;
type RunResult = { changes: number | bigint; lastInsertRowid: number | bigint };
type SqliteStatement = {
  all(...values: SqlValue[]): unknown[];
  get(...values: SqlValue[]): unknown;
  run(...values: SqlValue[]): RunResult;
};
type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
};
type DatabaseConstructor = new (filename: string) => SqliteDatabase;

type UserRecord = { id: string; username: string; displayName: string; passwordHash: string };
type StoredRecord = { user_id: string; collection: string; record_id: string; payload: string };

const collections = new Set([
  "profile", "accounts", "categories", "transactions", "habits", "habit_logs",
  "goals", "tasks", "tracking_entries",
]);
const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 30;
const globalDatabase = globalThis as typeof globalThis & { lifeosDatabase?: SqliteDatabase };

function openDatabase(): SqliteDatabase {
  const filePath = join(process.cwd(), "data", "lifeos.sqlite");
  mkdirSync(dirname(filePath), { recursive: true });
  const require = createRequire(join(process.cwd(), "package.json"));
  const { DatabaseSync } = require("node:sqlite") as { DatabaseSync: DatabaseConstructor };
  const database = new DatabaseSync(filePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL COLLATE NOCASE UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_records (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      collection TEXT NOT NULL,
      record_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      PRIMARY KEY (user_id, collection, record_id)
    );
  `);
  return database;
}

export const database = globalDatabase.lifeosDatabase ??= openDatabase();

export function isCollection(value: string): boolean {
  return collections.has(value);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export function passwordMatches(password: string, storedHash: string): boolean {
  const [saltHex, keyHex] = storedHash.split(":");
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length > 0 && timingSafeEqual(actual, expected);
}

export function createUser(username: string, displayName: string, password: string): UserRecord {
  const user = {
    id: randomBytes(16).toString("hex"),
    username: username.trim().toLowerCase(),
    displayName: displayName.trim(),
    passwordHash: hashPassword(password),
  };
  database.prepare("INSERT INTO users (id, username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(user.id, user.username, user.displayName, user.passwordHash, new Date().toISOString());
  return user;
}

export function findUserByUsername(username: string): UserRecord | null {
  const row = database.prepare("SELECT id, username, display_name, password_hash FROM users WHERE username = ?")
    .get(username.trim()) as { id: string; username: string; display_name: string; password_hash: string } | undefined;
  return row ? { id: row.id, username: row.username, displayName: row.display_name, passwordHash: row.password_hash } : null;
}

export function findUserById(id: string): UserRecord | null {
  const row = database.prepare("SELECT id, username, display_name, password_hash FROM users WHERE id = ?")
    .get(id) as { id: string; username: string; display_name: string; password_hash: string } | undefined;
  return row ? { id: row.id, username: row.username, displayName: row.display_name, passwordHash: row.password_hash } : null;
}

export function updatePassword(username: string, password: string): boolean {
  const result = database.prepare("UPDATE users SET password_hash = ? WHERE username = ?")
    .run(hashPassword(password), username.trim());
  return result.changes > 0;
}

export function updatePasswordForUser(id: string, password: string): boolean {
  const result = database.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .run(hashPassword(password), id);
  return result.changes > 0;
}

export function removeUserSessions(userId: string): void {
  database.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function createSession(userId: string): string {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(tokenHash, userId, Date.now() + sessionLifetimeMs);
  return token;
}

export function findUserBySession(token: string): Omit<UserRecord, "passwordHash"> | null {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const session = database.prepare("SELECT user_id, expires_at FROM sessions WHERE token_hash = ?")
    .get(tokenHash) as { user_id: string; expires_at: number } | undefined;
  if (!session || session.expires_at <= Date.now()) {
    if (session) database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
    return null;
  }
  const user = database.prepare("SELECT id, username, display_name FROM users WHERE id = ?")
    .get(session.user_id) as { id: string; username: string; display_name: string } | undefined;
  return user ? { id: user.id, username: user.username, displayName: user.display_name } : null;
}

export function deleteSession(token: string): void {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

export function insertRecord(userId: string, collection: string, value: Record<string, unknown>): void {
  const id = typeof value.id === "string" ? value.id : collection;
  database.prepare("INSERT INTO user_records (user_id, collection, record_id, payload) VALUES (?, ?, ?, ?)")
    .run(userId, collection, id, JSON.stringify(value));
}

export function initializeUserData(
  userId: string,
  displayName: string,
  legacyData: Record<string, unknown> = {},
): void {
  const existing = listRecords(userId);
  if (existing.profile.length) return;

  database.exec("BEGIN");
  try {
    const legacyProfile = legacyData.profile && typeof legacyData.profile === "object"
      ? legacyData.profile as Record<string, unknown>
      : {};
    const now = new Date().toISOString();
    insertRecord(userId, "profile", {
      ...legacyProfile,
      id: "profile",
      name: typeof legacyProfile.name === "string" && legacyProfile.name.trim() ? legacyProfile.name : displayName,
      currency: typeof legacyProfile.currency === "string" ? legacyProfile.currency : "BDT",
      currencySymbol: typeof legacyProfile.currencySymbol === "string" ? legacyProfile.currencySymbol : "৳",
      theme: legacyProfile.theme === "dark" || legacyProfile.theme === "system" ? legacyProfile.theme : "light",
      isSetupComplete: true,
      createdAt: typeof legacyProfile.createdAt === "string" ? legacyProfile.createdAt : now,
      updatedAt: now,
    });

    for (const collection of collections) {
      if (collection === "profile") continue;
      const legacyRecords = legacyData[collection];
      if (!Array.isArray(legacyRecords)) continue;
      for (const item of legacyRecords) {
        if (!item || typeof item !== "object" || typeof (item as { id?: unknown }).id !== "string") continue;
        insertRecord(userId, collection, item as Record<string, unknown>);
      }
    }

    const imported = listRecords(userId);
    if (!imported.categories.length) {
      const expenseCategories = ['Food', 'Groceries', 'Transport', 'Housing', 'Utilities', 'Shopping', 'Entertainment', 'Health', 'Education', 'Travel', 'Family', 'Personal', 'Other'];
      const incomeCategories = ['Salary', 'Freelance', 'Bonus', 'Investment', 'Gift', 'Other'];
      for (const name of expenseCategories) insertRecord(userId, "categories", { id: randomBytes(12).toString("hex"), name, type: "expense", isDefault: true });
      for (const name of incomeCategories) insertRecord(userId, "categories", { id: randomBytes(12).toString("hex"), name, type: "income", isDefault: true });
    }
    if (!imported.accounts.length) {
      insertRecord(userId, "accounts", { id: randomBytes(12).toString("hex"), name: "Cash", type: "cash", openingBalance: 0, isActive: true, createdAt: now, updatedAt: now });
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function listRecords(userId: string): Record<string, Record<string, unknown>[]> {
  const rows = database.prepare("SELECT collection, payload FROM user_records WHERE user_id = ?")
    .all(userId) as Pick<StoredRecord, "collection" | "payload">[];
  const result: Record<string, Record<string, unknown>[]> = {};
  for (const collection of collections) result[collection] = [];
  for (const row of rows) result[row.collection].push(JSON.parse(row.payload) as Record<string, unknown>);
  return result;
}

export function createRecord(userId: string, collection: string, value: Record<string, unknown>): void {
  insertRecord(userId, collection, value);
}

export function updateRecord(userId: string, collection: string, id: string, updates: Record<string, unknown>): Record<string, unknown> | null {
  const row = database.prepare("SELECT payload FROM user_records WHERE user_id = ? AND collection = ? AND record_id = ?")
    .get(userId, collection, id) as { payload: string } | undefined;
  if (!row) return null;
  const updated = { ...JSON.parse(row.payload) as Record<string, unknown>, ...updates, id };
  database.prepare("UPDATE user_records SET payload = ? WHERE user_id = ? AND collection = ? AND record_id = ?")
    .run(JSON.stringify(updated), userId, collection, id);
  return updated;
}

export function removeRecord(userId: string, collection: string, id: string): boolean {
  const result = database.prepare("DELETE FROM user_records WHERE user_id = ? AND collection = ? AND record_id = ?")
    .run(userId, collection, id);
  return result.changes > 0;
}

export function removeRecords(userId: string, collection: string, ids: string[]): void {
  const statement = database.prepare("DELETE FROM user_records WHERE user_id = ? AND collection = ? AND record_id = ?");
  database.exec("BEGIN");
  try {
    for (const id of ids) statement.run(userId, collection, id);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function replaceRecords(userId: string, collection: string, items: Record<string, unknown>[]): void {
  database.exec("BEGIN");
  try {
    database.prepare("DELETE FROM user_records WHERE user_id = ? AND collection = ?").run(userId, collection);
    for (const item of items) insertRecord(userId, collection, item);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function clearUserCollectionRecords(userId: string, collection: string): void {
  database.prepare("DELETE FROM user_records WHERE user_id = ? AND collection = ?").run(userId, collection);
}

export function clearUserRecords(userId: string): void {
  database.prepare("DELETE FROM user_records WHERE user_id = ?").run(userId);
}

export function publicUser(user: UserRecord | Omit<UserRecord, "passwordHash">) {
  return { id: user.id, username: user.username, displayName: user.displayName };
}
