import { loadSourceGaps, loadDocuments } from "../data/loader";
import { escapeHtml } from "./badges";

export async function renderSourceGaps(el: HTMLElement): Promise<void> {
  el.innerHTML = `<p class="empty-state">Loading…</p>`;
  const [gaps, documents] = await Promise.all([loadSourceGaps(), loadDocuments()]);
  const titleFor = (id: string) => documents.find((d) => d.id === id)?.title ?? id;

  el.innerHTML = `
    <h1>Known Source Gaps</h1>
    <p class="empty-state">Content explicitly absent from the supplied compilation (BUILD.md section 4). Nothing here is invented or replaced.</p>
    ${gaps
      .map(
        (g) => `
      <div class="card">
        <strong>${escapeHtml(titleFor(g.document))}</strong>
        <p>${escapeHtml(g.description)}</p>
        ${
          g.source_manual_pages.length
            ? `<div class="empty-state">Source/manual pages: ${g.source_manual_pages.join(", ")}</div>`
            : ""
        }
        <div class="gap-banner" style="margin-top:8px">SOURCE MATERIAL NOT PRESENT IN SUPPLIED COMPILATION</div>
      </div>`
      )
      .join("")}
  `;
}
