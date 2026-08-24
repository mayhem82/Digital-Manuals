import { buildWiringIndex } from "../indexes/wiring";
import { escapeHtml } from "./badges";

export async function renderWiring(el: HTMLElement): Promise<void> {
  el.innerHTML = `<p class="empty-state">Loading…</p>`;
  const entries = await buildWiringIndex();

  el.innerHTML = `
    <h1>Wiring &amp; Electrical Index</h1>
    <p class="empty-state">Diagrams, connectors, relays, fuses, grounds, sensors, actuators and modules in one place (BUILD.md section 15).</p>
    ${
      entries.length === 0
        ? `<p class="empty-state">No wiring/electrical visuals ingested yet.</p>`
        : entries
            .map(
              (e) => `
        <div class="card">
          <strong>${escapeHtml(e.visual.title)}</strong>
          <div class="empty-state">${e.visual.type} · ${escapeHtml(e.visual.system)} · ${e.visual.applicability.join(", ")}</div>
          ${
            e.relatedParts.length
              ? `<div class="empty-state">Related parts: ${e.relatedParts.map((p) => escapeHtml(`${p.part_name} (${p.part_number})`)).join(", ")}</div>`
              : ""
          }
        </div>`
            )
            .join("")
    }
  `;
}
