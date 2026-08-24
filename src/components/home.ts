import { loadDocuments, loadManifest } from "../data/loader";
import { verificationBadge, escapeHtml } from "./badges";
import { navigate } from "../app/router";

export async function renderHome(el: HTMLElement): Promise<void> {
  el.innerHTML = `<p class="empty-state">Loading…</p>`;
  const [documents, manifest] = await Promise.all([loadDocuments(), loadManifest()]);

  el.innerHTML = `
    <h1>Can-Am Spyder RT / RT-S Digital Manual</h1>
    <p class="empty-state">
      A digitized workshop manual built from structured data — not a wrapped PDF.
      ${manifest.pages_ingested} of ${manifest.source_pages_total} compilation pages ingested so far.
    </p>
    <h2>Source Documents</h2>
    <div id="doc-list"></div>
  `;

  const list = el.querySelector<HTMLElement>("#doc-list")!;
  list.innerHTML = documents
    .map(
      (d) => `
      <div class="card" data-doc="${d.id}" style="cursor:pointer">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <strong>${escapeHtml(d.title)}</strong>
          ${verificationBadge(d.verification)}
        </div>
        <div class="empty-state" style="margin-top:4px">
          ${d.applicability.join(" · ")} — ${d.pages_ingested} pages ingested
          ${d.pages_total_expected ? ` / ${d.pages_total_expected} expected` : ""}
          <br/>status: ${escapeHtml(d.status)}
        </div>
      </div>`
    )
    .join("");

  list.querySelectorAll<HTMLElement>("[data-doc]").forEach((card) => {
    card.addEventListener("click", () => navigate(`/documents/${card.dataset.doc}`));
  });
}
