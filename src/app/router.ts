export type RouteHandler = (params: Record<string, string>, query: URLSearchParams) => void | Promise<void>;

interface Route {
  pattern: RegExp;
  keys: string[];
  handler: RouteHandler;
}

const routes: Route[] = [];
let notFoundHandler: RouteHandler = () => {};

export function route(path: string, handler: RouteHandler): void {
  const keys: string[] = [];
  const pattern = new RegExp(
    "^" +
      path.replace(/:[a-zA-Z]+/g, (m) => {
        keys.push(m.slice(1));
        return "([^/]+)";
      }) +
      "$"
  );
  routes.push({ pattern, keys, handler });
}

export function notFound(handler: RouteHandler): void {
  notFoundHandler = handler;
}

function currentPathAndQuery(): { path: string; query: URLSearchParams } {
  const hash = location.hash.slice(1) || "/";
  const [path, qs] = hash.split("?");
  return { path: path || "/", query: new URLSearchParams(qs ?? "") };
}

async function resolve(): Promise<void> {
  const { path, query } = currentPathAndQuery();
  for (const r of routes) {
    const match = path.match(r.pattern);
    if (match) {
      const params: Record<string, string> = {};
      r.keys.forEach((key, i) => (params[key] = decodeURIComponent(match[i + 1])));
      await r.handler(params, query);
      return;
    }
  }
  await notFoundHandler({}, query);
}

export function startRouter(): void {
  window.addEventListener("hashchange", () => void resolve());
  void resolve();
}

export function navigate(path: string): void {
  location.hash = path;
}
