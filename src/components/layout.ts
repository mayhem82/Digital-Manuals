import { navigate } from "../app/router";

const NAV_ITEMS: { path: string; label: string }[] = [
  { path: "/", label: "Home" },
  { path: "/procedures", label: "Procedures" },
  { path: "/specifications", label: "Specifications" },
  { path: "/fault-codes", label: "Fault Codes" },
  { path: "/wiring", label: "Wiring" },
  { path: "/glossary", label: "Glossary" },
  { path: "/bookmarks", label: "Bookmarks" },
  { path: "/source-gaps", label: "Source Gaps" },
  { path: "/manifest", label: "Build Manifest" }
];

let contentEl: HTMLElement | null = null;

export function mountShell(root: HTMLElement): HTMLElement {
  root.innerHTML = `
    <header class="topbar">
      <span class="brand">Digital Manuals</span>
      <form class="search-form" id="global-search-form">
        <input class="search-input" id="global-search-input" type="search"
          placeholder="Search: fault code, part number, component…" autocomplete="off" />
      </form>
    </header>
    <div class="layout">
      <div class="sidebar">
        <nav id="main-nav"></nav>
      </div>
      <main class="content" id="content"></main>
    </div>
  `;

  const nav = root.querySelector<HTMLElement>("#main-nav")!;
  nav.innerHTML = NAV_ITEMS.map((i) => `<a href="#${i.path}" data-path="${i.path}">${i.label}</a>`).join("");

  const form = root.querySelector<HTMLFormElement>("#global-search-form")!;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = root.querySelector<HTMLInputElement>("#global-search-input")!;
    const q = input.value.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  });

  contentEl = root.querySelector<HTMLElement>("#content")!;
  window.addEventListener("hashchange", updateActiveNav);
  updateActiveNav();

  return contentEl;
}

function updateActiveNav(): void {
  const current = (location.hash.slice(1) || "/").split("?")[0];
  document.querySelectorAll<HTMLAnchorElement>("#main-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.path === current);
  });
}

export function getContentEl(): HTMLElement {
  if (!contentEl) throw new Error("Shell not mounted yet");
  return contentEl;
}
