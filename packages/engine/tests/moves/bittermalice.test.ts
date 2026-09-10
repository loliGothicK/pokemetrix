import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Bitter Malice", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "hisuianzoroark", ability: "illusion", moves: ["bittermalice"] }),
      pokemon({ species: "pidgeot", ability: "keeneye", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "lightningrod", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [
        { id: "bittermalice", accuracy: true, secondary: "inherit" },
        "sleeptalk",
      ],
      engineConfig: { accuracy: "always", damage_roll: "max", secondary: "always" },
    },
  );

  // Snorlax uses Bitter Malice on Clefable (target 1)
  env.executeAndAssert("move bittermalice 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
