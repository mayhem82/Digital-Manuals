import { loadFaultCodes } from "../data/loader";
import { verificationBadge, escapeHtml } from "./badges";

export async function renderFaultCodes(el: HTMLElement): Promise<void> {
  el.innerHTML = `<p class="empty-state">Loading…</p>`;
  const codes = await loadFaultCodes();

  el.innerHTML = `
    <h1>Fault Code Register</h1>
    <p class="empty-state">Causes are never inferred beyond what the source manual states (BUILD.md section 14).</p>
    ${
      codes.length === 0
        ? `<p class="empty-state">No fault codes ingested yet.</p>`
        : codes
            .map(
              (c) => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;gap:8px">
            <strong>${escapeHtml(c.code)}</strong>
            ${verificationBadge(c.verification)}
          </div>
          <div class="empty-state">${escapeHtml(c.system)}</div>
          <p>${escapeHtml(c.source_wording)}</p>
          ${c.conditions.length ? `<strong>Conditions</strong><ul>${c.conditions.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>` : ""}
          ${c.checks.length ? `<strong>Checks</strong><ul>${c.checks.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>` : ""}
        </div>`
            )
            .join("")
    }
  `;
}
