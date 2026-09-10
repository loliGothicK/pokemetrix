import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Acid Armor (とける) boosts Defense by 2 stages", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["acidarmor"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "sylveon", ability: "pixilate", moves: ["sleeptalk"] }),
      pokemon({ species: "blastoise", ability: "torrent", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["acidarmor", "sleeptalk"],
    },
  );

  env.executeAndAssert("move acidarmor, move sleeptalk", "move sleeptalk, move sleeptalk");

  const state = env.engine.get_state();
  const vaporeon = state.p1.active[0];
  if (vaporeon.boosts.def !== 2) {
    throw new Error(`Expected Vaporeon's Defense boost to be 2, got ${vaporeon.boosts.def}`);
  }
});
