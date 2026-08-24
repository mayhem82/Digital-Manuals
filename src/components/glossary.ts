import { loadGlossary } from "../data/loader";
import { escapeHtml } from "./badges";

export async function renderGlossary(el: HTMLElement): Promise<void> {
  el.innerHTML = `<p class="empty-state">Loading…</p>`;
  const terms = await loadGlossary();

  el.innerHTML = `
    <h1>Glossary</h1>
    <input id="glossary-filter" placeholder="Filter terms…" style="width:100%;margin-bottom:12px" />
    <div id="glossary-list"></div>
  `;

  const list = el.querySelector<HTMLElement>("#glossary-list")!;
  const draw = (filter: string) => {
    const q = filter.toLowerCase();
    const filtered = terms.filter(
      (t) => !q || t.term.toLowerCase().includes(q) || t.expanded.toLowerCase().includes(q) || t.aliases.some((a) => a.toLowerCase().includes(q))
    );
    list.innerHTML = filtered.length
      ? filtered
          .map(
            (t) => `
        <div class="card">
          <strong>${escapeHtml(t.term)}</strong> — ${escapeHtml(t.expanded)}
          <div class="empty-state">${escapeHtml(t.plain)}</div>
          ${t.aliases.length ? `<div class="empty-state">aliases: ${t.aliases.map(escapeHtml).join(", ")}</div>` : ""}
        </div>`
          )
          .join("")
      : `<p class="empty-state">No glossary terms match yet — the glossary is populated once the source is ingested.</p>`;
  };

  el.querySelector<HTMLInputElement>("#glossary-filter")!.addEventListener("input", (e) => {
    draw((e.target as HTMLInputElement).value);
  });
  draw("");
}
