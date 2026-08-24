// Bookmarks & notes: localStorage plus explicit export/import (BUILD.md section 19 —
// never rely on localStorage alone without export/import).

export interface Bookmark {
  id: string;
  targetType: "page" | "procedure" | "specification" | "fault-code" | "diagram" | "glossary";
  targetId: string;
  label: string;
  note: string;
  createdAt: string;
}

const KEY = "digital-manuals:bookmarks:v1";

function readAll(): Bookmark[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Bookmark[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: Bookmark[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function listBookmarks(): Bookmark[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addBookmark(input: Omit<Bookmark, "id" | "createdAt">): Bookmark {
  const item: Bookmark = {
    ...input,
    id: `BM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString()
  };
  const all = readAll();
  all.push(item);
  writeAll(all);
  return item;
}

export function removeBookmark(id: string): void {
  writeAll(readAll().filter((b) => b.id !== id));
}

export function updateNote(id: string, note: string): void {
  writeAll(readAll().map((b) => (b.id === id ? { ...b, note } : b)));
}

export function exportBookmarks(): string {
  return JSON.stringify({ exported_at: new Date().toISOString(), bookmarks: readAll() }, null, 2);
}

export function importBookmarks(json: string, mode: "merge" | "replace" = "merge"): number {
  const parsed = JSON.parse(json) as { bookmarks: Bookmark[] };
  const incoming = Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [];
  if (mode === "replace") {
    writeAll(incoming);
    return incoming.length;
  }
  const existingIds = new Set(readAll().map((b) => b.id));
  const merged = [...readAll(), ...incoming.filter((b) => !existingIds.has(b.id))];
  writeAll(merged);
  return incoming.length;
}
