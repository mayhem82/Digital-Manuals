import { loadPages } from "../data/loader";
import { verificationBadge, escapeHtml } from "./badges";
import { linkifyGlossaryTerms, lookupTerm } from "../glossary";
import { addBookmark } from "../storage/bookmarks";

export async function renderPage(el: HTMLElement, pageId: string): Promise<void> {
  el.innerHTML = `<p class="empty-state">Loading…</p>`;
  const pages = await loadPages();
  const page = pages.find((p) => p.id === pageId);

  if (!page) {
    el.innerHTML = `<p class="empty-state">Page ${escapeHtml(pageId)} has not been ingested yet.</p>`;
    return;
  }

  const linked = await linkifyGlossaryTerms(escapeHtml(page.text));

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
      <h1 style="margin:0">${escapeHtml(page.document)} — p.${page.source_page}</h1>
      ${verificationBadge(page.verification)}
    </div>
    <p class="empty-state">Compilation page ${page.compilation_page} · source: ${escapeHtml(page.document)}</p>
    <div class="card"><div id="page-text" style="white-space:pre-wrap">${linked}</div></div>
    <button id="bookmark-btn" class="btn">Bookmark this page</button>
    <div id="term-popover"></div>
  `;

  el.querySelector<HTMLElement>("#page-text")!.addEventListener("click", async (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>(".term-link");
    if (!target) return;
    const term = target.dataset.term;
    if (!term) return;
    const entry = await lookupTerm(term);
    const pop = el.querySelector<HTMLElement>("#term-popover")!;
    pop.innerHTML = entry
      ? `<div class="card"><strong>${escapeHtml(entry.term)}</strong> — ${escapeHtml(entry.expanded)}<br/>${escapeHtml(entry.plain)}</div>`
      : "";
  });

  el.querySelector<HTMLElement>("#bookmark-btn")!.addEventListener("click", () => {
    addBookmark({ targetType: "page", targetId: page.id, label: `${page.document} p.${page.source_page}`, note: "" });
    alert("Bookmarked.");
  });
}
