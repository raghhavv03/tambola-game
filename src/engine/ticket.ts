// The ticket engine. Pure TypeScript: no React, no imports from the rest of the app.
// It builds valid tambola tickets and checks winning claims. It never touches the
// caller, never fetches anything, never shares state — a player's ticket is generated
// from a seed and nothing else (see THE AIRGAP in CLAUDE.md). The matching of a called
// number to a ticket cell happens in a human's head; this file only VERIFIES a claim a
// human has already made, when the host chooses to check it.

import { mulberry32 } from './rng'

// A cell is either a number or a blank.
export type Cell = number | null

// A ticket is 3 rows × 9 columns. Always exactly 15 numbers and 12 blanks.
export type Ticket = Cell[][]

// The six standard tambola winning patterns ("dividends").
export type Dividend =
  | 'earlyFive' // first 5 numbers anywhere on the ticket
  | 'topLine' // all 5 numbers in row 0
  | 'middleLine' // all 5 numbers in row 1
  | 'bottomLine' // all 5 numbers in row 2
  | 'corners' // the 4 extreme numbers: first & last of top row, first & last of bottom
  | 'fullHouse' // all 15 numbers

const ROWS = 3
const COLS = 9
const NUMBERS_PER_ROW = 5
const TOTAL_NUMBERS = 15 // 3 rows × 5

// --- Column number ranges ------------------------------------------------------
//
// Column 0 holds 1–9, column 1 holds 10–19, … column 8 holds 80–90. Note the two odd
// ones out: column 0 starts at 1 (not 0) so it has 9 candidates, and column 8 runs all
// the way to 90 so it has 11. Every range has at least 3 candidates, which is the most
// a single column can need.
function columnRange(col: number): { low: number; high: number } {
  const low = col === 0 ? 1 : col * 10
  const high = col === COLS - 1 ? 90 : col * 10 + 9
  return { low, high }
}

// --- Step 1: how many numbers go in each column --------------------------------
//
// 9 columns, each must hold 1–3 numbers, and they must total 15. We start every column
// at 1 (that's the "at least 1" rule and uses up 9 of the 15), then hand out the
// remaining 6 to random columns that aren't already full at 3. This can never fail:
// there's room for 18 total (9 columns × 3) and we only need to reach 15.
function buildColumnCounts(rand: () => number): number[] {
  const counts = new Array<number>(COLS).fill(1)
  let toPlace = TOTAL_NUMBERS - COLS // 6
  while (toPlace > 0) {
    const col = Math.floor(rand() * COLS)
    if (counts[col] < 3) {
      counts[col]++
      toPlace--
    }
  }
  return counts
}

// Rank indices by a numeric key, highest first, with random tie-breaking. We compute a
// random tiebreak up front (rather than calling rand() inside the sort comparator) so
// the comparator stays consistent — a comparator that returns random values for equal
// items is a classic sorting bug.
function rankByKeyDesc(
  indices: number[],
  key: (i: number) => number,
  rand: () => number,
): number[] {
  return indices
    .map((i) => ({ i, k: key(i), tie: rand() }))
    .sort((a, b) => b.k - a.k || a.tie - b.tie)
    .map((x) => x.i)
}

// --- Step 2: decide WHICH rows each column fills -------------------------------
//
// Given the per-column counts, we build a 3×9 boolean mask of filled cells with two
// hard requirements: each column fills exactly `counts[col]` of its 3 rows, and each
// ROW ends up with exactly 5 filled cells.
//
// This is the Havel-Hakimi construction: process columns from the most-demanding
// (count 3) down, and for each, fill the rows that currently have the most space left.
// Because we already proved the counts are realizable (see the note in the chat / the
// tests), always feeding the neediest column into the roomiest rows is guaranteed to
// finish with every row at exactly 5 — it can't paint itself into a corner.
function buildFillMask(counts: number[], rand: () => number): boolean[][] {
  const filled: boolean[][] = Array.from({ length: ROWS }, () =>
    new Array<boolean>(COLS).fill(false),
  )
  const rowSpaceLeft = new Array<number>(ROWS).fill(NUMBERS_PER_ROW) // [5, 5, 5]

  const allCols = Array.from({ length: COLS }, (_, c) => c)
  const colsByNeed = rankByKeyDesc(allCols, (c) => counts[c], rand)

  for (const col of colsByNeed) {
    const need = counts[col]
    const allRows = [0, 1, 2]
    const roomiestRows = rankByKeyDesc(allRows, (r) => rowSpaceLeft[r], rand)
    for (let k = 0; k < need; k++) {
      const row = roomiestRows[k]
      filled[row][col] = true
      rowSpaceLeft[row]--
    }
  }
  return filled
}

// Pick `count` distinct numbers from [low, high] and return them sorted ascending.
// We shuffle the whole small range with Fisher-Yates and take the first `count`, then
// sort — simple and correct for ranges this small.
function pickSortedNumbers(
  low: number,
  high: number,
  count: number,
  rand: () => number,
): number[] {
  const pool: number[] = []
  for (let n = low; n <= high; n++) pool.push(n)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count).sort((a, b) => a - b)
}

