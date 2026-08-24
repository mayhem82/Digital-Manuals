import { search, type SearchResult } from "../search";
import { escapeHtml } from "./badges";
import { navigate } from "../app/router";

const DESTINATIONS: Record<SearchResult["kind"], (id: string) => string> = {
  page: (id) => `/page/${id}`,
  procedure: (id) => `/procedures/${id}`,
  specification: () => `/specifications`,
  "fault-code": () => `/fault-codes`,
  glossary: () => `/glossary`,
  part: () => `/wiring`,
  "toc-heading": (id) => `/documents/${id.split(":")[0]}`
};

export async function renderSearch(el: HTMLElement, query: string): Promise<void> {
  el.innerHTML = `<h1>Search</h1><p class="empty-state">Searching “${escapeHtml(query)}”…</p>`;
  const results = await search(query);

  el.innerHTML = `
    <h1>Search results for “${escapeHtml(query)}”</h1>
    ${
      results.length === 0
        ? `<p class="empty-state">No matches. Nothing has been silently reinterpreted — this reflects the deterministic alias table and ingested data as they currently stand.</p>`
        : results
            .map(
              (r) => `
        <div class="card" data-kind="${r.kind}" data-id="${escapeAttr(r.id)}" style="cursor:pointer">
          <div style="display:flex;justify-content:space-between;gap:8px">
            <strong>${escapeHtml(r.title)}</strong>
            <span class="empty-state">${r.kind} · ${r.matchLayer}</span>
          </div>
          <div class="empty-state">${escapeHtml(r.snippet)}</div>
        </div>`
            )
            .join("")
    }
  `;

  el.querySelectorAll<HTMLElement>("[data-kind]").forEach((card) => {
    card.addEventListener("click", () => {
      const kind = card.dataset.kind as SearchResult["kind"];
      const id = card.dataset.id!;
      navigate(DESTINATIONS[kind](id));
    });
  });
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}
