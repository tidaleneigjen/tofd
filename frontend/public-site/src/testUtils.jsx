import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { SiteRoutes } from "./App";

// Render the routed site at a given path (jsdom has no server, so routes
// are exercised through MemoryRouter instead of BrowserRouter).
export function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SiteRoutes />
    </MemoryRouter>,
  );
}

// Stub fetch with a map of URL-prefix -> {status, body}. Longest matching
// prefix wins; unmatched URLs get a 404 JSON response.
export function mockFetchJson(routes) {
  const fn = vi.fn((url) => {
    const path = typeof url === "string" ? url : url.url;
    const prefix = Object.keys(routes)
      .filter((candidate) => path.startsWith(candidate))
      .sort((a, b) => b.length - a.length)[0];
    const route = prefix
      ? routes[prefix]
      : { status: 404, body: { message: "not found" } };
    return Promise.resolve({
      ok: route.status >= 200 && route.status < 300,
      status: route.status,
      json: () => Promise.resolve(route.body),
    });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}
