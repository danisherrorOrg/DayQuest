// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import DialogueRecapScreen from "./DialogueRecapScreen.jsx";

vi.mock("../../api/days.js", () => ({
  saveDay: vi.fn(() => Promise.resolve({})),
}));
vi.mock("../../api/offlineQueue.js", () => ({
  setPendingSave: vi.fn(),
  clearPendingSave: vi.fn(),
}));

import { saveDay } from "../../api/days.js";

// One 60-minute activity plus the filler page dayRecap.js adds for the
// other 23 hours — enough pages to exercise reveal + advance + done.
const cards = [
  { id: 1, title: "Standup", categoryKey: "work", durationMins: 60, log: "", tags: [] },
];

function renderScreen(props = {}) {
  return render(
    <DialogueRecapScreen
      mode="cards"
      cards={cards}
      blocks={[]}
      date="2026-09-05"
      onRestart={vi.fn()}
      {...props}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("DialogueRecapScreen", () => {
  it("shows the first page's nameplate and reveals its body a character at a time", () => {
    vi.useFakeTimers();
    renderScreen();
    expect(screen.getByText("1h · 💼 WORK")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3 * 18));
    expect(document.querySelector(".dialogueText").textContent).toBe("Sta");
  });

  it("clicking the box first finishes the reveal, then advances to the next page", () => {
    vi.useFakeTimers();
    renderScreen();
    const box = document.getElementById("dialogueBox");

    fireEvent.click(box);
    expect(document.querySelector(".dialogueText").textContent).toBe("Standup");
    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    fireEvent.click(box);
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByText("23h · ❔ BLACK BOX")).toBeInTheDocument();
  });

  it("advances via the keyboard and reaches the end-of-day summary", () => {
    vi.useFakeTimers();
    renderScreen();

    fireEvent.keyDown(window, { key: "ArrowRight" }); // finish page 1's reveal
    fireEvent.keyDown(window, { key: "ArrowRight" }); // -> page 2
    fireEvent.keyDown(window, { key: "ArrowRight" }); // finish page 2's reveal
    fireEvent.keyDown(window, { key: "ArrowRight" }); // -> done

    expect(screen.getByText("Day Complete!")).toBeInTheDocument();
    expect(screen.getByText("💼 Work")).toBeInTheDocument();
  });

  it("hides the reveal UI and shows a replay exit link during replay", () => {
    renderScreen({ replay: true });
    expect(screen.getByText("← Back to My Days")).toBeInTheDocument();
  });

  it("saves the day from the summary screen", async () => {
    vi.useFakeTimers();
    renderScreen();
    const box = document.getElementById("dialogueBox");
    fireEvent.click(box);
    fireEvent.click(box);
    fireEvent.click(box);
    fireEvent.click(box);
    vi.useRealTimers();

    fireEvent.click(screen.getByText("Save This Day"));
    await waitFor(() => expect(screen.getByText("Saved ✓")).toBeInTheDocument());
    expect(saveDay).toHaveBeenCalled();
  });
});
