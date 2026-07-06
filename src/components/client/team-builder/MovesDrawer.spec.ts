import { describe, it, expect } from "vitest";
import { MoveList } from "@/data/moves";
import enTranslation from "../../../../public/locales/en/translation.json";
import jaTranslation from "../../../../public/locales/ja/translation.json";

const enMoves = (enTranslation as Record<string, any>).moves as Record<
  string,
  { readonly name: string }
>;
const jaMoves = (jaTranslation as Record<string, any>).moves as Record<
  string,
  { readonly name: string }
>;

// ---------------------------------------------------------------------------
// Font-metrics-based text width estimation
//
// happy-dom does not implement CanvasRenderingContext2D.getContext("2d"), so we
// use a character-advance-width lookup table derived from proportional sans-serif
// metrics (similar to the Segoe UI / Arial / Helvetica family).
//
// Source of ratios: average advance widths (relative to em) for Windows/macOS
// system sans-serif fonts, scaled to 17.6px and font-weight:800.
// Bold weight adds approximately 8-10% to advance widths vs. regular.
//
// For CJK full-width characters (Japanese kana/kanji), width = 1em = 17.6px.
// ---------------------------------------------------------------------------

/** Estimated advance width per character at 800 17.6px sans-serif, in pixels. */
const CHAR_WIDTHS: Record<string, number> = {
  " ": 4.4,
  "!": 5.3,
  '"': 6.2,
  "#": 11.0,
  $: 9.7,
  "%": 13.2,
  "&": 11.4,
  "'": 4.0,
  "(": 5.5,
  ")": 5.5,
  "*": 7.9,
  "+": 11.0,
  ",": 4.4,
  "-": 5.7,
  ".": 4.4,
  "/": 5.3,
  "0": 9.7,
  "1": 9.7,
  "2": 9.7,
  "3": 9.7,
  "4": 9.7,
  "5": 9.7,
  "6": 9.7,
  "7": 9.7,
  "8": 9.7,
  "9": 9.7,
  ":": 4.8,
  ";": 4.8,
  "<": 11.0,
  "=": 11.0,
  ">": 11.0,
  "?": 8.4,
  "@": 17.6,
  A: 11.4,
  B: 11.0,
  C: 11.4,
  D: 12.3,
  E: 9.7,
  F: 9.2,
  G: 12.3,
  H: 12.3,
  I: 4.8,
  J: 6.2,
  K: 11.4,
  L: 9.7,
  M: 14.1,
  N: 12.3,
  O: 13.2,
  P: 10.6,
  Q: 13.2,
  R: 11.4,
  S: 10.1,
  T: 9.7,
  U: 12.3,
  V: 11.4,
  W: 15.4,
  X: 10.6,
  Y: 10.6,
  Z: 10.6,
  "[": 5.3,
  "\\": 5.3,
  "]": 5.3,
  "^": 11.0,
  _: 8.8,
  "`": 6.6,
  a: 9.7,
  b: 10.1,
  c: 8.8,
  d: 10.1,
  e: 9.7,
  f: 5.7,
  g: 10.1,
  h: 10.1,
  i: 4.4,
  j: 4.4,
  k: 9.7,
  l: 4.4,
  m: 15.4,
  n: 10.1,
  o: 10.1,
  p: 10.1,
  q: 10.1,
  r: 6.2,
  s: 8.4,
  t: 6.6,
  u: 10.1,
  v: 9.2,
  w: 13.2,
  x: 9.2,
  y: 9.2,
  z: 8.8,
  "{": 6.6,
  "|": 4.8,
  "}": 6.6,
  "~": 11.0,
};

/** Full-width em for CJK / Japanese kana at 17.6px */
const CJK_WIDTH = 17.6;
/** Fallback for any character not in the table */
const DEFAULT_WIDTH = 9.7;

function estimateTextWidth(text: string): number {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    // CJK Unified Ideographs, Hiragana, Katakana, Hangul, etc.
    if (
      (code >= 0x3000 && code <= 0x9fff) || // CJK + kana
      (code >= 0xac00 && code <= 0xd7af) || // Hangul syllables
      (code >= 0xf900 && code <= 0xfaff) || // CJK compatibility
      (code >= 0xff00 && code <= 0xffef) // Halfwidth/fullwidth forms
    ) {
      width += CJK_WIDTH;
    } else {
      width += CHAR_WIDTHS[ch] ?? DEFAULT_WIDTH;
    }
  }
  return width;
}

// ---------------------------------------------------------------------------
// Layout geometry
// ---------------------------------------------------------------------------

