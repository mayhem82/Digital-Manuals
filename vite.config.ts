import { defineConfig } from "vite";

// Repo is served from GitHub Pages at /Digital-Manuals/ (GitHub Pages paths
// are case-sensitive and must match the repo name's actual casing exactly),
// so every asset path needs that base — for build, preview, and dev alike
// (dev then serves at http://localhost:5173/Digital-Manuals/, not at the root).
export default defineConfig(() => ({
  base: "/Digital-Manuals/",
  publicDir: "public",
  build: {
    outDir: "build-output",
    emptyOutDir: true,
    // Keep Vite's own bundled JS/CSS out of "assets/" — that name is reserved
    // for BUILD.md's diagrams/photos/wiring/etc. directory, copied verbatim
    // from public/assets (a symlink to the top-level /assets).
    assetsDir: "_app"
  }
}));
