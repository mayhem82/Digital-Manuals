import { listBookmarks, removeBookmark, updateNote, exportBookmarks, importBookmarks } from "../storage/bookmarks";
import { escapeHtml } from "./badges";
import { navigate } from "../app/router";

const DEST: Record<string, (id: string) => string> = {
  page: (id) => `/page/${id}`,
  procedure: (id) => `/procedures/${id}`,
  specification: () => `/specifications`,
  "fault-code": () => `/fault-codes`,
  diagram: () => `/wiring`,
  glossary: () => `/glossary`
};

export function renderBookmarks(el: HTMLElement): void {
  const draw = () => {
    const items = listBookmarks();
    el.innerHTML = `
      <h1>Bookmarks &amp; Notes</h1>
      <div class="filter-row">
        <button class="btn" id="export-btn">Export as JSON</button>
        <label class="btn" style="display:inline-flex;align-items:center">
          Import JSON<input type="file" id="import-input" accept="application/json" style="display:none" />
        </label>
      </div>
      ${
        items.length === 0
          ? `<p class="empty-state">No bookmarks yet. Bookmark pages, procedures, specifications, fault codes or diagrams as you go.</p>`
          : items
              .map(
                (b) => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;gap:8px">
            <span class="term-link" data-goto="${b.targetType}:${escapeAttr(b.targetId)}">${escapeHtml(b.label)}</span>
            <button class="btn" data-remove="${b.id}">Remove</button>
          </div>
          <textarea data-note="${b.id}" placeholder="Workshop notes…" style="width:100%;margin-top:8px;min-height:60px">${escapeHtml(b.note)}</textarea>
        </div>`
              )
              .join("")
      }
    `;

    el.querySelectorAll<HTMLElement>("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeBookmark(btn.dataset.remove!);
        draw();
      });
    });
    el.querySelectorAll<HTMLTextAreaElement>("[data-note]").forEach((ta) => {
      ta.addEventListener("change", () => updateNote(ta.dataset.note!, ta.value));
    });
    el.querySelectorAll<HTMLElement>("[data-goto]").forEach((link) => {
      link.addEventListener("click", () => {
        const [type, id] = link.dataset.goto!.split(":");
        navigate(DEST[type] ? DEST[type](id) : "/");
      });
    });

    el.querySelector<HTMLButtonElement>("#export-btn")!.addEventListener("click", () => {
      const blob = new Blob([exportBookmarks()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "digital-manuals-bookmarks.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    el.querySelector<HTMLInputElement>("#import-input")!.addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      importBookmarks(text, "merge");
      draw();
    });
  };

  draw();
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}
