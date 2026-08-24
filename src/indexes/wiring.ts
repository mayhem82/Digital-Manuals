// Wiring/electrical index (BUILD.md section 15): a mechanic searches a component
// and finds every related electrical item in one place.

import { loadVisuals, loadPartsLinks } from "../data/loader";
import type { VisualAsset, PartsLink } from "../data/types";

const ELECTRICAL_TYPES = new Set([
  "wiring-diagram", "connector", "relay", "fuse", "ground", "sensor", "actuator", "module"
]);

export interface WiringIndexEntry {
  visual: VisualAsset;
  relatedParts: PartsLink[];
}

export async function buildWiringIndex(): Promise<WiringIndexEntry[]> {
  const [visuals, parts] = await Promise.all([loadVisuals(), loadPartsLinks()]);
  return visuals
    .filter((v) => ELECTRICAL_TYPES.has(v.type))
    .map((visual) => ({
      visual,
      relatedParts: parts.filter((p) => p.diagram === visual.id)
    }));
}

export async function findWiringForComponent(component: string): Promise<WiringIndexEntry[]> {
  const all = await buildWiringIndex();
  const q = component.toLowerCase();
  return all.filter(
    (e) =>
      e.visual.title.toLowerCase().includes(q) ||
      e.visual.system.toLowerCase().includes(q) ||
      e.relatedParts.some((p) => p.component.toLowerCase().includes(q))
  );
}
