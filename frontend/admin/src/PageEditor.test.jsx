import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RoutedPageEditor from "./PageEditor";

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: vi.fn(),
  signOut: vi.fn(),
}));

import { fetchAuthSession } from "aws-amplify/auth";

const ABOUT_ITEM = {
  slug: "about",
  title: "About Us",
  body: "<p>Hello <strong>world</strong>.</p>",
  bodyFormat: "html",
  updatedAt: "2026-01-01T00:00:00+00:00",
  updatedBy: "admin@example.com",
};

function renderEditor(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/pages/:slug" element={<RoutedPageEditor />} />
        <Route path="/" element={<div>pages list</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function mockApi(getResponse, putResponse = { ok: true, status: 200, json: () => Promise.resolve({}) }) {
  const fn = vi.fn((url, opts) => {
    if (opts?.method === "PUT") return Promise.resolve(putResponse);
    return Promise.resolve(getResponse);
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("PageEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAuthSession.mockResolvedValue({ tokens: { idToken: { toString: () => "id-token" } } });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads a saved page into title + rich text editor", async () => {
    mockApi({ ok: true, status: 200, json: () => Promise.resolve(ABOUT_ITEM) });
    const { container } = renderEditor("/pages/about");

    expect(await screen.findByRole("heading", { name: "Edit About Us" })).toBeTruthy();
    expect(screen.getByLabelText("Title")).toHaveProperty("value", "About Us");
    await waitFor(() => expect(container.querySelector(".tiptap-body")?.textContent).toContain("world"));
  });

  it("saves title + editor HTML via PUT with the ID token", async () => {
    const fetchMock = mockApi({ ok: true, status: 200, json: () => Promise.resolve(ABOUT_ITEM) });
    renderEditor("/pages/about");
    await screen.findByLabelText("Title");

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "About the Temple" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([, opts]) => opts?.method === "PUT");
      expect(put).toBeTruthy();
      const [url, opts] = put;
      expect(url).toContain("/api/pages/about");
      expect(opts.headers.Authorization).toBe("Bearer id-token");
      const body = JSON.parse(opts.body);
      expect(body.title).toBe("About the Temple");
      expect(body.body).toContain("<strong>world</strong>");
    });
    expect(await screen.findByText("Saved — your changes are live on the site")).toBeTruthy();
  });

  it("prefills defaults on 404 without saving", async () => {
    const fetchMock = mockApi({ ok: false, status: 404, json: () => Promise.resolve({}) });
    const { container } = renderEditor("/pages/iseum-musicum");

    await waitFor(() =>
      expect(screen.getByLabelText("Title")).toHaveProperty("value", "Iseum Musicum"),
    );
    await waitFor(() =>
      expect(container.querySelector(".tiptap-body")?.textContent).toContain("School of the Muse"),
    );
    const putCalls = fetchMock.mock.calls.filter(([, opts]) => opts?.method === "PUT");
    expect(putCalls).toHaveLength(0);
  });

  it("starts empty for unsaved pages without defaults", async () => {
    mockApi({ ok: false, status: 404, json: () => Promise.resolve({}) });
    const { container } = renderEditor("/pages/history");

    await waitFor(() => expect(screen.getByLabelText("Title")).toHaveProperty("value", ""));
    await waitFor(() => expect(container.querySelector(".tiptap-body")).toBeTruthy());
    expect(container.querySelector(".tiptap-body")?.textContent.trim()).toBe("");
  });

  it("redirects unknown slugs to the pages list", async () => {
    mockApi({ ok: false, status: 404, json: () => Promise.resolve({}) });
    renderEditor("/pages/bogus");

    expect(await screen.findByText("pages list")).toBeTruthy();
  });

  it("rejects non-https link hrefs in the link form", async () => {
    mockApi({ ok: true, status: 200, json: () => Promise.resolve(ABOUT_ITEM) });
    const { container } = renderEditor("/pages/about");
    await screen.findByLabelText("Title");
    await waitFor(() => expect(container.querySelector(".tiptap-body")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    fireEvent.change(screen.getByLabelText("Link address"), {
      target: { value: "javascript:alert(1)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(container.querySelector(".tiptap-body a")).toBeNull();
  });
});
