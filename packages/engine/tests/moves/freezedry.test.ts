import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Freeze-Dry is super effective against Water", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "glaceon", ability: "snowcloak", moves: ["freezedry", "sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
      pokemon({ species: "gyarados", ability: "intimidate", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "freezedry", damage_roll: "max" }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  // Vaporeon is pure Water, Gyarados is Water/Flying
  // Freeze-Dry is super effective against Vaporeon (x2)
  env.executeAndAssert("move freezedry 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  // Freeze-Dry is super effective against Gyarados (x4)
  env.executeAndAssert("move freezedry 2, move sleeptalk", "move sleeptalk, move sleeptalk");
});
