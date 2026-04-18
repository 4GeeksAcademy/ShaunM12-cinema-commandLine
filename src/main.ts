const TOTAL_ROWS = 8;
const TOTAL_COLS = 10;

type SeatingMatrix = number[][];

/**
 * Creates a seating matrix with the given dimensions.
 * Seat value 0 means available, and 1 means occupied.
 */
function initializeSeatingMatrix(rows: number, cols: number): SeatingMatrix {
  const matrix: SeatingMatrix = [];

  for (let row = 0; row < rows; row++) {
    const rowSeats: number[] = [];

    for (let col = 0; col < cols; col++) {
      rowSeats.push(0);
    }

    matrix.push(rowSeats);
  }

  return matrix;
}

/**
 * Prints the seating matrix to the console using:
 * L for available seats (0) and X for occupied seats (1),
 * with row and column labels for easy seat identification.
 */
function displaySeatingMatrix(matrix: SeatingMatrix): void {
  console.log("\n     C1 C2 C3 C4 C5 C6 C7 C8 C9 C10");

  for (let row = 0; row < matrix.length; row++) {
    const formattedRow = matrix[row].map((seat) => (seat === 1 ? "X" : "L")).join("  ");
    console.log(`R${row + 1} | ${formattedRow}`);
  }
}

/**
 * Validates if a seat can be reserved by checking bounds and occupancy.
 * Expects 1-based row and column input for user-friendly coordinates.
 */
function validateSeatReservation(
  matrix: SeatingMatrix,
  inputRow: number,
  inputCol: number,
): { success: boolean; message: string } {
  const row = inputRow - 1;
  const col = inputCol - 1;

  if (row < 0 || row >= matrix.length || col < 0 || col >= matrix[0].length) {
    return {
      success: false,
      message: `Reservation failed: seat R${inputRow}, C${inputCol} is out of range.`,
    };
  }

  if (matrix[row][col] === 1) {
    return {
      success: false,
      message: `Reservation failed: seat R${inputRow}, C${inputCol} is already occupied.`,
    };
  }

  return {
    success: true,
    message: `Seat R${inputRow}, C${inputCol} is available for reservation.`,
  };
}

/**
 * Reserves a seat if validation succeeds by changing 0 to 1.
 * Returns a message indicating reservation success or failure.
 */
function reserveSeat(matrix: SeatingMatrix, inputRow: number, inputCol: number): string {
  const validation = validateSeatReservation(matrix, inputRow, inputCol);

  if (!validation.success) {
    return validation.message;
  }

  const row = inputRow - 1;
  const col = inputCol - 1;
  matrix[row][col] = 1;

  return `Reservation confirmed: seat R${inputRow}, C${inputCol} is now occupied.`;
}

/**
 * Counts occupied and available seats across the entire matrix.
 */
function countSeatAvailability(matrix: SeatingMatrix): { occupied: number; available: number } {
  let occupied = 0;
  let available = 0;

  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] === 1) {
        occupied++;
      } else {
        available++;
      }
    }
  }

  return { occupied, available };
}

/**
 * Finds the first horizontal pair of adjacent available seats (0,0).
 * Returns 1-based seat positions or a clear message if no pair exists.
 */
function findFirstAdjacentAvailableSeats(matrix: SeatingMatrix): {
  found: boolean;
  message: string;
  positions?: { row: number; col: number }[];
} {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length - 1; col++) {
      if (matrix[row][col] === 0 && matrix[row][col + 1] === 0) {
        return {
          found: true,
          message: `Adjacent seats found at R${row + 1}, C${col + 1} and R${row + 1}, C${col + 2}.`,
          positions: [
            { row: row + 1, col: col + 1 },
            { row: row + 1, col: col + 2 },
          ],
        };
      }
    }
  }

  return {
    found: false,
    message: "No adjacent available seats were found.",
  };
}

/**
 * Marks a list of seats as occupied using 1-based coordinates.
 * This helper is useful for preloading sample room states.
 */
function occupySeats(matrix: SeatingMatrix, seats: Array<[number, number]>): void {
  for (const [inputRow, inputCol] of seats) {
    const row = inputRow - 1;
    const col = inputCol - 1;

    if (row >= 0 && row < matrix.length && col >= 0 && col < matrix[row].length) {
      matrix[row][col] = 1;
    }
  }
}

/**
 * Runs one scenario: prints the matrix, seat counts, adjacent-seat result,
 * and reservation attempts so operation messages are visible.
 */
function runScenario(
  title: string,
  matrix: SeatingMatrix,
  reservationTests: Array<[number, number]>,
): void {
  console.log(`\n================ ${title} ================`);
  displaySeatingMatrix(matrix);

  const counts = countSeatAvailability(matrix);
  console.log(`Occupied seats: ${counts.occupied}`);
  console.log(`Available seats: ${counts.available}`);

  const adjacentResult = findFirstAdjacentAvailableSeats(matrix);
  console.log(adjacentResult.message);

  for (const [row, col] of reservationTests) {
    console.log(reserveSeat(matrix, row, col));
  }

  console.log("Updated room state after reservations:");
  displaySeatingMatrix(matrix);
}

function main(): void {
  // Scenario 1: Empty room (all seats available).
  const emptyRoom = initializeSeatingMatrix(TOTAL_ROWS, TOTAL_COLS);
  runScenario("SCENARIO 1: EMPTY ROOM", emptyRoom, [
    [1, 1],
    [1, 1],
  ]);

  // Scenario 2: Partially filled room.
  const partiallyFilledRoom = initializeSeatingMatrix(TOTAL_ROWS, TOTAL_COLS);
  occupySeats(partiallyFilledRoom, [
    [1, 1],
    [1, 2],
    [2, 5],
    [3, 7],
    [4, 4],
    [6, 8],
  ]);
  runScenario("SCENARIO 2: PARTIALLY FILLED ROOM", partiallyFilledRoom, [
    [2, 5],
    [2, 6],
  ]);

  // Scenario 3: Nearly full room with only scattered single seats.
  const nearlyFullRoom = initializeSeatingMatrix(TOTAL_ROWS, TOTAL_COLS);

  for (let row = 1; row <= TOTAL_ROWS; row++) {
    for (let col = 1; col <= TOTAL_COLS; col++) {
      if (
        (row === 2 && col === 2) ||
        (row === 4 && col === 5) ||
        (row === 6 && col === 8) ||
        (row === 8 && col === 10)
      ) {
        continue;
      }
      nearlyFullRoom[row - 1][col - 1] = 1;
    }
  }

  runScenario("SCENARIO 3: NEARLY FULL (SCATTERED SINGLE SEATS)", nearlyFullRoom, [
    [2, 2],
    [2, 2],
  ]);

  // Scenario 4: Full room (no seats available).
  const fullRoom = initializeSeatingMatrix(TOTAL_ROWS, TOTAL_COLS);
  for (let row = 0; row < TOTAL_ROWS; row++) {
    for (let col = 0; col < TOTAL_COLS; col++) {
      fullRoom[row][col] = 1;
    }
  }
  runScenario("SCENARIO 4: FULL ROOM", fullRoom, [
    [5, 5],
    [9, 1],
  ]);
}

if (typeof document === "undefined") {
  main();
}

export {
  TOTAL_ROWS,
  TOTAL_COLS,
  initializeSeatingMatrix,
  displaySeatingMatrix,
  validateSeatReservation,
  reserveSeat,
  countSeatAvailability,
  findFirstAdjacentAvailableSeats,
  occupySeats,
  main,
};
