import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Aerial Ace (つばめがえし) always hits, ignoring evasion/accuracy modifiers", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", ability: "blaze", moves: ["aerial-ace"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "sylveon", ability: "pixilate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["aerialace", "sleeptalk"],
      engineConfig: {
        damage_roll: "max",
      },
    },
  );

  // Evasion +6, Accuracy -6. Aerial ace should still hit.

  env.executeAndAssert("move aerialace 1, move sleeptalk", "move sleeptalk, move sleeptalk");

  const p2 = env.engine.get_state().p2.active[0];
  if (p2.hp === p2.maxhp) {
    throw new Error("Aerial Ace failed to hit");
  }
});
