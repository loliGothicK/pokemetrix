import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Zing Zap", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pincurchin", ability: "lightningrod", moves: ["zingzap", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["zingzap", "sleeptalk"],
    },
  );
  env.executeAndAssert("move zingzap 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Zing Zap is absorbed by Volt Absorb", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pincurchin", ability: "lightningrod", moves: ["zingzap", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pawmot", ability: "voltabsorb", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["zingzap", "sleeptalk"],
    },
  );
  env.executeAndAssert("move zingzap 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
