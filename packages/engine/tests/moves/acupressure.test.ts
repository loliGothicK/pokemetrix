import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Acupressure (つぼをつく) boosts a random unmaxed stat by 2", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "malamar", ability: "suctioncups", moves: ["acupressure"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "umbreon", ability: "synchronize", moves: ["sleeptalk"] }),
      pokemon({ species: "sylveon", ability: "pixilate", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["acupressure", "sleeptalk"],
    },
  );

  // Target self (-1)
  env.executeAndAssert("move acupressure -1, move sleeptalk", "move sleeptalk, move sleeptalk", {
    stat_choices: ["spe"],
  });

  const state = env.engine.get_state();
  const pika = state.p1.active[0];

  let boostedStats = 0;
  for (const stat of ["atk", "def", "spa", "spd", "spe", "accuracy", "evasion"] as const) {
    if (pika.boosts[stat] === 2) {
      boostedStats++;
    } else if (pika.boosts[stat] !== 0) {
      throw new Error(`Expected stat to be 0 or 2, got ${pika.boosts[stat]} for ${stat}`);
    }
  }

  if (boostedStats !== 1) {
    throw new Error(`Expected exactly 1 stat to be boosted by 2, got ${boostedStats}`);
  }
});
