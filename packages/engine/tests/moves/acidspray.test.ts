import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Acid Spray (アシッドボム) lowers target Special Defense by 2 stages", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["acidspray"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "sylveon", ability: "pixilate", moves: ["sleeptalk"] }),
      pokemon({ species: "blastoise", ability: "torrent", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "acidspray", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
        secondary: "inherit", // Acid spray is 100% chance, let it naturally trigger
      },
    },
  );

  env.executeAndAssert("move acidspray 1, move sleeptalk", "move sleeptalk, move sleeptalk");

  const state = env.engine.get_state();
  const sylveon = state.p2.active[0];
  if (sylveon.boosts.spd !== -2) {
    throw new Error(`Expected Sylveon's Sp.Def boost to be -2, got ${sylveon.boosts.spd}`);
  }
});
