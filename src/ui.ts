import "./style.css";
import {
  TOTAL_ROWS,
  TOTAL_COLS,
  initializeSeatingMatrix,
  reserveSeat,
  countSeatAvailability,
  findFirstAdjacentAvailableSeats,
} from "./main";

/**
 * Creates a stable seat id string from 1-based row and column values.
 */
function seatId(row: number, col: number): string {
  return `seat-r${row}-c${col}`;
}

/**
 * Converts numeric seat state to display label.
 */
function seatToLabel(seat: number): "L" | "X" {
  return seat === 1 ? "X" : "L";
}

/**
 * Connects the static HTML layout to your seat-management logic.
 */
function mountSeatManagerUI(): void {
  const seatGrid = document.querySelector<HTMLDivElement>("#seat-grid");
  const countsEl = document.querySelector<HTMLParagraphElement>("#counts");
  const adjacentEl = document.querySelector<HTMLParagraphElement>("#adjacent-message");
  const actionEl = document.querySelector<HTMLParagraphElement>("#action-message");
  const resetButton = document.querySelector<HTMLButtonElement>("#reset-button");
  const presetEmptyButton = document.querySelector<HTMLButtonElement>("#preset-empty");
  const presetPartialButton = document.querySelector<HTMLButtonElement>("#preset-partial");
  const presetNearlyFullButton = document.querySelector<HTMLButtonElement>("#preset-nearly-full");
  const presetFullButton = document.querySelector<HTMLButtonElement>("#preset-full");

  if (
    !seatGrid ||
    !countsEl ||
    !adjacentEl ||
    !actionEl ||
    !resetButton ||
    !presetEmptyButton ||
    !presetPartialButton ||
    !presetNearlyFullButton ||
    !presetFullButton
  ) {
    return;
  }

  const safeSeatGrid = seatGrid;
  const safeCountsEl = countsEl;
  const safeAdjacentEl = adjacentEl;
  const safeActionEl = actionEl;
  const safeResetButton = resetButton;
  const safePresetEmptyButton = presetEmptyButton;
  const safePresetPartialButton = presetPartialButton;
  const safePresetNearlyFullButton = presetNearlyFullButton;
  const safePresetFullButton = presetFullButton;

  const seatingMatrix = initializeSeatingMatrix(TOTAL_ROWS, TOTAL_COLS);

  /**
   * Sets all seats in the current matrix to either available (0) or occupied (1).
   */
  function fillAllSeats(value: 0 | 1): void {
    for (let row = 0; row < TOTAL_ROWS; row++) {
      for (let col = 0; col < TOTAL_COLS; col++) {
        seatingMatrix[row][col] = value;
      }
    }
  }

  /**
   * Loads one of the predefined room states from the original assignment scenarios.
   */
  function loadPresetScenario(preset: "empty" | "partial" | "nearly-full" | "full"): void {
    fillAllSeats(0);

    if (preset === "partial") {
      const occupiedSeats: Array<[number, number]> = [
        [1, 1],
        [1, 2],
        [2, 5],
        [3, 7],
        [4, 4],
        [6, 8],
      ];

      for (const [displayRow, displayCol] of occupiedSeats) {
        seatingMatrix[displayRow - 1][displayCol - 1] = 1;
      }
    }

    if (preset === "nearly-full") {
      fillAllSeats(1);

      const availableSingles: Array<[number, number]> = [
        [2, 2],
        [4, 5],
        [6, 8],
        [8, 10],
      ];

      for (const [displayRow, displayCol] of availableSingles) {
        seatingMatrix[displayRow - 1][displayCol - 1] = 0;
      }
    }

    if (preset === "full") {
      fillAllSeats(1);
    }

    const labelMap: Record<"empty" | "partial" | "nearly-full" | "full", string> = {
      empty: "Empty room preset loaded.",
      partial: "Partially filled room preset loaded.",
      "nearly-full": "Nearly full preset loaded with scattered single seats.",
      full: "Full room preset loaded.",
    };

    safeActionEl.textContent = labelMap[preset];
    renderStatus();
    renderSeatMap();
  }

  /**
   * Renders seat rows and buttons from the current 2D matrix state.
   */
  function renderSeatMap(): void {
    const adjacentResult = findFirstAdjacentAvailableSeats(seatingMatrix);
    const highlightedSeats = new Set<string>();

    if (adjacentResult.found && adjacentResult.positions) {
      for (const seat of adjacentResult.positions) {
        highlightedSeats.add(seatId(seat.row, seat.col));
      }
    }

    safeSeatGrid.innerHTML = "";

    for (let row = 0; row < TOTAL_ROWS; row++) {
      const rowContainer = document.createElement("div");
      rowContainer.className = "grid grid-cols-[2rem_repeat(10,minmax(0,1fr))] gap-1 sm:gap-2";

      const rowLabel = document.createElement("span");
      rowLabel.className = "flex items-center text-xs font-semibold text-slate-600";
      rowLabel.textContent = `R${row + 1}`;
      rowContainer.appendChild(rowLabel);

      for (let col = 0; col < TOTAL_COLS; col++) {
        const seatValue = seatingMatrix[row][col];
        const seatButton = document.createElement("button");
        const displayRow = row + 1;
        const displayCol = col + 1;
        const id = seatId(displayRow, displayCol);
        const isAdjacentSuggestion = highlightedSeats.has(id) && seatValue === 0;

        seatButton.type = "button";
        seatButton.className = [
          "rounded-md border px-1 py-2 text-xs font-semibold transition sm:text-sm",
          seatValue === 1
            ? "cursor-not-allowed border-rose-200 bg-rose-100 text-rose-700"
            : "border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
          isAdjacentSuggestion ? "ring-2 ring-amber-400" : "",
        ]
          .join(" ")
          .trim();

        seatButton.disabled = seatValue === 1;
        seatButton.textContent = seatToLabel(seatValue);
        seatButton.setAttribute("aria-label", `Row ${displayRow}, Seat ${displayCol}`);

        seatButton.addEventListener("click", () => {
          const message = reserveSeat(seatingMatrix, displayRow, displayCol);
          safeActionEl.textContent = message;
          renderStatus();
          renderSeatMap();
        });

        rowContainer.appendChild(seatButton);
      }

      safeSeatGrid.appendChild(rowContainer);
    }
  }

  /**
   * Updates seat counts and adjacent-seat guidance text.
   */
  function renderStatus(): void {
    const counts = countSeatAvailability(seatingMatrix);
    const adjacentResult = findFirstAdjacentAvailableSeats(seatingMatrix);

    safeCountsEl.textContent = `Occupied: ${counts.occupied} | Available: ${counts.available}`;
    safeAdjacentEl.textContent = adjacentResult.message;
    safeAdjacentEl.className = adjacentResult.found
      ? "font-medium text-emerald-700"
      : "font-medium text-rose-700";
  }

  safeResetButton.addEventListener("click", () => {
    fillAllSeats(0);
    safeActionEl.textContent = "Room reset completed. All seats are now available.";
    renderStatus();
    renderSeatMap();
  });

  safePresetEmptyButton.addEventListener("click", () => {
    loadPresetScenario("empty");
  });

  safePresetPartialButton.addEventListener("click", () => {
    loadPresetScenario("partial");
  });

  safePresetNearlyFullButton.addEventListener("click", () => {
    loadPresetScenario("nearly-full");
  });

  safePresetFullButton.addEventListener("click", () => {
    loadPresetScenario("full");
  });

  renderStatus();
  renderSeatMap();
  safeActionEl.textContent = "Select a seat to reserve it.";
}

if (typeof document !== "undefined") {
  mountSeatManagerUI();
}
