import { loadDocuments, loadToc } from "../data/loader";
import { escapeHtml } from "./badges";
import { navigate } from "../app/router";
import type { TocNode } from "../data/types";

export async function renderDocumentToc(el: HTMLElement, docId: string): Promise<void> {
  el.innerHTML = `<p class="empty-state">Loading…</p>`;
  const [documents, tocDocs] = await Promise.all([loadDocuments(), loadToc()]);
  const doc = documents.find((d) => d.id === docId);
  const toc = tocDocs.find((t) => t.document === docId);

  if (!doc) {
    el.innerHTML = `<p class="empty-state">Unknown document: ${escapeHtml(docId)}</p>`;
    return;
  }

  el.innerHTML = `
    <h1>${escapeHtml(doc.title)}</h1>
    <div class="card">
      <strong>Contents</strong>
      <div id="toc-tree" style="margin-top:8px">
        ${toc && toc.nodes.length ? renderNodes(toc.nodes) : `<p class="empty-state">No contents tree yet — this document has not been ingested.</p>`}
      </div>
    </div>
  `;

  el.querySelectorAll<HTMLElement>("[data-dest]").forEach((n) => {
    n.addEventListener("click", () => {
      const dest = n.dataset.dest;
      if (dest) navigate(`/page/${dest}`);
    });
  });
}

function renderNodes(nodes: TocNode[]): string {
  return `<ul style="margin:0;padding-left:18px">${nodes
    .map((n) => {
      const clickable = n.destination && !n.missing;
      const label = escapeHtml(n.label);
      const page = n.source_page !== null ? ` <span class="empty-state">p.${n.source_page}</span>` : "";
      const row = n.missing
        ? `<span style="color:var(--danger)">${label}${page} — SOURCE MATERIAL NOT PRESENT IN SUPPLIED COMPILATION</span>`
        : clickable
        ? `<span class="term-link" data-dest="${n.destination}">${label}</span>${page}`
        : `<span class="empty-state">${label}${page}</span>`;
      const children = n.children && n.children.length ? renderNodes(n.children) : "";
      return `<li style="margin:4px 0">${row}${children}</li>`;
    })
    .join("")}</ul>`;
}
