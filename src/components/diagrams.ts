import { loadVisuals, loadDocuments } from "../data/loader";
import { escapeHtml } from "./badges";
import type { VisualAsset } from "../data/types";

const base = import.meta.env.BASE_URL;

export async function renderDiagrams(el: HTMLElement): Promise<void> {
  el.innerHTML = `<p class="empty-state">Loading…</p>`;
  const [visuals, documents] = await Promise.all([loadVisuals(), loadDocuments()]);
  const docTitle = new Map(documents.map((d) => [d.id, d.title]));

  el.innerHTML = `
    <h1>Diagrams &amp; Visuals</h1>
    <p class="empty-state">Wiring diagrams, exploded views, photographs and other retained source visuals (BUILD.md section 8). Tap an image to zoom.</p>
    ${
      visuals.length === 0
        ? `<p class="empty-state">No visuals extracted yet.</p>`
        : `<div class="diagram-grid">${visuals.map((v) => cardHtml(v, docTitle.get(v.document) ?? v.document)).join("")}</div>`
    }
    <div id="diagram-lightbox" class="diagram-lightbox" hidden>
      <img id="diagram-lightbox-img" alt="" />
    </div>
  `;

  const lightbox = el.querySelector<HTMLElement>("#diagram-lightbox")!;
  const lightboxImg = el.querySelector<HTMLImageElement>("#diagram-lightbox-img")!;

  el.querySelectorAll<HTMLImageElement>(".diagram-card img").forEach((img) => {
    img.addEventListener("click", () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.hidden = false;
    });
  });
  lightbox.addEventListener("click", () => {
    lightbox.hidden = true;
    lightboxImg.src = "";
  });
}

function cardHtml(v: VisualAsset, documentTitle: string): string {
  const verifiedBadge = v.verified
    ? `<span class="badge verified">VERIFIED</span>`
    : `<span class="badge unverified">UNVERIFIED</span>`;
  return `
    <div class="card diagram-card">
      <img src="${base}${v.asset.replace(/^\//, "")}" alt="${escapeHtml(v.title)}" loading="lazy" />
      <strong>${escapeHtml(v.title)}</strong>
      <div class="empty-state">${escapeHtml(v.type)} · ${escapeHtml(v.system)} · ${escapeHtml(documentTitle)} · p.${v.compilation_page}</div>
      <div class="empty-state">${v.applicability.length ? escapeHtml(v.applicability.join(", ")) : "applicability unknown"} ${verifiedBadge}</div>
    </div>
  `;
}
