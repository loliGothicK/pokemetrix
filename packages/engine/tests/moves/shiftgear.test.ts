import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Shift Gear", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "toxtricity-amped", ability: "plus", moves: ["shiftgear", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["shiftgear", "sleeptalk"],
    },
  );
  env.executeAndAssert("move shiftgear, move sleeptalk", "move sleeptalk, move sleeptalk");
});
