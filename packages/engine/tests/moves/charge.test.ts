import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Charge applies VolatileStatus::Charge and doubles next Electric move", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["charge", "thunderbolt"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [
        { id: "charge", damage_roll: "max" },
        "sleeptalk",
        { id: "thunderbolt", damage_roll: "max" },
      ],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  env.executeTurn("move charge, move sleeptalk", "move sleeptalk, move sleeptalk");
});
