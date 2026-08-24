import type { Verification } from "../data/types";

export function verificationBadge(v: Verification): string {
  const cls = v.toLowerCase().replace(/\s+/g, "-").replace("source-missing", "missing");
  return `<span class="badge ${cls}">${v}</span>`;
}

export function gapBanner(message: string): string {
  return `<div class="gap-banner">⚠ SOURCE MATERIAL NOT PRESENT IN SUPPLIED COMPILATION — ${escapeHtml(message)}</div>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
