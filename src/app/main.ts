import { route, notFound, startRouter } from "./router";
import { mountShell } from "../components/layout";
import { renderHome } from "../components/home";
import { renderDocumentToc } from "../components/documentToc";
import { renderPage } from "../components/pageView";
import { renderSearch } from "../components/search";
import { renderProcedures } from "../components/procedures";
import { renderSpecifications } from "../components/specifications";
import { renderFaultCodes } from "../components/faultCodes";
import { renderWiring } from "../components/wiring";
import { renderGlossary } from "../components/glossary";
import { renderBookmarks } from "../components/bookmarks";
import { renderSourceGaps } from "../components/sourceGaps";
import { renderManifestView } from "../components/manifest";

const root = document.getElementById("app")!;
const content = mountShell(root);

route("/", () => renderHome(content));
route("/documents/:id", (params) => renderDocumentToc(content, params.id));
route("/page/:id", (params) => renderPage(content, params.id));
route("/search", (_params, query) => renderSearch(content, query.get("q") ?? ""));
route("/procedures", () => renderProcedures(content));
route("/procedures/:id", (params) => renderProcedures(content, params.id));
route("/specifications", () => renderSpecifications(content));
route("/fault-codes", () => renderFaultCodes(content));
route("/wiring", () => renderWiring(content));
route("/glossary", () => renderGlossary(content));
route("/bookmarks", () => renderBookmarks(content));
route("/source-gaps", () => renderSourceGaps(content));
route("/manifest", () => renderManifestView(content));

notFound(() => {
  content.innerHTML = `<h1>Not found</h1><p class="empty-state">That page doesn't exist in this build.</p>`;
});

startRouter();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* offline support is best-effort; app still works online without it */
    });
  });
}
