import { loadSpecifications } from "../data/loader";
import { verificationBadge, escapeHtml } from "./badges";

export async function renderSpecifications(el: HTMLElement): Promise<void> {
  el.innerHTML = `<p class="empty-state">Loading…</p>`;
  const specs = await loadSpecifications();

  el.innerHTML = `
    <h1>Specifications &amp; Torque Values</h1>
    <p class="empty-state">Every value below retains what it applies to — never shown in isolation (BUILD.md section 13).</p>
    ${
      specs.length === 0
        ? `<p class="empty-state">No specifications ingested yet.</p>`
        : `<div class="card" style="overflow-x:auto">
            <table>
              <tr><th>Category</th><th>Applies To</th><th>Value</th><th>System</th><th>Status</th></tr>
              ${specs
                .map(
                  (s) => `<tr>
                    <td>${escapeHtml(s.category)}</td>
                    <td>${escapeHtml(s.applies_to)}</td>
                    <td>${escapeHtml(s.value)}</td>
                    <td>${escapeHtml(s.system)}</td>
                    <td>${verificationBadge(s.verification)}</td>
                  </tr>`
                )
                .join("")}
            </table>
          </div>`
    }
  `;
}
