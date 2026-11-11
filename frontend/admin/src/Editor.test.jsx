import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Editor from "./Editor";

vi.mock("aws-amplify/auth", () => ({
  signIn: vi.fn(),
  confirmSignIn: vi.fn(),
  fetchAuthSession: vi.fn(),
  signOut: vi.fn(),
}));

import { fetchAuthSession } from "aws-amplify/auth";

const HOME_ITEM = {
  slug: "home",
  slides: [{ imageUrl: "/images/window.jpg", title: "News", text: "Hello" }],
  sidebar: { title: "About Us", text: "A spiritual community." },
  updatedAt: "2026-01-01T00:00:00+00:00",
  updatedBy: "admin@example.com",
};

function mockApi(item) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(item),
    }),
  );
}

describe("Editor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAuthSession.mockResolvedValue({ tokens: { idToken: { toString: () => "id-token" } } });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads the home page into the slides and sidebar form", async () => {
    mockApi(HOME_ITEM);
    render(<Editor onSignedOut={vi.fn()} />);

    expect(await screen.findByText("Slide 1")).toBeTruthy();
    expect(screen.getByLabelText("Title (optional)")).toHaveProperty("value", "News");
    expect(screen.getByLabelText("Text (optional)")).toHaveProperty("value", "Hello");
    expect(screen.getByLabelText("Title", { selector: "#sidebar-title" })).toHaveProperty(
      "value",
      "About Us",
    );
    expect(screen.getByLabelText("Text", { selector: "#sidebar-text" })).toHaveProperty(
      "value",
      "A spiritual community.",
    );
  });

  it("prefills defaults on 404 without saving", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve({}) }),
    );
    render(<Editor onSignedOut={vi.fn()} />);

    await waitFor(() => expect(screen.getAllByText(/Slide \d/).length).toBeGreaterThan(0));
    // defaults have 6 slides
    expect(screen.getByText("Slide 6")).toBeTruthy();
    const putCalls = vi.mocked(fetch).mock.calls.filter(([, opts]) => opts?.method === "PUT");
    expect(putCalls).toHaveLength(0);
  });

  it("adds and removes slides within limits", async () => {
    mockApi(HOME_ITEM);
    render(<Editor onSignedOut={vi.fn()} />);
    await screen.findByText("Slide 1");

    fireEvent.click(screen.getByRole("button", { name: "Add slide" }));
    expect(screen.getByText("Slide 2")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[1]);
    expect(screen.queryByText("Slide 2")).toBeNull();
    // can't remove the last slide
    expect(screen.getByRole("button", { name: "Remove" })).toHaveProperty("disabled", true);
  });

  it("saves slides + sidebar via PUT with the ID token", async () => {
    const fetchMock = vi.fn().mockImplementation((url, opts) => {
      if (opts?.method === "PUT") {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(HOME_ITEM) });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Editor onSignedOut={vi.fn()} />);
    await screen.findByText("Slide 1");

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([, opts]) => opts?.method === "PUT");
      expect(put).toBeTruthy();
      const [url, opts] = put;
      expect(url).toContain("/api/pages/home");
      expect(opts.headers.Authorization).toBe("Bearer id-token");
      const body = JSON.parse(opts.body);
      expect(body.slides).toHaveLength(1);
      expect(body.sidebar.title).toBe("About Us");
    });
    expect(await screen.findByText("Saved — your changes are live on the site")).toBeTruthy();
  });
});
