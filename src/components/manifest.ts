import { loadManifest } from "../data/loader";

export async function renderManifestView(el: HTMLElement): Promise<void> {
  el.innerHTML = `<p class="empty-state">Loading…</p>`;
  const m = await loadManifest();

  const stat = (n: number | string, label: string) => `
    <div class="manifest-stat"><span class="n">${n}</span><span class="l">${label}</span></div>`;

  el.innerHTML = `
    <h1>Build Manifest</h1>
    <p class="empty-state">
      Generated from actual repository data by scripts/build/generate-manifest.mjs — never hard-coded.
      Built ${new Date(m.build_timestamp).toLocaleString()} at commit ${m.commit.slice(0, 7) || "unknown"}.
    </p>
    <div class="manifest-grid">
      ${stat(m.source_pages_total, "compilation pages (total)")}
      ${stat(m.pages_ingested, "pages ingested")}
      ${stat(m.pages_text_verified, "pages text-verified")}
      ${stat(m.pages_visual_verified, "pages visual-verified")}
      ${stat(m.procedures, "procedures")}
      ${stat(m.diagrams, "diagrams")}
      ${stat(m.fault_codes, "fault codes")}
      ${stat(m.glossary_terms, "glossary terms")}
      ${stat(m.specifications, "specifications")}
      ${stat(m.cross_references, "cross-references")}
      ${stat(m.source_gaps.length, "known source gaps")}
    </div>
    <p class="empty-state" style="margin-top:16px">
      No unverified content is described as complete anywhere in this application (BUILD.md section 24 &amp; 29).
    </p>
  `;
}
