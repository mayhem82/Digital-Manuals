import { loadProcedures } from "../data/loader";
import { verificationBadge, escapeHtml } from "./badges";
import { matchesApplicability, APPLICABILITY_TAGS } from "../indexes/applicability";
import type { Procedure } from "../data/types";

export async function renderProcedures(el: HTMLElement, procId?: string): Promise<void> {
  el.innerHTML = `<p class="empty-state">Loading…</p>`;
  const procedures = await loadProcedures();

  if (procId) {
    const proc = procedures.find((p) => p.id === procId);
    el.innerHTML = proc ? renderDetail(proc) : `<p class="empty-state">Procedure ${escapeHtml(procId)} not found.</p>`;
    return;
  }

  renderList(el, procedures);
}

function renderList(el: HTMLElement, procedures: Procedure[]): void {
  const active = new Set<string>();

  const draw = () => {
    const filtered = procedures.filter((p) => matchesApplicability(p.applicability, [...active]));
    el.innerHTML = `
      <h1>Procedures</h1>
      <div class="filter-row" id="filters">
        ${APPLICABILITY_TAGS.map((t) => `<button class="filter-chip${active.has(t) ? " active" : ""}" data-tag="${t}">${t}</button>`).join("")}
      </div>
      ${
        filtered.length === 0
          ? `<p class="empty-state">No procedures yet — none have been ingested from the source manual.</p>`
          : filtered
              .map(
                (p) => `
          <div class="card" data-id="${p.id}" style="cursor:pointer">
            <div style="display:flex;justify-content:space-between;gap:8px">
              <strong>${escapeHtml(p.title)}</strong>
              ${verificationBadge(p.verification)}
            </div>
            <div class="empty-state">${escapeHtml(p.system)} · ${p.type} · ${p.applicability.join(", ")}</div>
          </div>`
              )
              .join("")
      }
    `;
    el.querySelectorAll<HTMLElement>("[data-tag]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const tag = chip.dataset.tag!;
        active.has(tag) ? active.delete(tag) : active.add(tag);
        draw();
      });
    });
    el.querySelectorAll<HTMLElement>("[data-id]").forEach((card) => {
      card.addEventListener("click", () => (location.hash = `/procedures/${card.dataset.id}`));
    });
  };

  draw();
}

function renderDetail(p: Procedure): string {
  return `
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
      <h1 style="margin:0">${escapeHtml(p.title)}</h1>
      ${verificationBadge(p.verification)}
    </div>
    <p class="empty-state">${escapeHtml(p.system)} · ${p.type} · applies to: ${p.applicability.join(", ") || "unknown"}</p>

    ${p.warnings.length ? `<div class="gap-banner" style="color:var(--warn);border-color:var(--warn)">${p.warnings.map(escapeHtml).join("<br/>")}</div>` : ""}

    ${section("Prerequisites", p.prerequisites)}
    ${section("Tools Required", p.tools)}

    <h2>Steps</h2>
    ${
      p.steps.length
        ? `<ol>${p.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`
        : `<p class="empty-state">No steps recorded.</p>`
    }

    ${
      p.torque_values.length
        ? `<h2>Torque Values</h2><table><tr><th>Spec</th><th>Value</th></tr>${p.torque_values
            .map((t) => `<tr><td>${escapeHtml(t.spec)}</td><td>${escapeHtml(t.value)}</td></tr>`)
            .join("")}</table>`
        : ""
    }

    ${
      p.sources.length
        ? `<h2>Source</h2><p class="empty-state">${p.sources
            .map((s) => `${escapeHtml(s.document)} p.${s.source_page} (compilation p.${s.compilation_page})`)
            .join(" · ")}</p>`
        : ""
    }
  `;
}

function section(title: string, items: string[]): string {
  if (!items.length) return "";
  return `<h2>${title}</h2><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
}
