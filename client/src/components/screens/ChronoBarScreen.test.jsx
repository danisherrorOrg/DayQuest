// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChronoBarScreen from "./ChronoBarScreen.jsx";
import { ToastProvider } from "../../context/ToastContext.jsx";

vi.mock("../../api/days.js", () => ({
  saveDay: vi.fn(() => Promise.resolve({})),
}));
vi.mock("../../api/offlineQueue.js", () => ({
  setPendingSave: vi.fn(),
  clearPendingSave: vi.fn(),
}));

import { saveDay } from "../../api/days.js";

const blocks = [
  {
    id: "b1",
    start: 480,
    end: 570,
    categoryKey: "work",
    title: "Standup",
    log: "note",
    tags: ["daily"],
  },
  { id: "b2", start: 600, end: 645, categoryKey: "gym", title: "", log: "", tags: [] },
];

function renderScreen(props = {}) {
  return render(
    <ToastProvider>
      <ChronoBarScreen
        mode="builder"
        cards={[]}
        blocks={blocks}
        date="2026-09-05"
        onRestart={vi.fn()}
        {...props}
      />
    </ToastProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ChronoBarScreen", () => {
  it("renders a segment per categorized block", () => {
    const { container } = renderScreen();
    expect(container.querySelectorAll(".chronoSegment")).toHaveLength(2);
  });

  it("opens a segment's popup on hover and closes it on mouse-leave", () => {
    const { container } = renderScreen();
    const segment = container.querySelectorAll(".chronoSegment")[0];

    fireEvent.mouseEnter(segment);
    expect(screen.getByText(/Standup/)).toBeInTheDocument();
    expect(screen.getByText("#daily")).toBeInTheDocument();

    fireEvent.mouseLeave(segment);
    expect(screen.queryByText(/Standup/)).not.toBeInTheDocument();
  });

  it("toggles between horizontal and vertical layout", () => {
    const { container } = renderScreen();
    const bar = container.querySelector(".chronoBar");
    expect(bar.className).not.toMatch(/vertical/);

    fireEvent.click(screen.getByLabelText("Vertical layout"));
    expect(container.querySelector(".chronoBar").className).toMatch(/vertical/);

    fireEvent.click(screen.getByLabelText("Horizontal layout"));
    expect(container.querySelector(".chronoBar").className).not.toMatch(/vertical/);
  });

  it("reports a tapped position on the bar as day minutes, for jumping into the builder", () => {
    const onJumpToBuilder = vi.fn();
    const { container } = renderScreen({ onJumpToBuilder });
    const bar = container.querySelector(".chronoBar");
    vi.spyOn(bar, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 100,
    });

    fireEvent.click(bar, { clientX: 500 });
    expect(onJumpToBuilder).toHaveBeenCalledWith(720);
  });

  it("does not offer the jump-to-builder shortcut in replay mode", () => {
    renderScreen({ replay: true });
    expect(screen.getByText("← Back to My Days")).toBeInTheDocument();
  });

  it("shows the end-of-day summary, with Save, after Finish & Save", () => {
    renderScreen();
    fireEvent.click(screen.getByText("Finish & Save"));

    expect(screen.getByText("Day Complete!")).toBeInTheDocument();
    expect(screen.getByText("2h 15m")).toBeInTheDocument(); // total tracked
    expect(screen.getByText("Save This Day")).toBeInTheDocument();
    expect(screen.getByText("Start Over")).toBeInTheDocument();
  });

  it("in replay mode, Finish skips straight to a read-only summary (no Save)", () => {
    renderScreen({ replay: true });
    fireEvent.click(screen.getByText("Finish"));

    expect(screen.getByText("Day Complete!")).toBeInTheDocument();
    expect(screen.queryByText("Save This Day")).not.toBeInTheDocument();
    expect(screen.getByText("Back to My Days")).toBeInTheDocument();
  });

  it("saves the day and reflects the result on the Save button", async () => {
    renderScreen();
    fireEvent.click(screen.getByText("Finish & Save"));
    fireEvent.click(screen.getByText("Save This Day"));

    await waitFor(() => expect(screen.getByText("Saved ✓")).toBeInTheDocument());
    expect(saveDay).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ mode: "builder" }),
    );
  });
});
