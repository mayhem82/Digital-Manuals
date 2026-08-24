import { defineConfig } from "vite";

// Repo is served from GitHub Pages at /digital-manuals/, so every asset path
// needs that base — for build, preview, and dev alike (dev then serves at
// http://localhost:5173/digital-manuals/, not at the root).
export default defineConfig(() => ({
  base: "/digital-manuals/",
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
