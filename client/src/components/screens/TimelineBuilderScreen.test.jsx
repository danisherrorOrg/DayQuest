// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TimelineBuilderScreen from "./TimelineBuilderScreen.jsx";

vi.mock("../../api/days.js", () => ({
  listDays: vi.fn(() => Promise.resolve([])),
}));
vi.mock("../../hooks/useTodayEntry.js", () => ({
  useTodayEntry: () => null,
}));

// The component measures its track's pixel width to convert pointer
// clientX <-> minutes-of-day. jsdom never lays anything out, so both are
// stubbed here to a 1px-per-minute track (1440px wide) — that makes a test's
// clientX numerically equal to minutes-of-day, with no conversion math to
// duplicate in assertions.
Object.defineProperty(Element.prototype, "clientWidth", {
  configurable: true,
  get: () => 1440,
});
Element.prototype.getBoundingClientRect = () => ({
  left: 0,
  top: 0,
  right: 1440,
  bottom: 72,
  width: 1440,
  height: 72,
});

function renderScreen(props = {}) {
  return render(<TimelineBuilderScreen onBack={vi.fn()} onBuild={vi.fn()} {...props} />);
}

function drag(el, { from, to }) {
  fireEvent.pointerDown(el, { clientX: from });
  if (to != null) fireEvent.pointerMove(window, { clientX: to });
  fireEvent.pointerUp(window);
}

// Reopens a block's popup the same way a real tap does: a pointerdown +
// pointerup with no pointermove in between (a plain "click" is a different,
// unhandled event — the component only listens for pointer events).
function tap(el) {
  drag(el, { from: 0 });
}

function categorizeAndConfirm({ categoryKey, title } = {}) {
  if (categoryKey) {
    fireEvent.change(screen.getByRole("combobox"), { target: { value: categoryKey } });
  }
  if (title) {
    fireEvent.change(screen.getByPlaceholderText("What did you do? (optional)"), {
      target: { value: title },
    });
  }
  fireEvent.click(screen.getByText("Done"));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TimelineBuilderScreen", () => {
  it("dragging across the track creates a block spanning the dragged range", () => {
    const { container } = renderScreen();
    drag(container.querySelector("#builderTrack"), { from: 480, to: 600 }); // 8:00 AM -> 10:00 AM

    expect(screen.getByText("8:00 AM – 10:00 AM")).toBeInTheDocument();
    expect(screen.getByText("2h")).toBeInTheDocument();
  });

  it("a tap (no drag) creates a minimum-length block anchored at the tap point", () => {
    const { container } = renderScreen();
    drag(container.querySelector("#builderTrack"), { from: 300 }); // 5:00 AM, no move

    expect(screen.getByText("5:00 AM – 5:15 AM")).toBeInTheDocument();
    expect(screen.getByText("15m")).toBeInTheDocument();
  });

  it("categorizing a block and confirming it enables Build, and hands it back on build", () => {
    const onBuild = vi.fn();
    const { container } = renderScreen({ onBuild });
    drag(container.querySelector("#builderTrack"), { from: 480, to: 600 });
    categorizeAndConfirm({ categoryKey: "work", title: "Standup" });

    const buildBtn = screen.getByText("Build My Level");
    expect(buildBtn).not.toBeDisabled();
    fireEvent.click(buildBtn);

    expect(onBuild).toHaveBeenCalledWith([
      expect.objectContaining({ start: 480, end: 600, categoryKey: "work", title: "Standup" }),
    ]);
  });

  it("dragging a block's body moves it without changing its length", () => {
    const { container } = renderScreen();
    const track = container.querySelector("#builderTrack");
    drag(track, { from: 480, to: 600 });
    categorizeAndConfirm({ categoryKey: "work" });

    const block = container.querySelector(".builderBlock");
    drag(block, { from: 480, to: 540 }); // grab its start edge, drag 1h later

    tap(container.querySelector(".builderBlock")); // reopen, no movement this time
    expect(screen.getByText("9:00 AM – 11:00 AM")).toBeInTheDocument();
  });

  it("dragging a block's right edge resizes it", () => {
    const { container } = renderScreen();
    const track = container.querySelector("#builderTrack");
    drag(track, { from: 480, to: 600 });
    categorizeAndConfirm({ categoryKey: "work" });

    const rightHandle = container.querySelector(".builderEdgeHandle.right");
    drag(rightHandle, { from: 600, to: 660 });

    tap(container.querySelector(".builderBlock"));
    expect(screen.getByText("8:00 AM – 11:00 AM")).toBeInTheDocument();
  });

  it("a later drag can't be dragged into an existing block's time range", () => {
    const { container } = renderScreen();
    const track = container.querySelector("#builderTrack");
    drag(track, { from: 480, to: 600 }); // existing block: 8:00 AM - 10:00 AM
    categorizeAndConfirm({ categoryKey: "work" });

    // Anchor after the existing block, then drag back toward/into it.
    drag(track, { from: 660, to: 525 });
    expect(screen.getByText("10:00 AM – 11:00 AM")).toBeInTheDocument();
  });

  it("removing a block clears it and disables Build again", () => {
    const { container } = renderScreen();
    drag(container.querySelector("#builderTrack"), { from: 480, to: 600 });
    categorizeAndConfirm({ categoryKey: "work" });

    tap(container.querySelector(".builderBlock"));
    fireEvent.click(screen.getByText("Remove"));

    expect(container.querySelectorAll(".builderBlock")).toHaveLength(0);
    expect(screen.getByText("Build My Level")).toBeDisabled();
  });

  it("adds a tag on Enter and removes it on click", () => {
    const { container } = renderScreen();
    drag(container.querySelector("#builderTrack"), { from: 480, to: 600 });

    const tagInput = screen.getByPlaceholderText("+ add a tag, press Enter");
    fireEvent.change(tagInput, { target: { value: "daily" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });
    expect(screen.getByText("#daily ✕")).toBeInTheDocument();

    fireEvent.click(screen.getByText("#daily ✕"));
    expect(screen.queryByText("#daily ✕")).not.toBeInTheDocument();
  });
});
