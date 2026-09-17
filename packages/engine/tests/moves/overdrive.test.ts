import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Overdrive hits both opponents with sound-based damage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "toxtricity-amped", ability: "plus", moves: ["overdrive", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["overdrive", "sleeptalk"],
    },
  );

  env.executeAndAssert("move overdrive, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Overdrive is blocked by Soundproof", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "toxtricity-amped", ability: "plus", moves: ["overdrive", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "kommo-o", ability: "soundproof", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["overdrive", "sleeptalk"],
    },
  );

  env.executeAndAssert("move overdrive, move sleeptalk", "move sleeptalk, move sleeptalk");
});