/**
 * Compute the pixel width available for the move name Typography at a given
 * breakpoint, assuming usage rate 100% (percentage chip shown), and the
 * move's actual priority and classification counts.
 *
 * Layout facts from MovesDrawer.tsx:
 *
 * Drawer paper widths: sm=420px, md/lg=560px
 * Outer Stack p:2 → padding 16px each side = 32px total
 *
 * At sm (direction=column for outer Stack, direction=row for inner Stack):
 *   Right stack is on next row → innerStackWidth = 420 - 32 = 388px
 *   classifications hidden (display:{xs:"none", md:"flex"})
 *
 * At md/lg (direction=row for outer Stack):
 *   Right stack widths: type(90) + category(40) + PWR(48) + ACC(48) + RANGE(80) = 306px
 *   innerStackWidth = 560 - 32 - 306 = 222px
 *   classifications visible
 *
 * Inner Stack spacing={1.5} = 12px gaps between items.
 * percentage Typography: width:48, flexShrink:0
 * priority Chip: ~90px (conservative), flexShrink:0
 * each classification Chip: ~60px + 4px gap between chips, flexShrink:0
 */
function availableWidthForName(
  breakpoint: "sm" | "md" | "lg",
  hasPercentage: boolean,
  hasPriority: boolean,
  classificationCount: number,
): number {
  const gap = 12;

  if (breakpoint === "sm" || breakpoint === "md") {
    // 2-row layout: Row 1 has only % + name
    const drawerWidth = breakpoint === "sm" ? 420 : 560;
    const padding = 32;
    const percentageWidth = hasPercentage ? 48 + gap : 0;
    return drawerWidth - padding - percentageWidth;
  }

  // lg: 1-row layout — all elements beside name
  // drawer=900, padding=32, right stack=306
  // inner stack = 900 - 32 - 306 = 562px
  // subtract: %(48+12) + priority(90+12) + classifications(count*60+(count-1)*4+12)
  const innerStack = 562;
  const percentageWidth = hasPercentage ? 48 + gap : 0;
  const priorityWidth = hasPriority ? 90 + gap : 0;
  const classificationsWidth =
    classificationCount > 0 ? classificationCount * 60 + (classificationCount - 1) * 4 + gap : 0;
  return innerStack - percentageWidth - priorityWidth - classificationsWidth;
}

// ---------------------------------------------------------------------------
// Core detection logic
// ---------------------------------------------------------------------------

interface TruncatedMove {
  readonly identifier: string;
  readonly name: string;
  readonly availableWidth: number;
  readonly textWidth: number;
}

function findTruncatedMoves(locale: "en" | "ja", breakpoint: "sm" | "md" | "lg"): TruncatedMove[] {
  const moves = locale === "en" ? enMoves : jaMoves;
  const truncated: TruncatedMove[] = [];

  for (const move of MoveList) {
    const name = moves[move.identifier]?.name ?? "";
    if (!name) continue;

    const available = availableWidthForName(
      breakpoint,
      true, // worst case: usage rate = 100%, so percentage chip is shown
      move.priority !== null && move.priority !== 0,
      move.classifications.length,
    );

    if (available <= 0) {
      // No space at all — definitely truncated, no need to measure text
      truncated.push({
        identifier: move.identifier,
        name,
        availableWidth: available,
        textWidth: -1,
      });
      continue;
    }

    const textWidth = estimateTextWidth(name);
    if (textWidth > available) {
      truncated.push({ identifier: move.identifier, name, availableWidth: available, textWidth });
    }
  }

  return truncated;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MovesDrawer — 採用率100%時に技名が省略されないこと (sm〜lg 全ブレークポイント)", () => {
  // --- Translation key existence checks ---
  it.concurrent.for(MoveList)(
    "EN: $identifier の技名が translation.json に存在し空でない",
    (move, { expect }) => {
      const name = enMoves[move.identifier]?.name;
      expect(
        name,
        `moves.${move.identifier}.name が en/translation.json に存在しない`,
      ).toBeDefined();
      expect(name?.trim(), `moves.${move.identifier}.name が空`).not.toBe("");
    },
  );

  it.concurrent.for(MoveList)(
    "JA: $identifier の技名が translation.json に存在し空でない",
    (move, { expect }) => {
      const name = jaMoves[move.identifier]?.name;
      expect(
        name,
        `moves.${move.identifier}.name が ja/translation.json に存在しない`,
      ).toBeDefined();
      expect(name?.trim(), `moves.${move.identifier}.name が空`).not.toBe("");
    },
  );

  // --- Truncation checks per breakpoint ---
  for (const bp of ["sm", "md", "lg"] as const) {
    for (const locale of ["en", "ja"] as const) {
      it(`[${bp}/${locale.toUpperCase()}] 採用率100%で全技名が省略されない`, () => {
        const truncated = findTruncatedMoves(locale, bp);
        expect(
          truncated,
          `[${bp}/${locale.toUpperCase()}] 採用率100%時に以下の技名が省略される:\n` +
            truncated
              .map(
                (m) =>
                  `  ${m.identifier}: "${m.name}" ` +
                  `(available:${m.availableWidth.toFixed(0)}px, ` +
                  `text:${m.textWidth < 0 ? "overflow(no space)" : m.textWidth.toFixed(1) + "px"})`,
              )
              .join("\n"),
        ).toHaveLength(0);
      });
    }
  }
});