/**
 * Generate one valid tambola ticket.
 *
 * @param seed Same seed => same ticket, every time (deterministic, reproducible).
 * @returns A 3×9 grid of (number | null) satisfying every constraint: 15 numbers, 5
 *          per row, 1–3 per column, correct column ranges, sorted within each column.
 */
export function generateTicket(seed: number): Ticket {
  const rand = mulberry32(seed)

  const counts = buildColumnCounts(rand)
  const filled = buildFillMask(counts, rand)

  const ticket: Ticket = Array.from({ length: ROWS }, () =>
    new Array<Cell>(COLS).fill(null),
  )

  for (let col = 0; col < COLS; col++) {
    // Which rows this column fills, top to bottom. Because we place the sorted numbers
    // into these rows in order, "sorted ascending within the column" comes for free.
    const rowsToFill: number[] = []
    for (let row = 0; row < ROWS; row++) {
      if (filled[row][col]) rowsToFill.push(row)
    }
    const { low, high } = columnRange(col)
    const numbers = pickSortedNumbers(low, high, rowsToFill.length, rand)
    rowsToFill.forEach((row, index) => {
      ticket[row][col] = numbers[index]
    })
  }

  return ticket
}

// Turn a ticket into a stable string so we can spot duplicates. Blanks become "_".
function serializeTicket(ticket: Ticket): string {
  return ticket.map((row) => row.map((cell) => cell ?? '_').join(',')).join('|')
}

/**
 * Generate a set of `n` tickets with no two identical.
 *
 * @param n    How many tickets to produce.
 * @param seed Same (n, seed) => same set, every time.
 *
 * Note: this only guarantees the tickets are DISTINCT. It does NOT implement the
 * stricter traditional "book of 6" property (6 tickets that together use each of 1–90
 * exactly once) — you asked for arbitrary n with no duplicates, so that's what this
 * does. Say the word if you want the book-of-6 variant; it's a different algorithm.
 */
export function generateSet(n: number, seed: number): Ticket[] {
  const rand = mulberry32(seed)
  const tickets: Ticket[] = []
  const seen = new Set<string>()

  // Duplicate tickets are astronomically unlikely given the size of the ticket space,
  // but we check anyway and just draw another seed on the rare collision.
  while (tickets.length < n) {
    const subSeed = Math.floor(rand() * 0xffffffff)
    const ticket = generateTicket(subSeed)
    const key = serializeTicket(ticket)
    if (!seen.has(key)) {
      seen.add(key)
      tickets.push(ticket)
    }
  }
  return tickets
}

// --- Claim verification --------------------------------------------------------

export interface ClaimResult {
  valid: boolean // does the claim actually hold given the called numbers?
  marked: number[] // the relevant ticket numbers that HAVE been called
  missing: number[] // the relevant ticket numbers that have NOT been called yet
}

// All the numbers in one row, left to right (blanks skipped).
function rowNumbers(ticket: Ticket, row: number): number[] {
  return ticket[row].filter((cell): cell is number => cell !== null)
}

// The numbers that "count" for a given dividend — the region a player must fill.
function relevantNumbers(ticket: Ticket, dividend: Dividend): number[] {
  switch (dividend) {
    case 'topLine':
      return rowNumbers(ticket, 0)
    case 'middleLine':
      return rowNumbers(ticket, 1)
    case 'bottomLine':
      return rowNumbers(ticket, 2)
    case 'corners': {
      // First and last number of the top row, and of the bottom row. Each row always
      // has exactly 5 numbers, so [0] and [length - 1] are always safe.
      const top = rowNumbers(ticket, 0)
      const bottom = rowNumbers(ticket, 2)
      return [top[0], top[top.length - 1], bottom[0], bottom[bottom.length - 1]]
    }
    case 'earlyFive':
    case 'fullHouse':
      // Both care about the whole ticket; they differ only in how many are required.
      return ticket.flat().filter((cell): cell is number => cell !== null)
  }
}

/**
 * Verify a player's claim for a dividend against the numbers called so far.
 *
 * IMPORTANT: this does not watch tickets or auto-detect wins. The host calls it only
 * when a player shouts a claim, to confirm or deny it. That's the whole airgap — the
 * app never volunteers that a ticket is one away, never marks anything for the player.
 *
 * @param ticket        the claimant's ticket
 * @param calledNumbers every number drawn so far (order doesn't matter)
 * @param dividend      which pattern is being claimed
 */
export function verifyClaim(
  ticket: Ticket,
  calledNumbers: number[],
  dividend: Dividend,
): ClaimResult {
  const called = new Set(calledNumbers)
  const relevant = relevantNumbers(ticket, dividend)

  const marked = relevant.filter((n) => called.has(n))
  const missing = relevant.filter((n) => !called.has(n))

  // Early Five needs ANY five of the ticket's numbers; every other dividend needs its
  // whole region complete (nothing missing).
  const valid =
    dividend === 'earlyFive' ? marked.length >= 5 : missing.length === 0

  return { valid, marked, missing }
}
