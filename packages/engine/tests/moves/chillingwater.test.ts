import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Chilling Water", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gyarados", ability: "intimidate", moves: ["chillingwater"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "chillingwater", secondary: "always" }, "sleeptalk"],
      engineConfig: { secondary: "always", damage_roll: "max" },
    },
  );

  env.executeAndAssert("move chillingwater 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
