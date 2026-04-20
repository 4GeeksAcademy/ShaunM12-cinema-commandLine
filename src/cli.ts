/// <reference path="./node-shims.d.ts" />
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import {
  TOTAL_COLS,
  TOTAL_ROWS,
  countSeatAvailability,
  displaySeatingMatrix,
  findFirstAdjacentAvailableSeats,
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
  console.log("npm run menu");
  console.log("npm run seat-map");
  console.log("npm run count-seats");
  console.log("npm run check-seats");
  console.log("npm run check-seat -- <row> <col>");
  console.log("npm run find-adjacent");
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

function printInteractiveMenu(): void {
  console.log("\nCinema Seat Manager");
  console.log("1) Show seat map");
  console.log("2) Count occupied/available seats");
  console.log("3) Check one seat");
  console.log("4) Reserve one seat");
  console.log("5) Unreserve one seat");
  console.log("6) Find first adjacent available seats");
  console.log("7) Check all seats");
  console.log("8) Reset all seats");
  console.log("9) Exit");
}

async function runMenu(matrix: SeatingMatrix): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    while (true) {
      printInteractiveMenu();
      const choice = (await rl.question("Choose an option (1-9): ")).trim();

      if (choice === "1") {
        displaySeatingMatrix(matrix);
        continue;
      }

      if (choice === "2") {
        const counts = countSeatAvailability(matrix);
        console.log(`Total occupied: ${counts.occupied}`);
        console.log(`Total available: ${counts.available}`);
        continue;
      }

      if (choice === "3") {
        const rowInput = (await rl.question(`Seat row (1-${TOTAL_ROWS}): `)).trim();
        const colInput = (await rl.question(`Seat col (1-${TOTAL_COLS}): `)).trim();
        const parsed = parseCoordinateArgs([rowInput, colInput]);

        if (!parsed) {
          console.log("Invalid coordinates. Please enter whole numbers.");
          continue;
        }

        const result = validateSeatReservation(matrix, parsed.row, parsed.col);
        console.log(result.message);
        continue;
      }

      if (choice === "4") {
        const rowInput = (await rl.question(`Reserve row (1-${TOTAL_ROWS}): `)).trim();
        const colInput = (await rl.question(`Reserve col (1-${TOTAL_COLS}): `)).trim();
        const parsed = parseCoordinateArgs([rowInput, colInput]);

        if (!parsed) {
          console.log("Invalid coordinates. Please enter whole numbers.");
          continue;
        }

        const message = reserveSeat(matrix, parsed.row, parsed.col);
        console.log(message);

        if (message.startsWith("Reservation confirmed:")) {
          saveSeatState(matrix);
        }

        continue;
      }

      if (choice === "5") {
        const rowInput = (await rl.question(`Unreserve row (1-${TOTAL_ROWS}): `)).trim();
        const colInput = (await rl.question(`Unreserve col (1-${TOTAL_COLS}): `)).trim();
        const parsed = parseCoordinateArgs([rowInput, colInput]);

        if (!parsed) {
          console.log("Invalid coordinates. Please enter whole numbers.");
          continue;
        }

        const message = unreserveSeat(matrix, parsed.row, parsed.col);
        console.log(message);

        if (message.startsWith("Unreservation confirmed:")) {
          saveSeatState(matrix);
        }

        continue;
      }

      if (choice === "6") {
        const adjacentResult = findFirstAdjacentAvailableSeats(matrix);
        console.log(adjacentResult.message);
        continue;
      }

      if (choice === "7") {
        for (let row = 1; row <= TOTAL_ROWS; row++) {
          for (let col = 1; col <= TOTAL_COLS; col++) {
            const isOccupied = matrix[row - 1][col - 1] === 1;
            const status = isOccupied ? "occupied" : "available";
            console.log(`R${row}, C${col}: ${status}`);
          }
        }
        continue;
      }

      if (choice === "8") {
        const empty = createEmptyMatrix();

        for (let row = 0; row < TOTAL_ROWS; row++) {
          for (let col = 0; col < TOTAL_COLS; col++) {
            matrix[row][col] = empty[row][col];
          }
        }

        saveSeatState(matrix);
        console.log("Seat state reset. All seats are now available.");
        continue;
      }

      if (choice === "9") {
        console.log("Exiting menu.");
        break;
      }

      console.log("Invalid option. Choose a number from 1 to 9.");
    }
  } finally {
    rl.close();
  }
}

async function run(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  const matrix = loadSeatState();

  switch (command) {
    case "menu": {
      await runMenu(matrix);
      break;
    }

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

    case "count-seats": {
      const counts = countSeatAvailability(matrix);
      console.log(`Total occupied: ${counts.occupied}`);
      console.log(`Total available: ${counts.available}`);
      break;
    }

    case "find-adjacent": {
      const adjacentResult = findFirstAdjacentAvailableSeats(matrix);
      console.log(adjacentResult.message);
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

void run();
