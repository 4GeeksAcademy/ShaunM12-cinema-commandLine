/// <reference path="./node-shims.d.ts" />
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  TOTAL_COLS,
  TOTAL_ROWS,
  countSeatAvailability,
  displaySeatingMatrix,
  initializeSeatingMatrix,
  reserveSeat,
  unreserveSeat,
  validateSeatReservation,
} from "./main.ts";

type SeatingMatrix = number[][];

const SEAT_STATE_PATH = resolve(process.cwd(), "seat-state.json");

function createEmptyMatrix(): SeatingMatrix {
  return initializeSeatingMatrix(TOTAL_ROWS, TOTAL_COLS);
}

function isValidMatrixShape(matrix: unknown): matrix is SeatingMatrix {
  if (!Array.isArray(matrix) || matrix.length !== TOTAL_ROWS) {
    return false;
  }

  return matrix.every(
    (row) =>
      Array.isArray(row) &&
      row.length === TOTAL_COLS &&
      row.every((seat) => seat === 0 || seat === 1),
  );
}

function saveSeatState(matrix: SeatingMatrix): void {
  writeFileSync(SEAT_STATE_PATH, JSON.stringify(matrix, null, 2), "utf-8");
}

function loadSeatState(): SeatingMatrix {
  if (!existsSync(SEAT_STATE_PATH)) {
    const empty = createEmptyMatrix();
    saveSeatState(empty);
    return empty;
  }

  try {
    const raw = readFileSync(SEAT_STATE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as unknown;

    if (!isValidMatrixShape(parsed)) {
      const empty = createEmptyMatrix();
      saveSeatState(empty);
      return empty;
    }

    return parsed;
  } catch {
    const empty = createEmptyMatrix();
    saveSeatState(empty);
    return empty;
  }
}

function printUsage(): void {
  console.log("Cinema CLI commands:");
  console.log("npm run seat-map");
  console.log("npm run check-seats");
  console.log("npm run check-seat -- <row> <col>");
  console.log("npm run reserve -- <row> <col>");
  console.log("npm run unreserve -- <row> <col>");
  console.log("npm run reset-seats");
}

function parseCoordinateArgs(args: string[]): { row: number; col: number } | null {
  if (args.length < 2) {
    return null;
  }

  const row = Number(args[0]);
  const col = Number(args[1]);

  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    return null;
  }

  return { row, col };
}

function run(): void {
  const [command, ...args] = process.argv.slice(2);
  const matrix = loadSeatState();

  switch (command) {
    case "seat-map": {
      displaySeatingMatrix(matrix);
      break;
    }

    case "check-seats": {
      for (let row = 1; row <= TOTAL_ROWS; row++) {
        for (let col = 1; col <= TOTAL_COLS; col++) {
          const isOccupied = matrix[row - 1][col - 1] === 1;
          const status = isOccupied ? "occupied" : "available";
          console.log(`R${row}, C${col}: ${status}`);
        }
      }

      const counts = countSeatAvailability(matrix);
      console.log(`Total occupied: ${counts.occupied}`);
      console.log(`Total available: ${counts.available}`);
      break;
    }

    case "check-seat": {
      const parsed = parseCoordinateArgs(args);
      if (!parsed) {
        console.error("Usage: npm run check-seat -- <row> <col>");
        process.exit(1);
        return;
      }

      const result = validateSeatReservation(matrix, parsed.row, parsed.col);
      console.log(result.message);
      break;
    }

    case "reserve": {
      const parsed = parseCoordinateArgs(args);
      if (!parsed) {
        console.error("Usage: npm run reserve -- <row> <col>");
        process.exit(1);
        return;
      }

      const message = reserveSeat(matrix, parsed.row, parsed.col);
      console.log(message);

      if (message.startsWith("Reservation confirmed:")) {
        saveSeatState(matrix);
      }

      console.log("Current room state:");
      displaySeatingMatrix(matrix);
      break;
    }

    case "reset-seats": {
      const empty = createEmptyMatrix();
      saveSeatState(empty);
      console.log("Seat state reset. All seats are now available.");
      displaySeatingMatrix(empty);
      break;
    }

    case "unreserve": {
      const parsed = parseCoordinateArgs(args);
      if (!parsed) {
        console.error("Usage: npm run unreserve -- <row> <col>");
        process.exit(1);
        return;
      }

      const message = unreserveSeat(matrix, parsed.row, parsed.col);
      console.log(message);

      if (message.startsWith("Unreservation confirmed:")) {
        saveSeatState(matrix);
      }

      console.log("Current room state:");
      displaySeatingMatrix(matrix);
      break;
    }

    default: {
      printUsage();
      process.exit(1);
      return;
    }
  }
}

run();
